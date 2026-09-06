import { api } from "@/lib/api";
import type { Profile, ProfileInput } from "@/types/api";

export const profileService = {
  get: () => api.get<Profile>("/profile"),
  save: (data: ProfileInput) => api.post<Profile>("/profile", data),
};
