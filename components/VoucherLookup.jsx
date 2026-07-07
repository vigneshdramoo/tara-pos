"use client";

/**
 * TARA POS — Voucher lookup (admin)
 * Styled for the Atelier light theme. Prisma camelCase fields.
 */

import { useEffect, useMemo, useState } from "react";
import { Search, Ticket } from "lucide-react";

const CAMPAIGN = "SUNFEST-2026";

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-MY", { dateStyle: "medium", timeStyle: "short" }) : null;

function statusOf(v) {
  if (v.redeemedAt) return "Redeemed";
  if (new Date(v.expiresAt) < new Date()) return "Expired";
  if (v.claimedAt) return "Claimed";
  return "Issued";
}

const BADGE = {
  Redeemed: "bg-emerald-100 text-emerald-800",
  Claimed: "bg-sky-100 text-sky-800",
  Issued: "bg-stone-100 text-stone-600",
  Expired: "bg-red-100 text-red-700",
};

export default function VoucherLookup() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/vouchers/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign: CAMPAIGN }),
    })
      .then((r) => r.json())
      .then((data) => setVouchers(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = vouchers.length;
    const redeemed = vouchers.filter((v) => v.redeemedAt);
    const claimed = vouchers.filter((v) => v.claimedAt || v.redeemedAt).length;
    return {
      total,
      claimed,
      redeemed: redeemed.length,
      rate: total ? `${Math.round((redeemed.length / total) * 100)}%` : "–",
    };
  }, [vouchers]);

  const visible = useMemo(() => {
    const q = query.trim().toUpperCase();
    return vouchers.filter((v) => {
      if (filter !== "All" && statusOf(v) !== filter) return false;
      if (
        q &&
        !v.code.includes(q) &&
        !(v.winnerName || "").toUpperCase().includes(q)
      )
        return false;
      return true;
    });
  }, [vouchers, query, filter]);

  return (
    <section className="mx-auto grid max-w-3xl gap-3 pb-6 sm:gap-4">
      <div className="tara-surface p-4 md:p-6">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[rgba(202,158,91,1)]">
          <Ticket className="h-4 w-4" strokeWidth={1.8} />
          SunFest Lucky Draw
        </div>
        <h1 className="text-2xl font-semibold text-stone-900">Voucher lookup</h1>
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          ["Total", stats.total],
          ["Claimed", stats.claimed],
          ["Redeemed", stats.redeemed],
          ["Rate", stats.rate],
        ].map(([label, value]) => (
          <div key={label} className="tara-surface flex flex-col items-center py-3">
            <span className="text-xl font-bold text-stone-900">{value}</span>
            <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search code or winner name"
            className="min-h-11 w-full rounded-[18px] border border-[var(--line)] bg-white/90 pl-10 pr-3 text-sm text-stone-900 outline-none transition focus:border-stone-950"
          />
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="min-h-11 rounded-[18px] border border-[var(--line)] bg-white/90 px-3 text-sm font-medium text-stone-700 outline-none"
        >
          {["All", "Issued", "Claimed", "Redeemed", "Expired"].map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* list */}
      <div className="tara-surface divide-y divide-[var(--line)] overflow-hidden p-0">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-stone-500">Loading vouchers…</div>
        ) : (
          <>
            {visible.map((v) => {
              const status = statusOf(v);
              return (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => setSelected(v)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-stone-50"
                >
                  <span className="font-mono text-sm font-bold text-stone-900">{v.code}</span>
                  <span className="flex items-center gap-3">
                    {v.winnerName ? (
                      <span className="hidden text-sm text-stone-500 sm:inline">
                        {v.winnerName}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[status]}`}
                    >
                      {status}
                    </span>
                  </span>
                </button>
              );
            })}
            {!visible.length ? (
              <div className="px-4 py-8 text-center text-sm text-stone-500">
                No vouchers match.
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* detail drawer */}
      {selected ? (
        <div
          className="fixed inset-0 z-30 flex items-end bg-stone-950/40 sm:items-center sm:justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-md rounded-t-[24px] bg-white p-5 shadow-xl sm:rounded-[24px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-stone-900">{selected.code}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[statusOf(selected)]}`}
              >
                {statusOf(selected)}
              </span>
            </div>
            <p className="mb-4 text-sm text-stone-500">
              RM{Number(selected.value)} off · min spend RM{Number(selected.minSpend)} · expires{" "}
              {fmt(selected.expiresAt)}
            </p>

            <ol className="space-y-3 border-l-2 border-stone-100 pl-4">
              {[
                ["Created", fmt(selected.createdAt), null],
                [
                  "Claimed via DM",
                  fmt(selected.claimedAt),
                  selected.winnerName
                    ? `${selected.winnerName}${selected.winnerContact ? ` · ${selected.winnerContact}` : ""}`
                    : null,
                ],
                [
                  "Redeemed",
                  fmt(selected.redeemedAt),
                  selected.redeemedAt
                    ? `${selected.redeemedChannel || "unknown channel"} · order ${selected.orderId || "—"}`
                    : null,
                ],
              ].map(([label, when, note]) => (
                <li key={label} className={when ? "" : "opacity-40"}>
                  <div className="text-sm font-semibold text-stone-900">{label}</div>
                  <div className="text-xs text-stone-500">{when || "Not yet"}</div>
                  {note ? <div className="text-xs text-stone-400">{note}</div> : null}
                </li>
              ))}
            </ol>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-5 min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white text-sm font-semibold text-stone-700 transition hover:border-stone-950"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
