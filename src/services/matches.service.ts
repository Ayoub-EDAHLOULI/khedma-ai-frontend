import { api } from "@/lib/api";
import type { BulkDraftResult, PrepareResult } from "@/types/api";

export const matchesService = {
  prepare: (matchId: string) =>
    api.post<PrepareResult>(`/matches/${matchId}/prepare`),
  downloadResume: (matchId: string) =>
    api.downloadFile(`/matches/${matchId}/resume.docx`, "resume.docx"),
  downloadCoverLetter: (matchId: string) =>
    api.downloadFile(
      `/matches/${matchId}/cover-letter.docx`,
      "cover-letter.docx",
    ),
  bulkDraft: (matchIds: string[]) =>
    api.post<BulkDraftResult>("/matches/bulk-draft", { match_ids: matchIds }),
};
