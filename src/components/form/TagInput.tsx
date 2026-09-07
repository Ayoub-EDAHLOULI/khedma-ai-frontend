"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Escape") {
      setDraft("");
      setOpen(false);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 py-1.5">
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
            className="rounded-full outline-offset-2 hover:opacity-70"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}

      {open ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            addTag(draft);
            setOpen(false);
          }}
          placeholder={placeholder}
          className={cn(
            "min-w-32 flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:border-ring placeholder:text-muted-foreground",
            className,
          )}
        />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1.5 flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-ring hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add skill
        </button>
      )}
    </div>
  );
}
