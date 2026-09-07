"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { TagInput } from "@/components/form/TagInput";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/validations/profile.schema";
import { profileService } from "@/services/profile.service";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PARSED_RESUME_KEY } from "@/components/ResumeUploadDialog";
import type { ParsedResume } from "@/types/api";

const defaultValues: ProfileFormValues = {
  full_name: "",
  base_country: "",
  target_countries: [],
  cv_text: "",
  skills: [],
  preferred_languages: ["darija", "fr", "ar", "en"],
};

const inputClasses =
  "bg-background border border-border focus-visible:border-ring focus-visible:ring-0 text-foreground rounded-lg px-4 py-2.5 transition-colors";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // React Strict Mode double-invokes effects in dev — this ref makes the
  // sessionStorage read-and-clear idempotent so the second invocation doesn't
  // see it already gone and silently fall back to the plain profile fetch.
  const parsedResumeRef = useRef<ParsedResume | null | undefined>(undefined);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (parsedResumeRef.current === undefined) {
      const parsedRaw = sessionStorage.getItem(PARSED_RESUME_KEY);
      parsedResumeRef.current = parsedRaw ? JSON.parse(parsedRaw) : null;
      if (parsedResumeRef.current) {
        sessionStorage.removeItem(PARSED_RESUME_KEY);
      }
    }
    const parsed = parsedResumeRef.current;
    let cancelled = false;

    profileService
      .get()
      .then((profile) => {
        if (cancelled) return;
        reset({
          full_name: parsed?.full_name || profile.full_name,
          base_country: profile.base_country,
          target_countries: profile.target_countries,
          cv_text: parsed?.cv_text || profile.cv_text,
          skills: parsed?.skills?.length ? parsed.skills : profile.skills,
          preferred_languages: profile.preferred_languages,
        });
        if (parsed) {
          toast.info("Review the details we found, then save.");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          if (parsed) {
            reset({
              ...defaultValues,
              full_name: parsed.full_name,
              cv_text: parsed.cv_text,
              skills: parsed.skills,
            });
            toast.info("Review the details we found, then save.");
          }
          return;
        }
        toast.error(
          err instanceof Error ? err.message : "Failed to load profile",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    try {
      await profileService.save(values);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground font-sans">
      <div className="page-glow" />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-6 pt-10 pb-32">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to search
        </Link>

        <header className="mb-8">
          <h1 className="font-heading text-3xl font-medium tracking-wide text-foreground">
            Your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This is what your search results and generated applications are
            built from.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basics</CardTitle>
              <CardDescription>
                Your name and where you&apos;re based.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <Label
                  htmlFor="full_name"
                  className="font-medium text-foreground/90"
                >
                  Full name
                </Label>
                <Input
                  id="full_name"
                  className={inputClasses}
                  {...register("full_name")}
                />
                {errors.full_name && (
                  <p className="text-sm text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <Label
                  htmlFor="base_country"
                  className="font-medium text-foreground/90"
                >
                  Base country
                </Label>
                <Input
                  id="base_country"
                  placeholder="MA"
                  maxLength={2}
                  className={cn(inputClasses, "max-w-32")}
                  {...register("base_country")}
                />
                <p className="text-[13px] text-muted-foreground">
                  2-letter ISO code. Drives which jobs count as
                  &quot;local&quot;.
                </p>
                {errors.base_country && (
                  <p className="text-sm text-destructive">
                    {errors.base_country.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="font-medium text-foreground/90">
                  Target countries (international opt-in)
                </Label>
                <Controller
                  control={control}
                  name="target_countries"
                  render={({ field }) => (
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="FR, DE, …"
                      className="bg-background"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
              <CardDescription>
                Used to match and tailor applications to real postings.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col gap-2.5">
                <Label
                  htmlFor="cv_text"
                  className="font-medium text-foreground/90"
                >
                  CV text
                </Label>
                <Textarea
                  id="cv_text"
                  rows={5}
                  className={cn(
                    inputClasses,
                    "resize-y min-h-30 leading-relaxed",
                  )}
                  {...register("cv_text")}
                />
                {errors.cv_text && (
                  <p className="text-sm text-destructive">
                    {errors.cv_text.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="font-medium text-foreground/90">Skills</Label>
                <Controller
                  control={control}
                  name="skills"
                  render={({ field }) => (
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Python, FastAPI, …"
                      className="bg-background"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={saving}
            className="self-start mt-2 rounded-full px-6 py-5 text-sm font-medium"
          >
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </main>
    </div>
  );
}
