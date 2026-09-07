import { api } from "@/lib/api";

export interface VoiceSessionToken {
  token: string;
  model: string;
  expire_time: string;
}

export const voiceService = {
  createSessionToken: () => api.post<VoiceSessionToken>("/voice/session-token"),
};
