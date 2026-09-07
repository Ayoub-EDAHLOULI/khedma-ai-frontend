"use client";

import { useCallback, useRef, useState } from "react";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface UseSpeechInputOptions {
  lang?: string;
  onResult: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
}

export function useSpeechInput({
  lang,
  onResult,
  onInterimResult,
}: UseSpeechInputOptions) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => getSpeechRecognitionCtor() !== null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || listening) return;

    const recognition = new Ctor();
    recognition.lang = lang ?? "";
    recognition.interimResults = Boolean(onInterimResult);
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      const transcript = last[0].transcript;
      if (last.isFinal) {
        onResult(transcript);
      } else {
        onInterimResult?.(transcript);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [lang, listening, onResult, onInterimResult]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
