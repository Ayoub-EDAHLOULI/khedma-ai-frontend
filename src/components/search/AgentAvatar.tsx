"use client";

import { cn } from "@/lib/utils";

export type AgentState = "idle" | "thinking" | "replying";

const stateAnimationClass: Record<AgentState, string> = {
  idle: "animate-agent-idle",
  thinking: "animate-agent-thinking",
  replying: "animate-agent-reply",
};

export function AgentAvatar({
  state,
  className,
}: {
  state: AgentState;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={
        state === "thinking"
          ? "Agent is thinking"
          : state === "replying"
            ? "Agent has replied"
            : "Agent is idle"
      }
      className={cn(
        "relative size-12 shrink-0 rounded-full motion-reduce:animate-none",
        stateAnimationClass[state],
        className,
      )}
    >
      <div
        className="absolute inset-0 rounded-full opacity-90 blur-[1px]"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, var(--primary), var(--secondary) 65%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle at 65% 70%, color-mix(in oklch, var(--secondary), transparent 30%), transparent 60%)",
        }}
      />
    </div>
  );
}
