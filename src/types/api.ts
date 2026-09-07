export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export type LocationScope = "local" | "international";

export interface Profile {
  id: string;
  full_name: string;
  base_country: string;
  target_countries: string[];
  cv_text: string;
  skills: string[];
  preferred_languages: string[];
  created_at: string;
}

export interface ProfileInput {
  full_name: string;
  base_country: string;
  target_countries?: string[];
  cv_text: string;
  skills?: string[];
  preferred_languages?: string[];
}

export interface ParsedResume {
  full_name: string;
  skills: string[];
  cv_text: string;
}

export interface Job {
  id: string;
  source: string;
  title: string;
  company: string | null;
  country: string | null;
  city: string | null;
  is_remote: boolean;
  scope: LocationScope | null;
  description: string | null;
}

export interface SearchResultItem {
  match_id: string;
  job: Job;
  score: number;
  reasoning: string;
}

export interface SearchResult {
  detected_language: string;
  reply: string;
  results: SearchResultItem[];
}

export interface SearchInput {
  message: string;
  profile_id: string;
  scope?: LocationScope;
}

export interface PrepareResult {
  tailored_cv: string;
  cover_letter: string;
}

export type ApplicationStatus = "draft" | "applied" | "rejected" | "interview";

export interface Application {
  id: string;
  match_id: string;
  tailored_cv: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
}
