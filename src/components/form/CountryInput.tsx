"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { COUNTRY_LIST, countryName } from "@/lib/countries";

interface CountryInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function CountryInput({
  value,
  onChange,
  placeholder,
  className,
}: CountryInputProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function updateRect() {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);
    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [open]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return COUNTRY_LIST.filter(
      (c) =>
        !value.includes(c.code) &&
        (c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q),
    ).slice(0, 8);
  }, [query, value]);

  function selectCountry(code: string) {
    onChange([...value, code]);
    setQuery("");
    setOpen(false);
  }

  function removeCountry(code: string) {
    onChange(value.filter((c) => c !== code));
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm focus-within:border-ring focus-within:ring-ring/50",
          className,
        )}
      >
        {value.map((code) => (
          <Badge key={code} variant="secondary" className="gap-1">
            {countryName(code)}
            <button
              type="button"
              onClick={() => removeCountry(code)}
              aria-label={`Remove ${countryName(code)}`}
              className="rounded-full outline-offset-2 hover:opacity-70"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && matches.length > 0) {
              e.preventDefault();
              selectCountry(matches[0].code);
            } else if (
              e.key === "Backspace" &&
              query === "" &&
              value.length > 0
            ) {
              removeCountry(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? placeholder : "Search countries…"}
          className="min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {open &&
        matches.length > 0 &&
        rect &&
        createPortal(
          <ul
            style={{ top: rect.top, left: rect.left, width: rect.width }}
            className="fixed z-50 max-h-56 overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-lg"
          >
            {matches.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectCountry(c.code)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent transition-colors"
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.code}
                  </span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
