import { api } from "@/lib/api";
import type {
  InterviewSession,
  InterviewSessionInput,
  InterviewTurn,
  InterviewTurnInput,
} from "@/types/api";
import type { VoiceSessionToken } from "@/services/voice.service";

export const interviewsService = {
  create: (data: InterviewSessionInput) =>
    api.post<InterviewSession>("/interviews", data),
  get: (id: string) => api.get<InterviewSession>(`/interviews/${id}`),
  createVoiceToken: (sessionId: string) =>
    api.post<VoiceSessionToken>(`/interviews/${sessionId}/voice-token`),
  addTurn: (sessionId: string, data: InterviewTurnInput) =>
    api.post<InterviewTurn>(`/interviews/${sessionId}/turns`, data),
  listTurns: (sessionId: string) =>
    api.get<InterviewTurn[]>(`/interviews/${sessionId}/turns`),
  end: (sessionId: string) =>
    api.post<InterviewSession>(`/interviews/${sessionId}/end`),
};
