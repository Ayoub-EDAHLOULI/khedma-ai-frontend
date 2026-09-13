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
  resume_filename: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  created_at: string;
}

export interface ProfileInput {
  full_name: string;
  base_country: string;
  target_countries?: string[];
  cv_text: string;
  skills?: string[];
  preferred_languages?: string[];
  resume_docx?: string | null;
  resume_filename?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
}

export interface ParsedResume {
  full_name: string;
  skills: string[];
  cv_text: string;
  resume_docx?: string | null;
  resume_filename?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
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
  seniority: string | null;
  description: string | null;
  url: string | null;
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

export type Seniority = "junior" | "mid" | "senior";

export interface SearchInput {
  message: string;
  profile_id: string;
  scope?: LocationScope;
  remote_only?: boolean;
  country?: string;
  seniority?: Seniority;
  limit?: number;
}

export interface PrepareResult {
  id: string;
  status: ApplicationStatus;
  tailored_cv: string;
  cover_letter: string;
}

export type ApplicationStatus = "draft" | "applied" | "rejected" | "interview";

export interface Application {
  id: string;
  match_id: string;
  job: Job;
  score: number;
  tailored_cv: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface BulkDraftResult {
  created: Application[];
  already_existed: Application[];
}

export interface ManualJobInput {
  title: string;
  company?: string | null;
  description: string;
  scope: LocationScope;
}

export interface ManualJobResult {
  job: Job;
  match_id: string;
}

export type InterviewType = "hr" | "technical" | "manager";
export type InterviewLanguage = "darija" | "fr" | "ar" | "en";
export type InterviewSessionStatus = "setup" | "active" | "completed";

export interface InterviewSessionInput {
  job_id: string;
  interview_type: InterviewType;
  language: InterviewLanguage;
  scope: LocationScope;
}

export interface InterviewSession {
  id: string;
  job: Job;
  interview_type: InterviewType;
  language: InterviewLanguage;
  scope: LocationScope;
  status: InterviewSessionStatus;
  created_at: string;
}

export type InterviewSpeaker = "interviewer" | "candidate";

export interface InterviewTurnInput {
  speaker: InterviewSpeaker;
  content: string;
}

export interface InterviewTurn {
  id: string;
  speaker: InterviewSpeaker;
  content: string;
  created_at: string;
}
