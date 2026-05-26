import type { StaffCommissionProgress } from "@/lib/commissions";
import { formatCurrency } from "@/lib/format";

export function CommissionProgress({
  progress,
  title = "Target progress",
}: {
  progress: StaffCommissionProgress;
  title?: string;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
            Today commission
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(progress.todayCommissionCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {progress.todayOrderCount} order{progress.todayOrderCount === 1 ? "" : "s"} today
          </p>
        </div>
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
            Daily payout pace
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(progress.todayPayoutPaceCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Includes RM70 basic pay</p>
        </div>
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
            Total commission
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(progress.totalCommissionCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatCurrency(progress.sevenDayCommissionCents)} in the last 7 days
          </p>
        </div>
      </div>

      <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">{title}</p>
          <p className="text-sm font-medium text-[var(--muted-strong)]">
            {formatCurrency(progress.todayTargetBonusCents)} target bonus today
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          {progress.targets.map((target) => (
            <div key={target.key} className="grid gap-3">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{target.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {target.soldUnits}/{target.targetUnits} sold
                    {target.remainingUnits ? ` · ${target.remainingUnits} to target` : " · target hit"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(target.commissionCents)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {target.sevenDayTargetDaysMet}/7 streak days
                  </p>
                </div>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-[var(--brand-gold)]"
                  style={{ width: `${target.progressPercent}%` }}
                />
              </div>

              <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-3">
                <p>Bonus: {formatCurrency(target.targetBonusCents)}</p>
                <p>Daily target payout: {formatCurrency(target.dailyTargetPayoutCents)}</p>
                <p>7-day target: {formatCurrency(target.sevenDayTargetPayoutCents)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
