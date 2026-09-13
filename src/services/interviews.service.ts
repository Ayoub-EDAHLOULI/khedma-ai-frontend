import { api } from "@/lib/api";
import type { InterviewSession, InterviewSessionInput } from "@/types/api";

export const interviewsService = {
  create: (data: InterviewSessionInput) =>
    api.post<InterviewSession>("/interviews", data),
  get: (id: string) => api.get<InterviewSession>(`/interviews/${id}`),
};
