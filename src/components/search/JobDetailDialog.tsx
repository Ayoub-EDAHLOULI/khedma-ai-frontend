import { useState } from "react";
import { toast } from "react-toastify";
import {
  MapPin,
  Building2,
  ExternalLink,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fallbackSearchUrl, platformName } from "@/lib/jobSource";
import { matchesService } from "@/services/matches.service";
import { applicationsService } from "@/services/applications.service";
import type {
  ApplicationStatus,
  PrepareResult,
  SearchResultItem,
} from "@/types/api";

function locationLabel(job: SearchResultItem["job"]) {
  if (job.is_remote) return "Remote";
  return [job.city, job.country].filter(Boolean).join(", ") || null;
}

function scoreTone(score: number) {
  if (score >= 75) return "text-primary";
  if (score >= 50) return "text-foreground";
  return "text-muted-foreground";
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
      {children}
    </span>
  );
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
];

function PreviewSection({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="line-clamp-6 whitespace-pre-line rounded-lg bg-muted/50 p-3 text-sm leading-relaxed text-foreground">
        {text}
      </p>
    </div>
  );
}

function ApplicationPackage({ matchId }: { matchId: string }) {
  const [preparing, setPreparing] = useState(false);
  const [application, setApplication] = useState<PrepareResult | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState<
    "resume" | "cover-letter" | null
  >(null);

  async function handlePrepare() {
    setPreparing(true);
    try {
      const result = await matchesService.prepare(matchId);
      setApplication(result);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to prepare application",
      );
    } finally {
      setPreparing(false);
    }
  }

  async function handleStatusChange(status: ApplicationStatus) {
    if (!application) return;
    setUpdatingStatus(true);
    try {
      const updated = await applicationsService.updateStatus(
        application.id,
        status,
      );
      setApplication((prev) =>
        prev ? { ...prev, status: updated.status } : prev,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDownload(kind: "resume" | "cover-letter") {
    setDownloading(kind);
    try {
      if (kind === "resume") {
        await matchesService.downloadResume(matchId);
      } else {
        await matchesService.downloadCoverLetter(matchId);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          Application package
        </p>
        {application && (
          <Select
            value={application.status}
            onValueChange={(value) =>
              handleStatusChange(value as ApplicationStatus)
            }
          >
            <SelectTrigger disabled={updatingStatus} className="disabled:opacity-50">
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
        )}
      </div>

      {!application ? (
        <Button onClick={handlePrepare} disabled={preparing}>
          {preparing ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {preparing ? "Tailoring your CV…" : "Tailor CV & write cover letter"}
        </Button>
      ) : (
        <div className="flex flex-col gap-4">
          <PreviewSection title="Tailored CV" text={application.tailored_cv} />
          <Button
            variant="outline"
            onClick={() => handleDownload("resume")}
            disabled={downloading !== null}
          >
            {downloading === "resume" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            Download resume (.docx)
          </Button>

          <PreviewSection
            title="Cover letter"
            text={application.cover_letter}
          />
          <Button
            variant="outline"
            onClick={() => handleDownload("cover-letter")}
            disabled={downloading !== null}
          >
            {downloading === "cover-letter" ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Download />
            )}
            Download cover letter (.docx)
          </Button>
        </div>
      )}
    </div>
  );
}

export function JobDetailDialog({
  item,
  onOpenChange,
}: {
  item: SearchResultItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  const applyUrl =
    item &&
    (item.job.url ??
      fallbackSearchUrl(item.job.source, item.job.title, item.job.company));
  const isDirectLink = item?.job.url != null;

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      {item && (
        <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
          <DialogHeader className="gap-3 border-b border-border px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-4 pr-6">
              <DialogTitle className="text-xl leading-snug font-medium">
                {item.job.title}
              </DialogTitle>
              <div className="flex shrink-0 flex-col items-end">
                <span
                  className={`font-heading text-3xl font-medium leading-none tabular-nums ${scoreTone(item.score)}`}
                >
                  {Math.round(item.score)}%
                </span>
                <span className="mt-1 text-[11px] text-muted-foreground">
                  match
                </span>
              </div>
            </div>

            <DialogDescription
              render={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground" />
              }
            >
              {item.job.company && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 shrink-0" />
                  {item.job.company}
                </span>
              )}
              {locationLabel(item.job) && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {locationLabel(item.job)}
                </span>
              )}
            </DialogDescription>

            {(item.job.seniority || item.job.scope || item.job.source) && (
              <div className="flex flex-wrap gap-1.5">
                {item.job.seniority && <Tag>{item.job.seniority}</Tag>}
                {item.job.scope && <Tag>{item.job.scope}</Tag>}
                {item.job.source && <Tag>{item.job.source}</Tag>}
              </div>
            )}
          </DialogHeader>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-1.5 rounded-xl bg-primary/10 p-4">
              <p className="text-xs font-medium text-primary">Why it matches</p>
              <p className="text-sm leading-relaxed text-foreground">
                {item.reasoning}
              </p>
            </div>

            {item.job.description && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Full description
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {item.job.description}
                </p>
              </div>
            )}

            <ApplicationPackage key={item.match_id} matchId={item.match_id} />
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border px-6 py-4">
            {applyUrl ? (
              <Button
                render={<a href={applyUrl} target="_blank" rel="noreferrer" />}
                nativeButton={false}
                className="w-full"
              >
                {isDirectLink
                  ? "Apply on original posting"
                  : `Search on ${platformName(item.job.source)}`}
                <ExternalLink data-icon="inline-end" />
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                No link available for this posting.
              </p>
            )}
            {!isDirectLink && applyUrl && (
              <p className="text-center text-[11px] text-muted-foreground">
                No direct link saved for this posting — this opens a search for
                it on {platformName(item.job.source)}.
              </p>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
