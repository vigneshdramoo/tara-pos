import { Activity, PackageCheck, Target } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import { formatCurrency, formatInteger, formatTimeOnly } from "@/lib/format";
import type {
  Stop04CheckpointProgress,
  Stop04CheckpointStatus,
  Stop04StrategyProgress,
} from "@/lib/types";
import { cn } from "@/lib/utils";

function getCheckpointTone(status: Stop04CheckpointStatus) {
  if (status === "met") return "accent";
  if (status === "behind") return "danger";
  return "default";
}

function getCheckpointLabel(status: Stop04CheckpointStatus) {
  if (status === "met") return "Met";
  if (status === "behind") return "Behind";
  return "Pending";
}

function CheckpointCard({ checkpoint }: { checkpoint: Stop04CheckpointProgress }) {
  const progressPercent = checkpoint.targetUnits
    ? Math.min(100, Math.round((checkpoint.soldUnits / checkpoint.targetUnits) * 100))
    : 0;

  return (
    <div
      className={cn(
        "rounded-[22px] border p-4",
        checkpoint.status === "behind"
          ? "border-rose-200 bg-rose-50/70"
          : checkpoint.status === "met"
            ? "border-[rgba(202,158,91,0.32)] bg-[rgba(202,158,91,0.12)]"
            : "border-[var(--line)] bg-white/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{checkpoint.label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            {checkpoint.targetLabel}
          </p>
        </div>
        <Pill tone={getCheckpointTone(checkpoint.status)}>
          {getCheckpointLabel(checkpoint.status)}
        </Pill>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            checkpoint.status === "behind"
              ? "bg-rose-400"
              : "bg-[linear-gradient(90deg,var(--brand-gold),var(--brand-amber))]",
          )}
          style={{ width: `${Math.max(progressPercent, progressPercent > 0 ? 10 : 0)}%` }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted-strong)]">
        <span>
          Target{" "}
          <span className="tabular-nums font-semibold text-foreground">
            {formatInteger(checkpoint.targetUnits)}
          </span>
        </span>
        <span>
          Sold{" "}
          <span className="tabular-nums font-semibold text-foreground">
            {formatInteger(checkpoint.soldUnits)}
          </span>
        </span>
        {checkpoint.unitsGap > 0 ? (
          <span>
            Gap{" "}
            <span className="tabular-nums font-semibold text-foreground">
              {formatInteger(checkpoint.unitsGap)}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function Stop04Progress({ progress }: { progress: Stop04StrategyProgress | null }) {
  if (!progress) return null;

  const sellThroughBarWidth = Math.max(
    Math.min(progress.sellThroughPercent, 100),
    progress.sellThroughPercent > 0 ? 10 : 0,
  );

  return (
    <Surface className="grid gap-6 overflow-hidden">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">
            Stop 04 live strategy
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">
            Public Market sell-through tracker
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            {progress.booth} · {progress.eventWindow}. Use promotion{" "}
            <span className="font-semibold text-foreground">{progress.activePromotionId}</span> at
            checkout so every basket feeds this tracker.
          </p>
        </div>
        <Pill tone={getCheckpointTone(progress.currentCheckpoint.status)}>
          {progress.currentCheckpoint.label}
        </Pill>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[26px] border border-[rgba(202,158,91,0.28)] bg-[linear-gradient(135deg,rgba(202,158,91,0.16),rgba(255,251,246,0.92))] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                8mL sell-through
              </p>
              <p className="mt-2 text-4xl font-semibold text-foreground">
                {progress.sellThroughPercent}%
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <p className="text-[var(--muted)]">Opening</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatInteger(progress.openingEightMlUnits)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Sold</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatInteger(progress.soldEightMlUnits)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Remaining</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatInteger(progress.remainingEightMlUnits)}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted)]">Event AOV</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(progress.averageOrderCents)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/85">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-gold),var(--brand-amber),var(--brand-midnight))] transition-[width]"
              style={{ width: `${sellThroughBarWidth}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/72 p-3">
              <Activity className="h-5 w-5 text-[var(--brand-gold)]" strokeWidth={1.8} />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Orders</p>
                <p className="text-base font-semibold text-foreground">
                  {formatInteger(progress.orderCount)} event ·{" "}
                  {formatInteger(progress.strategyOrderCount)} tagged
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/72 p-3">
              <PackageCheck className="h-5 w-5 text-[var(--brand-gold)]" strokeWidth={1.8} />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Strategy revenue
                </p>
                <p className="text-base font-semibold text-foreground">
                  {formatCurrency(progress.strategyRevenueCents)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[20px] border border-white/70 bg-white/72 p-3">
              <Target className="h-5 w-5 text-[var(--brand-gold)]" strokeWidth={1.8} />
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Next checkpoint
                </p>
                <p className="text-base font-semibold text-foreground">
                  {formatTimeOnly(progress.currentCheckpoint.dueAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-[rgba(26,51,74,0.12)] bg-white/72 p-4 text-sm leading-6 text-[var(--brand-midnight)]">
            {progress.nextAction}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
              Package mix
            </p>
            <div className="mt-3 grid gap-2">
              {progress.offerMix.length ? (
                progress.offerMix.map((offer) => (
                  <div key={offer.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--muted-strong)]">{offer.label}</span>
                    <span className="font-semibold text-foreground">
                      {formatInteger(offer.count)} · {formatInteger(offer.units)} units
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  No Stop 04 packages captured yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
              Scent movement
            </p>
            <div className="mt-3 grid gap-2">
              {progress.scentMix.length ? (
                progress.scentMix.map((scent) => (
                  <div key={scent.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--muted-strong)]">{scent.name}</span>
                    <span className="font-semibold text-foreground">
                      {formatInteger(scent.units)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Scent movement appears once event baskets are checked out.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {progress.checkpoints.map((checkpoint) => (
          <CheckpointCard key={checkpoint.id} checkpoint={checkpoint} />
        ))}
      </div>
    </Surface>
  );
}

