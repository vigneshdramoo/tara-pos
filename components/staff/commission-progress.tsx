import { BASIC_DAILY_PAY_CENTS, type StaffCommissionProgress } from "@/lib/commissions";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function CommissionProgress({
  progress,
  title = "Target progress",
}: {
  progress: StaffCommissionProgress;
  title?: string;
}) {
  const seniorOverride = progress.seniorOverride;
  const seniorOverrideCents = seniorOverride?.todayCommissionCents ?? 0;
  const performancePayCents =
    progress.todayCommissionCents + progress.todayTargetBonusCents + seniorOverrideCents;

  return (
    <div className="grid gap-4">
      <div className="rounded-[24px] border border-[rgba(202,158,91,0.24)] bg-[rgba(202,158,91,0.10)] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
          Selling coach
        </p>
        <h4 className="mt-2 text-lg font-semibold text-foreground">
          {progress.nextCoachingMessage}
        </h4>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {progress.historicalSameWeekdayOrderAverage !== null
            ? `Your average ${progress.todayWeekdayLabel} closes ${progress.historicalSameWeekdayOrderAverage} order${
                progress.historicalSameWeekdayOrderAverage === 1 ? "" : "s"
              }, so the day can still build from here.`
            : `There is no previous ${progress.todayWeekdayLabel} benchmark yet, so today sets the pace.`}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
            Today payout
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(progress.todayPayoutPaceCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Base pay + commission + unlocked bonus
          </p>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
            Basic pay
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(BASIC_DAILY_PAY_CENTS)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Guaranteed shift floor</p>
        </div>

        <div className="rounded-[22px] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
            Today direct commission
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
            Bonus unlocked
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {formatCurrency(progress.todayTargetBonusCents)}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {formatCurrency(performancePayCents)} performance pay today
          </p>
        </div>

        {seniorOverride ? (
          <div className="rounded-[22px] border border-[rgba(26,51,74,0.18)] bg-[rgba(26,51,74,0.08)] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--brand-gold)]">
              Coaching override
            </p>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {formatCurrency(seniorOverride.todayCommissionCents)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {seniorOverride.rateLabel} from coached crew sales today
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
              Payout breakdown
            </p>
            <h4 className="mt-2 text-lg font-semibold text-foreground">
              {formatCurrency(BASIC_DAILY_PAY_CENTS)} base +{" "}
              {formatCurrency(progress.todayCommissionCents)} commission +{" "}
              {formatCurrency(progress.todayTargetBonusCents)} bonus
              {seniorOverride
                ? ` + ${formatCurrency(seniorOverride.todayCommissionCents)} coaching override`
                : ""}
            </h4>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-strong)]">
              Total commission
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {formatCurrency(progress.totalPayoutCommissionCents)}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {seniorOverride
                ? `${formatCurrency(progress.totalCommissionCents)} direct + ${formatCurrency(
                    seniorOverride.totalCommissionCents,
                  )} coaching`
                : `${formatCurrency(progress.sevenDayCommissionCents)} in the last 7 days`}
            </p>
          </div>
        </div>
      </div>

      {seniorOverride ? (
        <div className="rounded-[24px] border border-[rgba(26,51,74,0.18)] bg-[linear-gradient(135deg,rgba(26,51,74,0.08),rgba(202,158,91,0.10))] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
                {seniorOverride.title}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-foreground">
                {seniorOverride.rateLabel} coaching commission from{" "}
                {seniorOverride.crewNames.join(", ")}
              </h4>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                The coached Scent Trail Crew keeps their own 10% commission. This is a separate
                senior override from completed sales dated {seniorOverride.effectiveFromDateKey} onward.
              </p>
            </div>
            <div className="rounded-[20px] border border-white/60 bg-white/70 px-4 py-3 text-left sm:text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-strong)]">
                Today coached sales
              </p>
              <p className="mt-2 text-xl font-semibold text-foreground">
                {formatCurrency(seniorOverride.todaySalesCents)}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {seniorOverride.todayOrderCount} order
                {seniorOverride.todayOrderCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-[18px] border border-white/60 bg-white/62 p-3">
              <p className="text-[var(--muted)]">Today override</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(seniorOverride.todayCommissionCents)}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/60 bg-white/62 p-3">
              <p className="text-[var(--muted)]">7-day override</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(seniorOverride.sevenDayCommissionCents)}
              </p>
            </div>
            <div className="rounded-[18px] border border-white/60 bg-white/62 p-3">
              <p className="text-[var(--muted)]">Total override</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(seniorOverride.totalCommissionCents)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
            {title}
          </p>
          <p className="text-sm font-medium text-[var(--muted-strong)]">
            {formatCurrency(progress.todayTargetBonusCents)} target bonus today
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          {progress.targets.map((target) => (
            <div
              key={target.key}
              className="grid gap-3 rounded-[22px] border border-[var(--line)] bg-white/72 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{target.label}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {target.soldUnits}/{target.targetUnits} sold
                    {target.remainingUnits
                      ? ` · ${target.remainingUnits} to target`
                      : " · target hit"}
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
                  className={cn(
                    "h-full rounded-full",
                    target.targetMet ? "bg-[var(--brand-midnight)]" : "bg-[var(--brand-gold)]",
                  )}
                  style={{ width: `${target.progressPercent}%` }}
                />
              </div>

              <div className="grid gap-2 text-sm text-[var(--muted-strong)]">
                <p>
                  {target.targetMet
                    ? `Target met. ${formatCurrency(target.targetBonusCents)} bonus is already locked for today.`
                    : `Sell ${target.remainingUnits} more ${target.label} unit${
                        target.remainingUnits === 1 ? "" : "s"
                      } to unlock ${formatCurrency(target.targetBonusCents)}.`}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {target.sameWeekdayAverageUnits !== null
                    ? `Typical ${progress.todayWeekdayLabel}: ${target.sameWeekdayAverageUnits} ${target.label} sold.`
                    : `No previous ${progress.todayWeekdayLabel} baseline for ${target.label} yet.`}
                </p>
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
