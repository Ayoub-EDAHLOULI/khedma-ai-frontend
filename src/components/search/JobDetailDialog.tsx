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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-6">
              <DialogTitle className="text-lg leading-snug">
                {item.job.title}
              </DialogTitle>
              <span className="shrink-0 font-heading text-2xl font-medium leading-none text-primary tabular-nums">
                {Math.round(item.score)}%
              </span>
            </div>
            <DialogDescription
              render={
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-sm" />
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
          </DialogHeader>

          {(item.job.seniority || item.job.scope) && (
            <div className="flex flex-wrap gap-1.5">
              {item.job.seniority && (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                  {item.job.seniority}
                </span>
              )}
              {item.job.scope && (
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                  {item.job.scope}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Why it matches
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {item.reasoning}
            </p>
          </div>

          {item.job.description && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Full description
              </p>
              <p className="max-h-64 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-foreground">
                {item.job.description}
              </p>
            </div>
          )}

          {item.job.url && (
            <Button
              render={
                <a href={item.job.url} target="_blank" rel="noreferrer" />
              }
              className="w-full"
            >
              View original posting
              <ExternalLink data-icon="inline-end" />
            </Button>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
