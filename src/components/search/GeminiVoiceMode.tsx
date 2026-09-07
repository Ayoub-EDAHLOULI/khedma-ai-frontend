"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import {
  useGeminiLiveVoice,
  type SearchJobsArgs,
} from "@/hooks/useGeminiLiveVoice";
import { MatchCard } from "@/components/search/MatchCard";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/types/api";

interface GeminiVoiceModeProps {
  onClose: () => void;
  onSearchJobs: (args: SearchJobsArgs) => Promise<SearchResult>;
}

const STATUS_LABEL: Record<string, string> = {
  idle: "Starting…",
  connecting: "Connecting…",
  connected: "Listening — talk anytime",
  error: "Something went wrong",
  closed: "Session ended",
};

// Step 2 of the Gemini Live integration: real-time voice conversation with
// the search_jobs tool wired to our existing /search pipeline — see
// CLAUDE.md "Future direction — Voice conversation". Gemini only narrates
// results our own backend returns; it never invents matches. Reuses the
// existing orb visual as-is; avatar/state polish is a separate later pass.
export function GeminiVoiceMode({
  onClose,
  onSearchJobs,
}: GeminiVoiceModeProps) {
  const { status, error, connect, disconnect, lastSearchResult } =
    useGeminiLiveVoice({ onSearchJobs });

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleClose() {
    disconnect();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="page-glow" />

      <button
        type="button"
        onClick={handleClose}
        aria-label="Close voice mode"
        className="absolute top-6 right-6 z-20 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="size-5" />
      </button>

      <div className="relative z-10 flex flex-1 flex-col items-center overflow-y-auto scrollbar-hide px-6 pb-10 pt-24">
        <div
          className={cn(
            "relative size-40 shrink-0 rounded-full",
            status === "connected"
              ? "animate-voice-listening"
              : "animate-voice-idle",
          )}
          style={{
            background:
              "radial-gradient(circle at 35% 30%, var(--primary), var(--secondary) 65%, transparent 100%)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full mix-blend-screen"
            style={{
              background:
                "radial-gradient(circle at 65% 70%, color-mix(in oklch, var(--secondary), transparent 30%), transparent 60%)",
            }}
          />
        </div>

        <p className="mt-8 max-w-xl text-center text-sm text-muted-foreground">
          {error ?? STATUS_LABEL[status]}
        </p>

        {lastSearchResult && (
          <div className="mt-8 w-full max-w-xl">
            <p className="text-foreground leading-relaxed font-arabic-aware">
              {lastSearchResult.reply}
            </p>
            {lastSearchResult.results.length > 0 && (
              <div className="mt-4 grid gap-1">
                {lastSearchResult.results.map((item) => (
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
