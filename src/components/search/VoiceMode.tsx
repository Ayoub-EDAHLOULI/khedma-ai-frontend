"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { MatchCard } from "@/components/search/MatchCard";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { cn } from "@/lib/utils";
import type { SearchResultItem } from "@/types/api";

type VoiceState = "listening" | "thinking" | "speaking" | "idle";

interface VoiceModeProps {
  onClose: () => void;
  onSubmit: (
    message: string,
  ) => Promise<{ reply: string; results: SearchResultItem[] }>;
}

const orbAnimationClass: Record<VoiceState, string> = {
  listening: "animate-voice-listening",
  thinking: "animate-voice-thinking",
  speaking: "animate-voice-speaking",
  idle: "animate-voice-idle",
};

export function VoiceMode({ onClose, onSubmit }: VoiceModeProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const submittingRef = useRef(false);

  const handleFinalResult = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || submittingRef.current) return;
      submittingRef.current = true;
      setInterim("");
      setReply(null);
      setResults([]);
      setVoiceState("thinking");

      try {
        const result = await onSubmit(transcript);
        setReply(result.reply);
        setResults(result.results);
        setVoiceState("speaking");
      } catch {
        setVoiceState("idle");
      } finally {
        submittingRef.current = false;
      }
    },
    [onSubmit],
  );

  const {
    listening,
    supported,
    start: startListening,
    stop: stopListening,
  } = useSpeechInput({
    onResult: handleFinalResult,
    onInterimResult: setInterim,
  });

  const displayState: VoiceState = listening ? "listening" : voiceState;

  useEffect(() => {
    if (supported) startListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleMicClick() {
    if (listening) {
      stopListening();
    } else {
      setVoiceState("idle");
      startListening();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="page-glow" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Close voice mode"
        className="absolute top-6 right-6 z-20 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="size-5" />
      </button>

      <div className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto scrollbar-hide px-6 pb-10 pt-24">
        <button
          type="button"
          onClick={handleMicClick}
          aria-label={listening ? "Stop listening" : "Start listening"}
          className="relative shrink-0 rounded-full outline-none"
        >
          <div
            className={cn(
              "size-40 rounded-full transition-transform",
              orbAnimationClass[displayState],
            )}
            style={{
              background:
                "radial-gradient(circle at 35% 30%, var(--primary), var(--secondary) 65%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0 rounded-full mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at 65% 70%, color-mix(in oklch, var(--secondary), transparent 30%), transparent 60%)",
            }}
          />
        </button>

        <p className="mt-8 min-h-6 max-w-xl text-center text-sm text-muted-foreground">
          {!supported
            ? "Voice input isn't supported in this browser."
            : displayState === "listening"
              ? "Listening…"
              : displayState === "thinking"
                ? "Thinking…"
                : displayState === "idle" && !reply
                  ? "Tap the orb to speak"
                  : null}
        </p>

        {interim && (
          <p
            dir="auto"
            className="mt-4 max-w-xl text-center text-lg text-foreground font-arabic-aware"
          >
            {interim}
          </p>
        )}

        {reply && (
          <div className="mt-8 w-full max-w-xl">
            <p className="text-foreground leading-relaxed font-arabic-aware">
              {reply}
            </p>
            {results.length > 0 && (
              <div className="mt-4 grid gap-1">
                {results.map((item) => (
                  <MatchCard key={item.match_id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
