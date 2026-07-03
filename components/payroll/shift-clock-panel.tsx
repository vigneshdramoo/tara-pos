"use client";

import { useState, useTransition } from "react";
import { Clock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ShiftClockSummary } from "@/lib/payroll";
import { formatFullDateTime } from "@/lib/format";

function formatClockedTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (!hours) {
    return `${remainder}m`;
  }

  if (!remainder) {
    return `${hours}h`;
  }

  return `${hours}h ${remainder}m`;
}

export function ShiftClockPanel({ summary }: { summary: ShiftClockSummary }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isClockedIn = Boolean(summary.currentShift);

  function submit(action: "CLOCK_IN" | "CLOCK_OUT") {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/shifts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setMessage(body?.message ?? "Shift clock update failed.");
        return;
      }

      router.refresh();
    });
  }

  if (!summary.eligible) {
    return null;
  }

  return (
    <section className="rounded-[26px] border border-[rgba(26,51,74,0.16)] bg-white/75 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
            <Clock className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
              Shift clock
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              {isClockedIn ? "You are clocked in" : "Ready to start shift"}
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Hours are totalled by GMT+8 date and rounded up for payout calculation.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => submit(isClockedIn ? "CLOCK_OUT" : "CLOCK_IN")}
          className="tara-button-primary inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 text-sm font-medium disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isClockedIn ? "Clock out" : "Clock in"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">Today</p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {summary.today.roundedHours}h payable
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatClockedTime(summary.today.clockedMinutes)} actual clocked time
          </p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Current status
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {isClockedIn ? "Open shift" : "Closed"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {summary.currentShift
              ? `Started ${formatFullDateTime(summary.currentShift.clockInAt)}`
              : "No active clock session"}
          </p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
            Payout cadence
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {summary.payoutPreference === "DAILY" ? "Daily" : "Every 2 days"}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Manage this on the Payouts page.</p>
        </div>
      </div>

      {summary.today.shifts.length ? (
        <div className="mt-4 grid gap-2">
          {summary.today.shifts.map((shift) => (
            <div
              key={shift.id}
              className="rounded-[18px] border border-[var(--line)] bg-white/70 px-4 py-3 text-sm text-[var(--muted-strong)]"
            >
              {formatFullDateTime(shift.clockInAt)} to{" "}
              {shift.clockOutAt ? formatFullDateTime(shift.clockOutAt) : "now"} ·{" "}
              {formatClockedTime(shift.clockedMinutes)}
            </div>
          ))}
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}
