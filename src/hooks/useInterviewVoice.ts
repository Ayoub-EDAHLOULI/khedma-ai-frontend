"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality, type Session } from "@google/genai";
import { interviewsService } from "@/services/interviews.service";
import type { InterviewSpeaker, InterviewTurn } from "@/types/api";

export type InterviewVoiceStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

function base64ToInt16Array(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function int16ArrayToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

interface UseInterviewVoiceOptions {
  sessionId: string;
  // Called each time a transcript turn is finalized locally, before the
  // persistence call to the backend resolves — lets the UI show the
  // transcript live instead of waiting on a round-trip.
  onTurn?: (turn: InterviewTurn) => void;
}

// Adapted from useGeminiLiveVoice.ts (the generic search-jobs voice
// assistant) but without any tool-calling — an interview session never
// triggers app actions mid-conversation, it only talks. The system
// instruction is entirely server-side (see /interviews/{id}/voice-token),
// never built here. Transcript turns come from Gemini Live's native
// input/output audio transcription, not a separate STT call: each
// finalized transcription segment is persisted as one InterviewTurn.
export function useInterviewVoice({
  sessionId,
  onTurn,
}: UseInterviewVoiceOptions) {
  const [status, setStatus] = useState<InterviewVoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<InterviewTurn[]>([]);

  const sessionRef = useRef<Session | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackCursorRef = useRef(0);
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Accumulates in-progress transcription text per speaker until Gemini
  // marks a segment finished — the API streams transcription in small
  // chunks (`{text, finished}`), not one message per turn.
  const pendingInputRef = useRef("");
  const pendingOutputRef = useRef("");

  const persistTurn = useCallback(
    (speaker: InterviewSpeaker, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      interviewsService
        .addTurn(sessionId, { speaker, content: trimmed })
        .then((turn) => {
          setTurns((prev) => [...prev, turn]);
          onTurn?.(turn);
        })
        .catch(() => {
          // Best-effort: a dropped turn shouldn't interrupt a live
          // conversation. The full transcript is re-fetchable from the
          // backend afterward for scoring, so a rare miss here isn't fatal,
          // but consider surfacing a toast if this proves to happen often.
        });
    },
    [sessionId, onTurn],
  );

  const stopPlayback = useCallback(() => {
    for (const source of playbackSourcesRef.current) {
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    playbackSourcesRef.current = [];
    if (playbackContextRef.current) {
      playbackCursorRef.current = playbackContextRef.current.currentTime;
    }
  }, []);

  const playAudioChunk = useCallback((base64Data: string) => {
    const ctx = playbackContextRef.current;
    if (!ctx) return;

    const pcm16 = base64ToInt16Array(base64Data);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;

    const buffer = ctx.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(float32, 0);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(playbackCursorRef.current, ctx.currentTime);
    source.start(startAt);
    playbackCursorRef.current = startAt + buffer.duration;

    playbackSourcesRef.current.push(source);
    source.onended = () => {
      playbackSourcesRef.current = playbackSourcesRef.current.filter(
        (s) => s !== source,
      );
    };
  }, []);

  const disconnect = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;

    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;

    captureContextRef.current?.close().catch(() => {});
    captureContextRef.current = null;

    playbackContextRef.current?.close().catch(() => {});
    playbackContextRef.current = null;
    playbackSourcesRef.current = [];
    playbackCursorRef.current = 0;

    sessionRef.current?.close();
    sessionRef.current = null;

    // Flush any transcription still pending when the session ends (e.g. the
    // user hangs up mid-sentence) rather than silently dropping it.
    if (pendingInputRef.current.trim()) {
      persistTurn("candidate", pendingInputRef.current);
      pendingInputRef.current = "";
    }
    if (pendingOutputRef.current.trim()) {
      persistTurn("interviewer", pendingOutputRef.current);
      pendingOutputRef.current = "";
    }

    setStatus("closed");
  }, [persistTurn]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    try {
      const tokenResult = await interviewsService.createVoiceToken(sessionId);

      const ai = new GoogleGenAI({ apiKey: tokenResult.token });

      const playbackContext = new AudioContext({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      playbackContextRef.current = playbackContext;
      playbackCursorRef.current = playbackContext.currentTime;

      const session = await ai.live.connect({
        model: tokenResult.model,
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          // onopen can fire before `await ai.live.connect(...)` below
          // returns and assigns sessionRef.current — sendClientContent is
          // called via the connect() promise's own resolved value instead,
          // captured just below, not the ref (which could still be null
          // here).
          onopen: () => setStatus("connected"),
          onmessage: (message) => {
            const content = message.serverContent;
            if (content?.interrupted) {
              stopPlayback();
            }

            const audioData = message.data;
            if (audioData) {
              playAudioChunk(audioData);
            }

            const inputChunk = content?.inputTranscription;
            if (inputChunk?.text) {
              pendingInputRef.current += inputChunk.text;
            }
            if (inputChunk?.finished && pendingInputRef.current.trim()) {
              persistTurn("candidate", pendingInputRef.current);
              pendingInputRef.current = "";
            }

            const outputChunk = content?.outputTranscription;
            if (outputChunk?.text) {
              pendingOutputRef.current += outputChunk.text;
            }
            if (outputChunk?.finished && pendingOutputRef.current.trim()) {
              persistTurn("interviewer", pendingOutputRef.current);
              pendingOutputRef.current = "";
            }

            // Some turns end without an explicit `finished` flag on the
            // last chunk — flush whatever's pending when the model
            // considers its turn complete, as a safety net.
            if (content?.turnComplete && pendingOutputRef.current.trim()) {
              persistTurn("interviewer", pendingOutputRef.current);
              pendingOutputRef.current = "";
            }
          },
          onerror: (e) => {
            setError(e.message || "Interview session error");
            setStatus("error");
          },
          onclose: () => setStatus("closed"),
        },
      });

      sessionRef.current = session;

      // A Live session only ever responds to input — it never speaks
      // unprompted. The system instruction tells the interviewer persona to
      // open with an introduction and the first question, but that only
      // fires once something kicks off a turn. This sends a silent
      // text-only turn to trigger that opening line without the candidate
      // having to speak first.
      session.sendClientContent({
        turns:
          "Please begin the interview now. Remember: your first question " +
          "must be the mandatory broad opener from your instructions " +
          "(e.g. asking the candidate to walk you through their " +
          "background) — not a question about the role, company, or " +
          "motivation.",
        turnComplete: true,
      });

      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      micStreamRef.current = micStream;

      const captureContext = new AudioContext();
      captureContextRef.current = captureContext;
      await captureContext.audioWorklet.addModule(
        "/worklets/pcm-recorder-processor.js",
      );

      const source = captureContext.createMediaStreamSource(micStream);
      const workletNode = new AudioWorkletNode(
        captureContext,
        "pcm-recorder-processor",
      );
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        const pcm16 = new Int16Array(event.data);
        sessionRef.current?.sendRealtimeInput({
          audio: {
            data: int16ArrayToBase64(pcm16),
            mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
          },
        });
      };

      source.connect(workletNode);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start the interview",
      );
      setStatus("error");
      disconnect();
    }
  }, [sessionId, disconnect, playAudioChunk, stopPlayback, persistTurn]);

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, error, turns, connect, disconnect };
}
