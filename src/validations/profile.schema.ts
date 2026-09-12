import { z } from "zod";

export const profileFormSchema = z.object({
  full_name: z.string().min(1, "Enter your name"),
  base_country: z
    .string()
    .length(2, "Use a 2-letter country code, e.g. MA")
    .toUpperCase(),
  target_countries: z.array(z.string().length(2).toUpperCase()),
  cv_text: z.string().min(1, "Paste your CV text"),
  skills: z.array(z.string().min(1)),
  preferred_languages: z.array(z.string()),
  email: z.union([z.literal(""), z.string().email("Enter a valid email")]),
  phone: z.string(),
  linkedin_url: z.union([z.literal(""), z.string().url("Enter a valid URL")]),
  github_url: z.union([z.literal(""), z.string().url("Enter a valid URL")]),
  portfolio_url: z.union([z.literal(""), z.string().url("Enter a valid URL")]),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
