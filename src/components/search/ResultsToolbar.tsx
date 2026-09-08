"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortKey = "score" | "title" | "company";

export interface ResultsFilter {
  query: string;
  remoteOnly: boolean;
  sort: SortKey;
}

export const defaultResultsFilter: ResultsFilter = {
  query: "",
  remoteOnly: false,
  sort: "score",
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "score", label: "Best match" },
  { value: "title", label: "Title (A-Z)" },
  { value: "company", label: "Company (A-Z)" },
];

export function ResultsToolbar({
  filter,
  onChange,
  resultCount,
}: {
  filter: ResultsFilter;
  onChange: (filter: ResultsFilter) => void;
  resultCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 pb-1">
      <div className="relative flex-1 min-w-40">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          placeholder="Filter these results…"
          className="w-full rounded-full border border-border bg-transparent py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:border-ring"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange({ ...filter, remoteOnly: !filter.remoteOnly })}
        className={cn(
          "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
          filter.remoteOnly
            ? "border-primary bg-primary/15 text-foreground"
            : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
        )}
      >
        Remote only
      </button>

      <Select
        value={filter.sort}
        onValueChange={(value) =>
          onChange({ ...filter, sort: value as SortKey })
        }
      >
        <SelectTrigger className="shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="shrink-0 text-xs text-muted-foreground">
        {resultCount} {resultCount === 1 ? "result" : "results"}
      </span>
    </div>
  );
}

export function applyResultsFilter<
  T extends {
    job: { title: string; company: string | null; is_remote: boolean };
    score: number;
  },
>(items: T[], filter: ResultsFilter): T[] {
  const q = filter.query.trim().toLowerCase();

  const filtered = items.filter((item) => {
    if (filter.remoteOnly && !item.job.is_remote) return false;
    if (!q) return true;
    return (
      item.job.title.toLowerCase().includes(q) ||
      (item.job.company ?? "").toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filter.sort) {
      case "title":
        return a.job.title.localeCompare(b.job.title);
      case "company":
        return (a.job.company ?? "").localeCompare(b.job.company ?? "");
      case "score":
      default:
        return b.score - a.score;
    }
  });

  return sorted;
}
