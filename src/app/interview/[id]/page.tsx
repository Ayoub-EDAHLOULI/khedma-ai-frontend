"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ArrowLeft, Building2, Loader2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { interviewsService } from "@/services/interviews.service";
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

// This page confirms an interview_sessions row was created with the right
// choices — the live voice session (Gemini Live, persona instruction,
// transcript capture) is a later, separate build step, not wired up yet.
export default function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

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
                  {session.status}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                The live voice interview isn&apos;t wired up yet — this
                session was created and is ready for it.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
