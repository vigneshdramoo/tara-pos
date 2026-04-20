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
        tone === "accent" && "bg-[var(--accent-soft)] text-stone-900",
        tone === "danger" && "bg-rose-100 text-rose-700",
        tone === "default" && "bg-stone-100 text-stone-700",
      )}
    >
      {children}
    </span>
  );
}
