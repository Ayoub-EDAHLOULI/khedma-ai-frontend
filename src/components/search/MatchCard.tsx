import type { SearchResultItem } from "@/types/api";
import { MapPin, Building2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

function locationLabel(job: SearchResultItem["job"]) {
  if (job.is_remote) return "Remote";
  return [job.city, job.country].filter(Boolean).join(", ") || null;
}

function scoreTone(score: number) {
  if (score >= 75) return "text-primary";
  if (score >= 50) return "text-foreground";
  return "text-muted-foreground";
}

export function MatchCard({
  item,
  onClick,
  selectable = false,
  selected = false,
  onSelectedChange,
}: {
  item: SearchResultItem;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
}) {
  const { job, score, reasoning } = item;
  const location = locationLabel(job);

  return (
    <article
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-ring hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
        selectable && selected && "border-primary bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="min-w-0 flex-1 text-[15px] font-medium leading-snug text-foreground">
          {job.title}
        </h3>
        <div className="flex shrink-0 items-center gap-3">
          <div
            className={`font-heading text-2xl font-medium leading-none tabular-nums ${scoreTone(score)}`}
          >
            {Math.round(score)}%
          </div>
          {selectable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectedChange?.(!selected);
              }}
              aria-label={selected ? "Deselect this job" : "Select this job"}
              aria-pressed={selected}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-transparent hover:border-ring",
              )}
            >
              <Check className="size-3.5" strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {job.company && (
          <span className="flex min-w-0 items-center gap-1.5">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">{job.company}</span>
          </span>
        )}
        {location && (
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </span>
        )}
      </div>

      {(job.seniority || job.scope) && (
        <div className="flex flex-wrap gap-1.5">
          {job.seniority && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
              {job.seniority}
            </span>
          )}
          {job.scope && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
              {job.scope}
            </span>
          )}
        </div>
      )}

      <p className="flex-1 border-t border-border pt-3 text-sm leading-relaxed text-muted-foreground">
        {reasoning}
      </p>
    </article>
  );
}
