import { api } from "@/lib/api";
import type { PrepareResult } from "@/types/api";

export const matchesService = {
  prepare: (matchId: string) =>
    api.post<PrepareResult>(`/matches/${matchId}/prepare`),
};
