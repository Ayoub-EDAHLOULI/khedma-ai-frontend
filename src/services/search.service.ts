import { api } from "@/lib/api";
import type { SearchInput, SearchResult } from "@/types/api";

export const searchService = {
  search: (data: SearchInput) => api.post<SearchResult>("/search", data),
};
