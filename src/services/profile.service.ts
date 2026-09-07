import { api } from "@/lib/api";
import type { ParsedResume, Profile, ProfileInput } from "@/types/api";

export const profileService = {
  get: () => api.get<Profile>("/profile"),
  save: (data: ProfileInput) => api.post<Profile>("/profile", data),
  parseResume: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.postForm<ParsedResume>("/profile/parse-resume", formData);
  },
};
