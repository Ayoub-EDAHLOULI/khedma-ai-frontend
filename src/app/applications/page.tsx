"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { ArrowLeft, Building2, MapPin, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationsService } from "@/services/applications.service";
import type { Application, ApplicationStatus } from "@/types/api";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
];

function statusTone(status: ApplicationStatus) {
  switch (status) {
    case "applied":
      return "border-primary/40 bg-primary/15 text-foreground";
    case "interview":
      return "border-emerald-500/40 bg-emerald-500/15 text-foreground";
    case "rejected":
      return "border-destructive/40 bg-destructive/15 text-foreground";
    default:
      return "border-border text-muted-foreground";
  }
}

function locationLabel(job: Application["job"]) {
  if (job.is_remote) return "Remote";
  return [job.city, job.country].filter(Boolean).join(", ") || null;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[] | null>(
    null,
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    applicationsService
      .list()
      .then(setApplications)
      .catch((err) =>
        toast.error(
          err instanceof Error ? err.message : "Failed to load applications",
        ),
      );
  }, []);

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    setUpdatingId(id);
    try {
      const updated = await applicationsService.updateStatus(id, status);
      setApplications((prev) =>
        prev
          ? prev.map((a) => (a.id === id ? { ...a, status: updated.status } : a))
          : prev,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to search"
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="font-heading text-xl font-medium">Applications</h1>
        </div>

        {applications === null && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading…
          </div>
        )}

        {applications !== null && applications.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No applications yet. Prepare one from a job&apos;s details to see
            it here.
          </p>
        )}

        {applications !== null && applications.length > 0 && (
          <div className="flex flex-col gap-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[15px] font-medium text-foreground">
                      {app.job.title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {app.job.company && (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 shrink-0" />
                          {app.job.company}
                        </span>
                      )}
                      {locationLabel(app.job) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 shrink-0" />
                          {locationLabel(app.job)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 font-heading text-xl font-medium text-primary tabular-nums">
                    {Math.round(app.score)}%
                  </span>
                </div>

                <Select
                  value={app.status}
                  onValueChange={(value) =>
                    handleStatusChange(app.id, value as ApplicationStatus)
                  }
                >
                  <SelectTrigger
                    disabled={updatingId === app.id}
                    className={cn(
                      "w-fit disabled:opacity-50",
                      statusTone(app.status),
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
