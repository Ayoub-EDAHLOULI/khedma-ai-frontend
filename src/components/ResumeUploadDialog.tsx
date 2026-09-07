"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { FileText, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { profileService } from "@/services/profile.service";

const ACCEPTED_TYPES = ".pdf,.docx";

// Session-local hand-off from the parse step to the profile form — avoids
// round-tripping the parsed resume through the backend twice (parse, then
// save) before the user has reviewed/edited it.
export const PARSED_RESUME_KEY = "khedma:parsed-resume";

interface ResumeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResumeUploadDialog({
  open,
  onOpenChange,
}: ResumeUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  async function handleSubmit() {
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await profileService.parseResume(file);
      sessionStorage.setItem(PARSED_RESUME_KEY, JSON.stringify(parsed));
      onOpenChange(false);
      router.push("/profile?fromResume=1");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse resume");
    } finally {
      setParsing(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setFile(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-6 gap-5">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg">
            Upload your resume
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            PDF or Word. We&apos;ll extract your details so you can review them
            before saving.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
          >
            <Upload className="size-7" />
            <span className="text-[15px]">Click to choose a file</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted px-4 py-3.5">
            <FileText className="size-5 shrink-0 text-primary" />
            <span className="flex-1 truncate text-[15px] text-foreground">
              {file.name}
            </span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label="Remove file"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!file || parsing}
          className="w-full h-10"
        >
          {parsing ? "Reading resume…" : "Upload resume"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
