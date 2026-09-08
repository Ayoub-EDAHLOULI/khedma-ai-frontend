import Link from "next/link";
import { User, FileStack } from "lucide-react";

export function ProfileButton() {
  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col-reverse gap-3">
      <Link
        href="/profile"
        aria-label="Your profile"
        className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
      >
        <User className="size-5" />
      </Link>
      <Link
        href="/applications"
        aria-label="Your applications"
        className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
      >
        <FileStack className="size-5" />
      </Link>
    </div>
  );
}
