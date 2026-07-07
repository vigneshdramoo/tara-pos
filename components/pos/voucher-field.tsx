"use client";

/**
 * TARA POS — Voucher field (checkout column)
 * Styled to match the POS light surface design.
 * Requires: pnpm add html5-qrcode  (already installed)
 */

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { QrCode, Ticket, X } from "lucide-react";

const CODE_PATTERN = /^TARA-[A-Z0-9]{4}$/;

export type AppliedVoucher = {
  code: string;
  discount: number;  // RM
  newTotal: number;  // RM
};

export function VoucherField({
  cartTotal,          // subtotal in RM (pre-tax)
  onApply,            // (voucher: AppliedVoucher | null) => void
}: {
  cartTotal: number;
  onApply: (voucher: AppliedVoucher | null) => void;
}) {
  const [mode, setMode] = useState<"idle" | "scanning" | "checking" | "applied" | "error">("idle");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<{
    ok: boolean;
    discount?: number;
    newTotal?: number;
    reason?: string;
  } | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  async function check(rawCode: string) {
    const cleaned = rawCode.trim().toUpperCase();
    if (!CODE_PATTERN.test(cleaned)) {
      setResult({ ok: false, reason: "Not a TARA voucher code" });
      setMode("error");
      return;
    }
    setMode("checking");
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleaned, cartTotal }),
      }).then((r) => r.json());

      setCode(cleaned);
      setResult(res);
      if (res.ok) {
        setMode("applied");
        onApply({ code: cleaned, discount: res.discount, newTotal: res.newTotal });
      } else {
        setMode("error");
      }
    } catch {
      setResult({ ok: false, reason: "Could not check the code. Try again." });
      setMode("error");
    }
  }

  async function startScan() {
    setMode("scanning");
    const scanner = new Html5Qrcode("voucher-qr-reader");
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          void stopScan();
          void check(decodedText);
        },
        () => {},
      );
    } catch {
      setMode("idle");
      setResult({ ok: false, reason: "Camera unavailable — type the code instead." });
    }
  }

  async function stopScan() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      // scanner already stopped
    }
    scannerRef.current = null;
  }

  useEffect(() => {
    return () => {
      void stopScan();
    };
  }, []);

  function reset() {
    setMode("idle");
    setCode("");
    setResult(null);
    onApply(null);
  }

  return (
    <div className="tara-surface p-3 md:p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        <Ticket className="h-4 w-4 text-[rgba(202,158,91,1)]" strokeWidth={1.8} />
        Voucher
      </div>

      {mode === "applied" && result?.ok ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-sm font-bold text-stone-900">{code}</div>
            <div className="text-sm font-medium text-emerald-700">
              −RM{result.discount?.toFixed(2)} applied
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="flex min-h-10 items-center gap-1 rounded-2xl border border-[var(--line)] bg-white px-3 text-xs font-semibold text-stone-600 transition hover:border-stone-950"
          >
            <X className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void check(code);
                }
              }}
              placeholder="TARA-XXXX"
              maxLength={9}
              className="min-h-11 w-32 flex-1 rounded-[18px] border border-[var(--line)] bg-white/90 px-3 font-mono text-sm uppercase text-stone-900 outline-none transition focus:border-stone-950"
            />
            <button
              type="button"
              onClick={() => void check(code)}
              disabled={mode === "checking" || !code}
              className="min-h-11 rounded-2xl bg-stone-950 px-4 text-xs font-semibold text-stone-50 transition disabled:opacity-40"
            >
              {mode === "checking" ? "Checking…" : "Apply"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (mode === "scanning") {
                  void stopScan();
                  setMode("idle");
                } else {
                  void startScan();
                }
              }}
              className="flex min-h-11 items-center gap-1.5 rounded-2xl border border-[var(--line)] bg-white px-3 text-xs font-semibold text-stone-700 transition hover:border-stone-950"
            >
              <QrCode className="h-4 w-4" strokeWidth={1.8} />
              {mode === "scanning" ? "Stop" : "Scan"}
            </button>
          </div>

          <div
            id="voucher-qr-reader"
            className={mode === "scanning" ? "mt-3 overflow-hidden rounded-[18px]" : "hidden"}
          />

          {mode === "error" && result?.reason ? (
            <p className="mt-2 text-sm font-medium text-red-600">{result.reason}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
