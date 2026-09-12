"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { MatchCard } from "@/components/search/MatchCard";
import { matchesService } from "@/services/matches.service";
import { cn } from "@/lib/utils";
import type { SearchResultItem } from "@/types/api";

// Shared bulk-select + "save as drafts" UI for a list of search results —
// used on both the main search page and inside Gemini voice mode, since
// voice-found jobs deserve the same cheap draft-and-review flow instead of
// requiring a switch back to the text UI. Bulk-drafting only creates the
// Application row (see /matches/bulk-draft) — no LLM call — the actual
// tailored CV/cover letter generation stays a deliberate per-item action on
// the Applications page.
export function SelectableResults({
  results,
  onOpenJob,
}: {
  results: SearchResultItem[];
  onOpenJob?: (item: SearchResultItem) => void;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMatchIds, setSelectedMatchIds] = useState<Set<string>>(
    new Set(),
  );
  const [creatingDrafts, setCreatingDrafts] = useState(false);

  function toggleMatchSelected(matchId: string) {
    setSelectedMatchIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedMatchIds((prev) => {
      const allSelected = results.every((r) => prev.has(r.match_id));
      const next = new Set(prev);
      for (const r of results) {
        if (allSelected) {
          next.delete(r.match_id);
        } else {
          next.add(r.match_id);
        }
      }
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedMatchIds(new Set());
  }

  async function handleCreateDrafts() {
    if (selectedMatchIds.size === 0) return;
    setCreatingDrafts(true);
    try {
      const result = await matchesService.bulkDraft([...selectedMatchIds]);
      const createdCount = result.created.length;
      const skippedCount = result.already_existed.length;
      if (createdCount > 0) {
        toast.success(
          `Saved ${createdCount} job${createdCount === 1 ? "" : "s"} as draft application${createdCount === 1 ? "" : "s"}.` +
            (skippedCount > 0 ? ` ${skippedCount} already had a draft.` : ""),
        );
      } else {
        toast.info("These jobs already have a draft application.");
      }
      exitSelectMode();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create drafts",
      );
    } finally {
      setCreatingDrafts(false);
    }
  }

  if (results.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            selectMode
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border text-muted-foreground hover:text-foreground hover:border-ring",
          )}
        >
          {selectMode ? "Cancel" : "Select"}
        </button>
      </div>

      {selectMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            {results.every((r) => selectedMatchIds.has(r.match_id))
              ? "Deselect all"
              : "Select all"}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground">
              {selectedMatchIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleCreateDrafts}
              disabled={selectedMatchIds.size === 0 || creatingDrafts}
              className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {creatingDrafts ? "Saving…" : "Save as drafts"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {results.map((item) => (
          <MatchCard
            key={item.match_id}
            item={item}
            onClick={() =>
              selectMode ? toggleMatchSelected(item.match_id) : onOpenJob?.(item)
            }
            selectable={selectMode}
            selected={selectedMatchIds.has(item.match_id)}
            onSelectedChange={() => toggleMatchSelected(item.match_id)}
          />
        ))}
      </div>
    </div>
  );
}
