import { MapPin, Building2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { SearchResultItem } from "@/types/api";

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

export function JobDetailDialog({
  item,
  onOpenChange,
}: {
  item: SearchResultItem | null;
  onOpenChange: (open: boolean) => void;
}) {
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
          </div>

          <div className="border-t border-border px-6 py-4">
            {item.job.url ? (
              <Button
                render={
                  <a href={item.job.url} target="_blank" rel="noreferrer" />
                }
                className="w-full"
              >
                View original posting
                <ExternalLink data-icon="inline-end" />
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                No original link available for this posting.
              </p>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
