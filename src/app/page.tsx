"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { MatchCard } from "@/components/search/MatchCard";
import { AgentAvatar, type AgentState } from "@/components/search/AgentAvatar";
import { ResumeUploadDialog } from "@/components/ResumeUploadDialog";
import { profileService } from "@/services/profile.service";
import { searchService } from "@/services/search.service";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import type { SearchResultItem } from "@/types/api";
import { cn } from "@/lib/utils";
import { Plus, Mic, ChevronDown, FileUp } from "lucide-react";

type InputMode = "text" | "voice";

interface Turn {
  message: string;
  reply: string;
  results: SearchResultItem[];
}

export default function Home() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [searching, setSearching] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSpeechResult = useCallback((transcript: string) => {
    setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const {
    listening,
    supported: speechSupported,
    start: startListening,
    stop: stopListening,
  } = useSpeechInput({ onResult: handleSpeechResult });

  useEffect(() => {
    profileService
      .get()
      .then((profile) => setProfileId(profile.id))
      .catch(() =>
        toast.error("No profile found. Set up your profile before searching."),
      );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !profileId || searching) return;

    const currentMessage = message;
    setSearching(true);
    setAgentState("thinking");

    try {
      const result = await searchService.search({
        message: currentMessage,
        profile_id: profileId,
      });
      setTurns((prev) => [
        ...prev,
        {
          message: currentMessage,
          reply: result.reply,
          results: result.results,
        },
      ]);
      setMessage("");
      setAgentState("replying");
      setTimeout(() => setAgentState("idle"), 650);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Search failed");
      setAgentState("idle");
    } finally {
      setSearching(false);
    }
  }

  const hasSearched = turns.length > 0;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* Logo — fixed to align with ProfileButton in the same left column */}
      <div className="fixed top-6 left-6 z-20">
        <div className="logo-glow" />
        <Image
          src="/logo.png"
          alt="Khedma.ai"
          width={40}
          height={40}
          className="relative rounded-full size-10 object-cover"
          priority
        />
      </div>
      <div className="w-17 shrink-0" />

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col w-full h-full">
        {/* Top Right Action */}
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={() => setResumeDialogOpen(true)}
            aria-label="Upload resume"
            className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-accent transition-colors"
          >
            <FileUp className="size-5" />
          </button>
        </div>

        <ResumeUploadDialog
          open={resumeDialogOpen}
          onOpenChange={setResumeDialogOpen}
        />

        <div
          className={cn(
            "relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-6",
            hasSearched
              ? "justify-start pt-10 pb-32 overflow-y-auto scrollbar-hide"
              : "justify-center items-center pb-24",
          )}
        >
          {!hasSearched && (
            <div className="mb-8 flex flex-col items-center text-center">
              <h1 className="text-[28px] sm:text-[32px] font-normal text-foreground tracking-wide">
                Ready when you are
              </h1>
            </div>
          )}

          {hasSearched && (
            <div className="flex flex-col gap-10 w-full">
              {turns.map((turn, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground self-end bg-card px-4 py-2 rounded-2xl max-w-[85%]">
                    {turn.message}
                  </p>
                  <div className="flex gap-3">
                    <AgentAvatar
                      state={agentState}
                      className="size-6 mt-1 shrink-0"
                    />
                    <div className="flex flex-col gap-2">
                      <p className="text-foreground leading-relaxed font-arabic-aware">
                        {turn.reply}
                      </p>
                      {turn.results.length > 0 && (
                        <div className="mt-4 grid gap-3">
                          {turn.results.map((item) => (
                            <MatchCard key={item.match_id} item={item} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Search Input Form */}
          <div
            className={cn(
              "relative",
              !hasSearched
                ? "w-full max-w-2xl mt-2"
                : "fixed bottom-8 mx-auto w-full max-w-3xl left-0 right-0 ml-17",
            )}
          >
            <div className="input-glow" />
            <form
              onSubmit={handleSearch}
              className="relative z-10 flex items-center gap-3 rounded-full bg-card px-4 py-3.5 border border-border transition-colors focus-within:border-ring"
            >
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors ml-1"
              >
                <Plus className="size-5" />
              </button>

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  inputMode === "voice" ? "Tap the mic to speak" : "Ask Khedma"
                }
                disabled={searching || inputMode === "voice"}
                dir="auto"
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground text-foreground disabled:opacity-50 font-arabic-aware"
              />

              <div className="flex items-center gap-3 pl-3 mr-1">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      if (inputMode === "voice" && listening) stopListening();
                      setInputMode((prev) =>
                        prev === "text" ? "voice" : "text",
                      );
                    }}
                    aria-label={
                      inputMode === "text"
                        ? "Switch to voice input"
                        : "Switch to text input"
                    }
                    className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors bg-accent hover:bg-accent/70 px-3 py-1.5 rounded-full"
                  >
                    {inputMode === "text" ? (
                      <>
                        Text <ChevronDown className="size-3.5 opacity-70" />
                      </>
                    ) : (
                      <>
                        Voice <ChevronDown className="size-3.5 opacity-70" />
                      </>
                    )}
                  </button>
                )}
                {inputMode === "voice" ? (
                  <button
                    type="button"
                    onClick={listening ? stopListening : startListening}
                    aria-label={
                      listening ? "Stop recording" : "Start recording"
                    }
                    aria-pressed={listening}
                    className={cn(
                      "rounded-full p-1.5 transition-colors",
                      listening
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Mic
                      className={cn("size-5", listening && "animate-pulse")}
                    />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!profileId || searching || !message.trim()}
                    className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:hover:text-muted-foreground p-1.5"
                  >
                    <Mic className="size-5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
