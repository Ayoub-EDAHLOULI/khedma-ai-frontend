import Link from "next/link";
import { User } from "lucide-react";

export function ProfileButton() {
  return (
    <Link
      href="/profile"
      aria-label="Your profile"
      className="fixed bottom-6 left-6 z-50 flex size-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent"
    >
      <User className="size-5" />
    </Link>
  );
}
