import type { SearchResultItem } from "@/types/api";

function locationLabel(job: SearchResultItem["job"]) {
  if (job.is_remote) return "Remote";
  return [job.city, job.country].filter(Boolean).join(", ") || null;
}

export function MatchCard({ item }: { item: SearchResultItem }) {
  const { job, score, reasoning } = item;
  const location = locationLabel(job);

  return (
    <article className="flex items-start justify-between gap-6 border-b border-border py-5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium text-foreground">{job.title}</h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {job.company}
          {job.company && location && " — "}
          {location}
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          {reasoning}
        </p>
      </div>
      <div className="shrink-0 font-heading text-3xl font-medium text-primary tabular-nums">
        {Math.round(score)}%
      </div>
    </article>
  );
}
