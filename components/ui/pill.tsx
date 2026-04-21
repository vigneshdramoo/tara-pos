import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Pill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        tone === "accent" && "tara-chip-accent",
        tone === "danger" && "tara-chip-danger",
        tone === "default" && "tara-chip-default",
      )}
    >
      {children}
    </span>
  );
}
