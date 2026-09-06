"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        // No profile yet is expected on first run — start from a blank form.
        if (!(err instanceof ApiError && err.status === 404)) {
          setErrorMessage(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      })
      .finally(() => setLoading(false));
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    setStatus("saving");
    setErrorMessage(null);
    try {
      await profileService.save(values);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save profile",
      );
    }
  }

  if (loading) {
    return <p className="p-8 text-muted-foreground">Loading your profile…</p>;
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-heading text-2xl font-medium text-foreground">
        Your profile
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is what your search results and generated applications are built
        from.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" {...register("full_name")} />
          {errors.full_name && (
            <p className="text-sm text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="base_country">Base country</Label>
          <Input
            id="base_country"
            placeholder="MA"
            maxLength={2}
            {...register("base_country")}
          />
          <p className="text-sm text-muted-foreground">
            2-letter ISO code. Drives which jobs count as &quot;local&quot;.
          </p>
          {errors.base_country && (
            <p className="text-sm text-destructive">
              {errors.base_country.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Target countries (international opt-in)</Label>
          <Controller
            control={control}
            name="target_countries"
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                placeholder="FR, DE, …"
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cv_text">CV text</Label>
          <Textarea id="cv_text" rows={10} {...register("cv_text")} />
          {errors.cv_text && (
            <p className="text-sm text-destructive">{errors.cv_text.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>Skills</Label>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <TagInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Python, FastAPI, …"
              />
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={status === "saving"}
          className="self-start"
        >
          {status === "saving" ? "Saving…" : "Save profile"}
        </Button>

        {status === "saved" && (
          <p className="text-sm text-secondary-foreground">Profile saved.</p>
        )}
        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </form>
    </main>
  );
}
