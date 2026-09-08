"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { MatchCard } from "@/components/search/MatchCard";
import { JobDetailDialog } from "@/components/search/JobDetailDialog";
import {
  ResultsToolbar,
  applyResultsFilter,
  defaultResultsFilter,
  type ResultsFilter,
} from "@/components/search/ResultsToolbar";
import { AgentAvatar, type AgentState } from "@/components/search/AgentAvatar";
import { GeminiVoiceMode } from "@/components/search/GeminiVoiceMode";
import type { SearchJobsArgs } from "@/hooks/useGeminiLiveVoice";
import { ResumeUploadDialog } from "@/components/ResumeUploadDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileService } from "@/services/profile.service";
import { searchService } from "@/services/search.service";
import type {
  LocationScope,
  Profile,
  Seniority,
  SearchResultItem,
} from "@/types/api";
import { countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Plus, Mic, ArrowUp, FileUp } from "lucide-react";

interface Turn {
  message: string;
  reply: string;
  results: SearchResultItem[];
}

export default function Home() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [searching, setSearching] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [resumeDialogOpen, setResumeDialogOpen] = useState(false);
  const [scope, setScope] = useState<LocationScope | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [seniority, setSeniority] = useState<Seniority | null>(null);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [resultFilters, setResultFilters] = useState<
    Record<number, ResultsFilter>
  >({});
  const [selectedJob, setSelectedJob] = useState<SearchResultItem | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    profileService
      .get()
      .then((p) => {
        setProfileId(p.id);
        setProfile(p);
      })
      .catch(() =>
        toast.error("No profile found. Set up your profile before searching."),
      );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const runSearch = useCallback(
    async (
      currentMessage: string,
      overrides?: {
        scope?: LocationScope;
        remote_only?: boolean;
        country?: string;
        seniority?: Seniority;
      },
    ) => {
      if (!profileId) throw new Error("No profile found");

      const result = await searchService.search({
        message: currentMessage,
        profile_id: profileId,
        scope: overrides?.scope ?? scope ?? undefined,
        remote_only: overrides?.remote_only ?? (remoteOnly || undefined),
        country: overrides?.country ?? country ?? undefined,
        seniority: overrides?.seniority ?? seniority ?? undefined,
      });
      setTurns((prev) => [
        ...prev,
        {
          message: currentMessage,
          reply: result.reply,
          results: result.results,
        },
      ]);
      return result;
    },
    [profileId, scope, remoteOnly, country, seniority],
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !profileId || searching) return;

    const currentMessage = message;
    setSearching(true);
    setAgentState("thinking");

    try {
      await runSearch(currentMessage);
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

  const handleSearchJobs = useCallback(
    async (args: SearchJobsArgs) => {
      return runSearch(args.query, {
        scope: args.scope,
        remote_only: args.remote_only,
        country: args.country,
        seniority: args.seniority,
      });
    },
    [runSearch],
  );

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
              ? "justify-start pt-10 pb-56 overflow-y-auto scrollbar-hide"
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
              {turns.map((turn, i) => {
                const filter = resultFilters[i] ?? defaultResultsFilter;
                const visibleResults = applyResultsFilter(
                  turn.results,
                  filter,
                );
                return (
                  <div key={i} className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground self-end bg-card px-4 py-2 rounded-2xl max-w-[85%]">
                      {turn.message}
                    </p>
                    <div className="flex gap-3">
                      <AgentAvatar
                        state={agentState}
                        className="size-6 mt-1 shrink-0"
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="text-foreground leading-relaxed font-arabic-aware">
                          {turn.reply}
                        </p>
                        {turn.results.length > 0 && (
                          <div className="mt-4 flex flex-col gap-3">
                            <ResultsToolbar
                              filter={filter}
                              onChange={(next) =>
                                setResultFilters((prev) => ({
                                  ...prev,
                                  [i]: next,
                                }))
                              }
                              resultCount={visibleResults.length}
                            />
                            {visibleResults.length > 0 ? (
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {visibleResults.map((item) => (
                                  <MatchCard
                                    key={item.match_id}
                                    item={item}
                                    onClick={() => setSelectedJob(item)}
                                  />
                                ))}
                              </div>
                            ) : (
                              <p className="py-6 text-center text-sm text-muted-foreground">
                                No results match these filters.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Search Input Form */}
          <div
            className={cn(
              "relative",
              !hasSearched
                ? "w-full max-w-2xl mt-2"
                : "fixed bottom-8 left-17 right-0 z-20 mx-auto w-full max-w-3xl px-6",
            )}
          >
            <div className="relative z-10 mb-3 flex flex-wrap items-center justify-center gap-2">
              {(
                [
                  { value: null, label: "Any scope" },
                  { value: "local", label: "Local" },
                  { value: "international", label: "International" },
                ] as const
              ).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setScope(option.value)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    scope === option.value
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
                  )}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setRemoteOnly((prev) => !prev)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                  remoteOnly
                    ? "border-primary bg-primary/15 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
                )}
              >
                Remote only
              </button>

              {profile &&
                (profile.base_country ||
                  profile.target_countries.length > 0) && (
                  <Select
                    value={country ?? ""}
                    onValueChange={(value) => setCountry(value || null)}
                  >
                    <SelectTrigger
                      className={cn(
                        country && "border-primary bg-primary/15 text-foreground",
                      )}
                    >
                      <SelectValue placeholder="Any country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any country</SelectItem>
                      {[profile.base_country, ...profile.target_countries]
                        .filter(Boolean)
                        .map((code) => (
                          <SelectItem key={code} value={code}>
                            {countryName(code)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

              {(
                [
                  { value: null, label: "Any level" },
                  { value: "junior", label: "Junior" },
                  { value: "mid", label: "Mid" },
                  { value: "senior", label: "Senior" },
                ] as const
              ).map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => setSeniority(option.value)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                    seniority === option.value
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

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
                placeholder="Ask Khedma"
                disabled={searching}
                dir="auto"
                className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground text-foreground disabled:opacity-50 font-arabic-aware"
              />

              <div className="flex items-center gap-3 pl-3 mr-1">
                <button
                  type="button"
                  onClick={() => setVoiceModeOpen(true)}
                  aria-label="Open voice mode"
                  className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
                >
                  <Mic className="size-5" />
                </button>
                {message.trim() && (
                  <button
                    type="submit"
                    disabled={!profileId || searching}
                    aria-label="Send"
                    className="rounded-full bg-primary p-1.5 text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
                  >
                    <ArrowUp className="size-5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      {voiceModeOpen && (
        <GeminiVoiceMode
          onClose={() => setVoiceModeOpen(false)}
          onSearchJobs={handleSearchJobs}
        />
      )}

      <JobDetailDialog
        item={selectedJob}
        onOpenChange={(open) => {
          if (!open) setSelectedJob(null);
        }}
      />
    </div>
  );
}
