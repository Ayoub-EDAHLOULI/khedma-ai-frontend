import { api } from "@/lib/api";
import type { ManualJobInput, ManualJobResult } from "@/types/api";

export const jobsService = {
  createManual: (data: ManualJobInput) =>
    api.post<ManualJobResult>("/jobs/manual", data),
};
