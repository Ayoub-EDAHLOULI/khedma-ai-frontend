import { api } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/types/api";

export const applicationsService = {
  list: () => api.get<Application[]>("/applications"),
  updateStatus: (id: string, status: ApplicationStatus) =>
    api.patch<Application>(`/applications/${id}`, { status }),
};
