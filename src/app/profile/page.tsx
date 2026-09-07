"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/form/TagInput";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/validations/profile.schema";
import { profileService } from "@/services/profile.service";
import { ApiError } from "@/lib/api";
import { CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const defaultValues: ProfileFormValues = {
  full_name: "",
  base_country: "",
  target_countries: [],
  cv_text: "",
  skills: [],
  preferred_languages: ["darija", "fr", "ar", "en"],
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    profileService
      .get()
      .then((profile) =>
        reset({
          full_name: profile.full_name,
          base_country: profile.base_country,
          target_countries: profile.target_countries,
          cv_text: profile.cv_text,
          skills: profile.skills,
          preferred_languages: profile.preferred_languages,
        }),
      )
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      })
      .finally(() => setLoading(false));
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
      <div className="flex h-screen w-full items-center justify-center bg-[#131418]">
        <p className="text-gray-400">Loading your profile…</p>
      </div>
    );
  }

  const inputClasses =
    "bg-[#1e1f26] border border-[#2e303b] focus-visible:border-blue-500 focus-visible:ring-0 text-gray-200 rounded-xl px-4 py-2.5 transition-colors";

  return (
    <div className="flex min-h-screen w-full bg-[#131418] text-gray-200 font-sans relative">
      {/* Floating Bottom Left Action */}
      <div className="fixed bottom-6 left-6 z-20">
        <button className="flex size-10 items-center justify-center rounded-full border border-gray-700 bg-[#1e1f26] text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors">
          <CircleUser className="size-5" />
        </button>
      </div>

      {/* Floating Bottom Right Logo */}
      <div className="fixed bottom-6 right-6 z-20">
        <div className="flex size-10 items-center justify-center rounded-full border border-gray-700 bg-[#1e1f26] text-gray-200 font-semibold font-heading hover:border-gray-500 transition-colors cursor-pointer">
          N
        </div>
      </div>

      <main className="mx-auto w-full max-w-2xl px-6 pt-20 pb-32">
        <header className="mb-10">
          <h1 className="text-3xl font-medium text-[#e3e3e6] tracking-wide font-heading">
            Your profile
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            This is what your search results and generated applications are
            built from.
          </p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="full_name" className="text-gray-300 font-medium">
              Full name
            </Label>
            <Input
              id="full_name"
              className={inputClasses}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-sm text-red-400">{errors.full_name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <Label htmlFor="base_country" className="text-gray-300 font-medium">
              Base country
            </Label>
            <Input
              id="base_country"
              placeholder="MA"
              maxLength={2}
              className={inputClasses}
              {...register("base_country")}
            />
            <p className="text-[13px] text-gray-400 mt-1">
              2-letter ISO code. Drives which jobs count as &quot;local&quot;.
            </p>
            {errors.base_country && (
              <p className="text-sm text-red-400">
                {errors.base_country.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <Label className="text-gray-300 font-medium">
              Target countries (international opt-in)
            </Label>
            <Controller
              control={control}
              name="target_countries"
              render={({ field }) => (
                <div
                  className={cn(
                    inputClasses,
                    "py-1.5 focus-within:border-blue-500",
                  )}
                >
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="FR, DE, …"
                  />
                </div>
              )}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <Label htmlFor="cv_text" className="text-gray-300 font-medium">
              CV text
            </Label>
            <Textarea
              id="cv_text"
              rows={5}
              className={cn(inputClasses, "resize-y min-h-30 leading-relaxed")}
              {...register("cv_text")}
            />
            {errors.cv_text && (
              <p className="text-sm text-red-400">{errors.cv_text.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <Label className="text-gray-300 font-medium">Skills</Label>
            <Controller
              control={control}
              name="skills"
              render={({ field }) => (
                <div
                  className={cn(
                    inputClasses,
                    "py-1.5 focus-within:border-blue-500",
                  )}
                >
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Python, FastAPI, …"
                  />
                </div>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="self-start mt-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-5 text-sm font-medium transition-colors border-none"
          >
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </main>
    </div>
  );
}
