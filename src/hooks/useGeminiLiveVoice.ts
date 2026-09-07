"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  GoogleGenAI,
  Modality,
  type FunctionCall,
  type Session,
} from "@google/genai";
import { voiceService } from "@/services/voice.service";
import type { SearchResult } from "@/types/api";

export type GeminiVoiceStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "error"
  | "closed";

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export const SEARCH_JOBS_TOOL_NAME = "search_jobs";

// One natural-language `query` string, re-run through our existing
// language.py -> matching.py pipeline server-side — same as typed search, so
// there is no separate NLU logic living inside this tool declaration.
// scope/remote_only/country/seniority are optional explicit overrides for
// when the user was specific about them, mirroring the UI's filter chips.
const SEARCH_JOBS_DECLARATION = {
  name: SEARCH_JOBS_TOOL_NAME,
  description:
    "Search the user's already-ingested job postings for matches. Call this " +
    "whenever the user asks to find, search for, or look up jobs — pass a " +
    "natural-language query summarizing what they want, in the language they " +
    "used. Only set scope/remote_only/country/seniority when the user was " +
    "explicit about them.",
  parametersJsonSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Natural-language summary of the job the user is looking for, in " +
          "the user's own language (e.g. 'junior software engineer jobs in " +
          "the UK').",
      },
      scope: {
        type: "string",
        enum: ["local", "international"],
        description:
          "Only set if the user explicitly said local or international.",
      },
      remote_only: {
        type: "boolean",
        description:
          "Only set true if the user explicitly asked for remote-only jobs.",
      },
      country: {
        type: "string",
        description:
          "ISO 3166-1 alpha-2 country code, only if the user named a specific country.",
      },
      seniority: {
        type: "string",
        enum: ["junior", "mid", "senior"],
        description:
          "Only set if the user explicitly implied a seniority level.",
      },
    },
    required: ["query"],
  },
};

export interface SearchJobsArgs {
  query: string;
  scope?: "local" | "international";
  remote_only?: boolean;
  country?: string;
  seniority?: "junior" | "mid" | "senior";
}

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

interface UseGeminiLiveVoiceOptions {
  onSearchJobs?: (args: SearchJobsArgs) => Promise<SearchResult>;
}

export function useGeminiLiveVoice({
  onSearchJobs,
}: UseGeminiLiveVoiceOptions = {}) {
  const [status, setStatus] = useState<GeminiVoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastSearchResult, setLastSearchResult] = useState<SearchResult | null>(
    null,
  );

  const onSearchJobsRef = useRef<typeof onSearchJobs>(undefined);
  useEffect(() => {
    onSearchJobsRef.current = onSearchJobs;
  }, [onSearchJobs]);

  const sessionRef = useRef<Session | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const captureContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackCursorRef = useRef(0);
  const playbackSourcesRef = useRef<AudioBufferSourceNode[]>([]);

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

  const handleFunctionCall = useCallback(async (call: FunctionCall) => {
    if (call.name !== SEARCH_JOBS_TOOL_NAME) {
      return {
        id: call.id,
        name: call.name,
        response: { error: "Unknown tool" },
      };
    }

    const handler = onSearchJobsRef.current;
    if (!handler) {
      return {
        id: call.id,
        name: call.name,
        response: { error: "Search is not available right now." },
      };
    }

    try {
      const args = call.args as unknown as SearchJobsArgs;
      const result = await handler(args);
      setLastSearchResult(result);

      // Gemini only gets a compact summary to narrate — the actual job
      // details render client-side via MatchCard from lastSearchResult, so
      // we don't need to round-trip full descriptions through the model.
      return {
        id: call.id,
        name: call.name,
        response: {
          reply: result.reply,
          result_count: result.results.length,
          top_matches: result.results.slice(0, 5).map((r) => ({
            title: r.job.title,
            company: r.job.company,
            score: r.score,
            reasoning: r.reasoning,
          })),
        },
      };
    } catch (err) {
      return {
        id: call.id,
        name: call.name,
        response: {
          error: err instanceof Error ? err.message : "Search failed",
        },
      };
    }
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

    setStatus("closed");
  }, []);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(null);

    try {
      const tokenResult = await voiceService.createSessionToken();

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
          tools: [{ functionDeclarations: [SEARCH_JOBS_DECLARATION] }],
        },
        callbacks: {
          onopen: () => setStatus("connected"),
          onmessage: (message) => {
            if (message.serverContent?.interrupted) {
              stopPlayback();
            }
            const audioData = message.data;
            if (audioData) {
              playAudioChunk(audioData);
            }
            const functionCalls = message.toolCall?.functionCalls;
            if (functionCalls?.length) {
              Promise.all(functionCalls.map(handleFunctionCall)).then(
                (functionResponses) => {
                  sessionRef.current?.sendToolResponse({ functionResponses });
                },
              );
            }
          },
          onerror: (e) => {
            setError(e.message || "Voice session error");
            setStatus("error");
          },
          onclose: () => setStatus("closed"),
        },
      });

      sessionRef.current = session;

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
        err instanceof Error ? err.message : "Failed to start voice session",
      );
      setStatus("error");
      disconnect();
    }
  }, [disconnect, playAudioChunk, stopPlayback, handleFunctionCall]);

  return { status, error, connect, disconnect, lastSearchResult };
}
