"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  PhoneOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interviewsService } from "@/services/interviews.service";
import { useInterviewVoice } from "@/hooks/useInterviewVoice";
import { cn } from "@/lib/utils";
import type { InterviewSession } from "@/types/api";

function locationLabel(job: InterviewSession["job"]) {
  if (job.is_remote) return "Remote";
  return [job.city, job.country].filter(Boolean).join(", ") || null;
}

const INTERVIEW_TYPE_LABEL: Record<InterviewSession["interview_type"], string> = {
  hr: "HR",
  technical: "Technical",
  manager: "Manager",
};

const LANGUAGE_LABEL: Record<InterviewSession["language"], string> = {
  darija: "Darija",
  fr: "French",
  ar: "Arabic",
  en: "English",
};

const STATUS_LABEL: Record<string, string> = {
  idle: "Ready when you are",
  connecting: "Connecting…",
  connected: "Live — talk anytime",
  error: "Something went wrong",
  closed: "Interview ended",
};

export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);

  const { status, error, turns, connect, disconnect } = useInterviewVoice({
    sessionId: id,
  });

  useEffect(() => {
    interviewsService
      .get(id)
      .then(setSession)
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load the session",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  // The voice-token endpoint flips the session to "active" server-side as
  // soon as it's minted, but this page's own session state was only fetched
  // once on load — derive the displayed status from the live voice status
  // too, so the badge doesn't keep showing "setup" once the call is
  // actually live, without needing a second copy of it in state.
  const displayedStatus =
    session && status === "connected" && session.status === "setup"
      ? "active"
      : session?.status;

  async function handleEnd() {
    disconnect();
    setEnding(true);
    try {
      const updated = await interviewsService.end(id);
      setSession(updated);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to end the session",
      );
    } finally {
      setEnding(false);
    }
  }

  const isLive = status === "connecting" || status === "connected";

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground font-sans">
      <div className="page-glow" />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-10 pb-32">
        <Link
          href="/interview"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to setup
        </Link>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        )}

        {!loading && session && (
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{session.job.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {session.job.company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 shrink-0" />
                      {session.job.company}
                    </span>
                  )}
                  {locationLabel(session.job) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      {locationLabel(session.job)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {INTERVIEW_TYPE_LABEL[session.interview_type]}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {LANGUAGE_LABEL[session.language]}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {session.scope}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                    {displayedStatus}
                  </span>
                </div>
              </CardContent>
            </Card>

            {session.status !== "completed" && (
              <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card px-6 py-10">
                <div
                  className={cn(
                    "relative size-32 shrink-0 rounded-full",
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

                <p className="text-sm text-muted-foreground">
                  {error ?? STATUS_LABEL[status]}
                </p>

                {isLive ? (
                  <Button
                    variant="destructive"
                    onClick={handleEnd}
                    disabled={ending}
                    className="rounded-full px-6"
                  >
                    {ending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <PhoneOff />
                    )}
                    End interview
                  </Button>
                ) : (
                  <Button onClick={connect} className="rounded-full px-6">
                    Start interview
                  </Button>
                )}
              </div>
            )}

            {turns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {turns.map((turn) => (
                    <div
                      key={turn.id}
                      className={cn(
                        "flex flex-col gap-1 rounded-xl px-4 py-2.5 text-sm",
                        turn.speaker === "candidate"
                          ? "self-end bg-primary/10 text-foreground"
                          : "self-start bg-muted text-foreground",
                      )}
                    >
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {turn.speaker === "candidate"
                          ? "You"
                          : "Interviewer"}
                      </span>
                      {turn.content}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
