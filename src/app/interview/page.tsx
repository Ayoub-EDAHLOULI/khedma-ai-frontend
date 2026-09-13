"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { ArrowLeft, Building2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { applicationsService } from "@/services/applications.service";
import { jobsService } from "@/services/jobs.service";
import { interviewsService } from "@/services/interviews.service";
import { cn } from "@/lib/utils";
import type {
  Application,
  InterviewLanguage,
  InterviewType,
  LocationScope,
} from "@/types/api";

type JobSourceMode = "application" | "paste" | null;

const INTERVIEW_TYPE_OPTIONS: {
  value: InterviewType;
  label: string;
  description: string;
}[] = [
  {
    value: "hr",
    label: "HR",
    description: "Culture fit, behavioral questions, motivation.",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Deep questions on the stack named in the job.",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Leadership, ownership, and team-fit.",
  },
];

const LANGUAGE_OPTIONS: { value: InterviewLanguage; label: string }[] = [
  { value: "darija", label: "Darija" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
  { value: "en", label: "English" },
];

const SCOPE_OPTIONS: {
  value: LocationScope;
  label: string;
  description: string;
}[] = [
  {
    value: "local",
    label: "Local",
    description: "More relational and direct in style.",
  },
  {
    value: "international",
    label: "International",
    description: "More structured, FAANG-style rigor.",
  },
];

function locationLabel(job: Application["job"]) {
  if (job.is_remote) return "Remote";
  return [job.city, job.country].filter(Boolean).join(", ") || null;
}

function OptionCard({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-ring",
      )}
    >
      <span className="text-[15px] font-medium text-foreground">{title}</span>
      {description && (
        <span className="text-[13px] text-muted-foreground">
          {description}
        </span>
      )}
    </button>
  );
}

export default function InterviewSetupPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[] | null>(
    null,
  );
  const [jobSourceMode, setJobSourceMode] = useState<JobSourceMode>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteCompany, setPasteCompany] = useState("");
  const [pasteDescription, setPasteDescription] = useState("");
  const [pasteScope, setPasteScope] = useState<LocationScope | null>(null);
  const [creatingManualJob, setCreatingManualJob] = useState(false);
  const [manualJobId, setManualJobId] = useState<string | null>(null);

  const [interviewType, setInterviewType] = useState<InterviewType | null>(
    null,
  );
  const [language, setLanguage] = useState<InterviewLanguage | null>(null);
  const [scope, setScope] = useState<LocationScope | null>(null);

  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => {
    applicationsService
      .list()
      .then(setApplications)
      .catch(() => {
        // Applications are optional here — the paste flow still works with
        // none, so a failed fetch shouldn't block the whole setup screen.
        setApplications([]);
      });
  }, []);

  // The paste flow needs its own job created (source='manual') before an
  // interview_sessions row can reference it — creating it as soon as the
  // paste form is valid keeps the rest of the flow (type/language/scope)
  // uniform regardless of which job source was picked.
  async function handleCreateManualJob() {
    if (!pasteTitle.trim() || !pasteDescription.trim() || !pasteScope) return;
    setCreatingManualJob(true);
    try {
      const result = await jobsService.createManual({
        title: pasteTitle,
        company: pasteCompany || null,
        description: pasteDescription,
        scope: pasteScope,
      });
      setManualJobId(result.job.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add the job",
      );
    } finally {
      setCreatingManualJob(false);
    }
  }

  const resolvedJobId =
    jobSourceMode === "application"
      ? selectedApplicationId
      : jobSourceMode === "paste"
        ? manualJobId
        : null;

  const canStart =
    resolvedJobId !== null &&
    interviewType !== null &&
    language !== null &&
    scope !== null;

  async function handleStart() {
    if (!resolvedJobId || !interviewType || !language || !scope) return;
    setCreatingSession(true);
    try {
      const session = await interviewsService.create({
        job_id: resolvedJobId,
        interview_type: interviewType,
        language,
        scope,
      });
      toast.success("Interview session created.");
      router.push(`/interview/${session.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create the session",
      );
    } finally {
      setCreatingSession(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground font-sans">
      <div className="page-glow" />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-10 pb-32">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to search
        </Link>

        <header className="mb-8">
          <h1 className="font-heading text-3xl font-medium tracking-wide text-foreground">
            Practice an interview
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up a mock interview for a specific job, then practice it live
            by voice.
          </p>
        </header>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Job</CardTitle>
              <CardDescription>
                Pick a job you&apos;ve already saved, or paste a new one.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex gap-2">
                <OptionCard
                  selected={jobSourceMode === "application"}
                  onClick={() => setJobSourceMode("application")}
                  title="Existing application"
                />
                <OptionCard
                  selected={jobSourceMode === "paste"}
                  onClick={() => setJobSourceMode("paste")}
                  title="Paste a job description"
                />
              </div>

              {jobSourceMode === "application" && (
                <div className="flex flex-col gap-2">
                  {applications === null && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading…
                    </div>
                  )}
                  {applications !== null && applications.length === 0 && (
                    <p className="py-4 text-sm text-muted-foreground">
                      No saved applications yet — paste a job description
                      instead.
                    </p>
                  )}
                  {applications !== null &&
                    applications.map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApplicationId(app.job.id)}
                        className={cn(
                          "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                          selectedApplicationId === app.job.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-ring",
                        )}
                      >
                        <span className="text-[15px] font-medium text-foreground">
                          {app.job.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                          {app.job.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="size-3.5 shrink-0" />
                              {app.job.company}
                            </span>
                          )}
                          {locationLabel(app.job) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="size-3.5 shrink-0" />
                              {locationLabel(app.job)}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {jobSourceMode === "paste" && (
                <div className="flex flex-col gap-4">
                  {manualJobId ? (
                    <p className="rounded-xl border border-primary bg-primary/10 px-4 py-3 text-[15px] text-foreground">
                      {pasteTitle}
                      {pasteCompany ? ` — ${pasteCompany}` : ""}
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2.5">
                        <Label htmlFor="paste_title">Job title</Label>
                        <Input
                          id="paste_title"
                          value={pasteTitle}
                          onChange={(e) => setPasteTitle(e.target.value)}
                          placeholder="Backend Engineer"
                        />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <Label htmlFor="paste_company">
                          Company (optional)
                        </Label>
                        <Input
                          id="paste_company"
                          value={pasteCompany}
                          onChange={(e) => setPasteCompany(e.target.value)}
                          placeholder="Acme Corp"
                        />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <Label htmlFor="paste_description">
                          Job description
                        </Label>
                        <Textarea
                          id="paste_description"
                          rows={6}
                          value={pasteDescription}
                          onChange={(e) =>
                            setPasteDescription(e.target.value)
                          }
                          placeholder="Paste the full job description…"
                        />
                      </div>
                      <div className="flex flex-col gap-2.5">
                        <Label>Scope of this posting</Label>
                        <div className="flex gap-2">
                          {SCOPE_OPTIONS.map((opt) => (
                            <OptionCard
                              key={opt.value}
                              selected={pasteScope === opt.value}
                              onClick={() => setPasteScope(opt.value)}
                              title={opt.label}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleCreateManualJob}
                        disabled={
                          !pasteTitle.trim() ||
                          !pasteDescription.trim() ||
                          !pasteScope ||
                          creatingManualJob
                        }
                        className="self-start"
                      >
                        {creatingManualJob ? (
                          <Loader2 className="animate-spin" />
                        ) : null}
                        {creatingManualJob ? "Adding…" : "Use this job"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {resolvedJobId && (
            <Card>
              <CardHeader>
                <CardTitle>2. Interview type</CardTitle>
                <CardDescription>
                  Each type plays a distinct interviewer persona.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={interviewType === opt.value}
                    onClick={() => setInterviewType(opt.value)}
                    title={opt.label}
                    description={opt.description}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {resolvedJobId && interviewType && (
            <Card>
              <CardHeader>
                <CardTitle>3. Language</CardTitle>
                <CardDescription>
                  The interview will be conducted entirely in this language.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={language === opt.value}
                    onClick={() => setLanguage(opt.value)}
                    title={opt.label}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {resolvedJobId && interviewType && language && (
            <Card>
              <CardHeader>
                <CardTitle>4. Scope</CardTitle>
                <CardDescription>
                  Changes the interview&apos;s style and rigor.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                {SCOPE_OPTIONS.map((opt) => (
                  <OptionCard
                    key={opt.value}
                    selected={scope === opt.value}
                    onClick={() => setScope(opt.value)}
                    title={opt.label}
                    description={opt.description}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {canStart && (
            <Button
              onClick={handleStart}
              disabled={creatingSession}
              className="self-start rounded-full px-6 py-5 text-sm font-medium"
            >
              {creatingSession ? (
                <Loader2 className="animate-spin" />
              ) : null}
              {creatingSession ? "Starting…" : "Start interview"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
