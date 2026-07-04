"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatFullDateTime, formatInteger } from "@/lib/format";
import type { PayoutStaffReport, PayoutsData } from "@/lib/types";

function formatDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

function formatMinutes(minutes: number) {
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

function preferenceLabel(value: PayoutStaffReport["payoutPreference"]) {
  return value === "DAILY" ? "Daily" : "Every 2 days";
}

export function PayoutReportWorkspace({ data }: { data: PayoutsData }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updatePreference(payoutPreference: PayoutStaffReport["payoutPreference"]) {
    setMessage(null);
    setPendingKey(`preference:${payoutPreference}`);
    startTransition(async () => {
      const response = await fetch("/api/payout-preference", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payoutPreference }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      setPendingKey(null);
      if (!response.ok) {
        setMessage(body?.message ?? "Payout preference update failed.");
        return;
      }

      router.refresh();
    });
  }

  function markCompleted(staffUserId: string, dateKey: string) {
    const actionKey = `${staffUserId}:${dateKey}`;
    setMessage(null);
    setPendingKey(actionKey);
    startTransition(async () => {
      const response = await fetch("/api/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffUserId, dateKey }),
      });
      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      setPendingKey(null);
      if (!response.ok) {
        setMessage(body?.message ?? "Payout completion failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {message ? (
        <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      ) : null}

      {data.reports.map((report) => {
        const sevenDayTotal = report.days.reduce((sum, day) => sum + day.totalPayoutCents, 0);
        const sevenDayHours = report.days.reduce((sum, day) => sum + day.clockedHours, 0);
        const currentPreference = report.payoutPreference;

        return (
          <section
            key={report.staffUserId}
            className="tara-surface grid gap-5 rounded-[26px] p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
                  <WalletCards className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
                    @{report.username}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-foreground">
                    {report.staffName}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {preferenceLabel(currentPreference)} payout preference · {sevenDayHours}h
                    payable in this view
                  </p>
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--line)] bg-white/75 px-5 py-4 text-left sm:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                  7-day payout
                </p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {formatCurrency(sevenDayTotal)}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatInteger(report.days.length)} daily records
                </p>
              </div>
            </div>

            {!data.canManageAll ? (
              <div className="flex flex-wrap items-center gap-2 rounded-[22px] border border-[var(--line)] bg-white/70 p-3">
                <span className="px-2 text-sm font-medium text-[var(--muted-strong)]">
                  Payout preference
                </span>
                {(["DAILY", "EVERY_TWO_DAYS"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={isPending || option === currentPreference}
                    onClick={() => updatePreference(option)}
                    className={
                      option === currentPreference
                        ? "tara-button-primary min-h-[42px] rounded-2xl px-4 text-sm"
                        : "tara-button-secondary min-h-[42px] rounded-2xl px-4 text-sm disabled:opacity-60"
                    }
                  >
                    {pendingKey === `preference:${option}` ? (
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    ) : null}
                    {preferenceLabel(option)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3">
              {report.days.map((day) => {
                const actionKey = `${day.staffUserId}:${day.dateKey}`;
                const canComplete =
                  data.canManageAll && day.status !== "COMPLETED" && day.totalPayoutCents > 0;

                return (
                  <article
                    key={`${day.staffUserId}:${day.dateKey}`}
                    className="rounded-[24px] border border-[var(--line)] bg-white/75 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
                          {formatDateKey(day.dateKey)}
                        </p>
                        <h4 className="mt-2 text-xl font-semibold text-foreground">
                          {formatCurrency(day.totalPayoutCents)}
                        </h4>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {day.clockedHours}h payable · {formatMinutes(day.clockedMinutes)} actual
                          clocked · {day.orderCount} order{day.orderCount === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                        <span
                          className={
                            day.status === "COMPLETED"
                              ? "tara-chip-accent rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                              : "tara-chip-default rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                          }
                        >
                          {day.status === "COMPLETED" ? "Paid" : "Pending"}
                        </span>
                        {canComplete ? (
                          <button
                            type="button"
                            disabled={pendingKey === actionKey}
                            onClick={() => markCompleted(day.staffUserId, day.dateKey)}
                            className="tara-button-primary inline-flex min-h-[42px] items-center justify-center gap-2 rounded-2xl px-4 text-sm disabled:opacity-60"
                          >
                            {pendingKey === actionKey ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Mark completed
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm sm:grid-cols-5">
                      <Metric label="Base at RM10/hr" value={formatCurrency(day.basePayCents)} />
                      <Metric label="Commission" value={formatCurrency(day.directCommissionCents)} />
                      <Metric label="Target bonus" value={formatCurrency(day.targetBonusCents)} />
                      <Metric label="Senior override" value={formatCurrency(day.seniorOverrideCents)} />
                      <Metric label="Sales" value={formatCurrency(day.salesCents)} />
                    </div>

                    {day.completedAt ? (
                      <p className="mt-3 text-xs text-[var(--muted)]">
                        Completed {formatFullDateTime(day.completedAt)}
                        {day.completedByName ? ` by ${day.completedByName}` : ""}.
                      </p>
                    ) : null}

                    {day.orderRows.length ? (
                      <details className="mt-3 rounded-[18px] border border-[var(--line)] bg-[var(--surface-soft)] px-4 py-3">
                        <summary className="cursor-pointer text-sm font-medium text-foreground">
                          View order details
                        </summary>
                        <div className="mt-3 grid gap-2">
                          {day.orderRows.map((order) => (
                            <div
                              key={order.orderNumber}
                              className="rounded-[14px] bg-white/70 px-3 py-2 text-xs text-[var(--muted-strong)]"
                            >
                              <span className="font-semibold text-foreground">
                                {order.orderNumber}
                              </span>{" "}
                              · {formatCurrency(order.totalCents)} · {order.itemSummary}
                            </div>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      {!data.reports.length ? (
        <div className="tara-alert-warning rounded-[24px] px-5 py-4 text-sm">
          No Scent Trail payout accounts are available for this view.
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-[var(--line)] bg-white/70 p-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--brand-gold)]">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
