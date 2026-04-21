"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(202,158,91,0.18),_transparent_38%),radial-gradient(circle_at_100%_0%,_rgba(75,48,106,0.18),_transparent_28%),linear-gradient(180deg,_#fbf7f0_0%,_#f7f3eb_48%,_#efe7da_100%)]" />
      <section className="relative z-10 w-full max-w-2xl rounded-[36px] border border-[rgba(202,158,91,0.18)] bg-[rgba(255,251,246,0.72)] p-6 shadow-[0_40px_120px_rgba(18,22,34,0.12)] backdrop-blur md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(75,48,106,0.12)] text-[var(--brand-purple)]">
            <AlertTriangle className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--brand-gold)]">TARA</p>
            <h1 className="mt-3 font-display text-4xl text-foreground">The POS hit a runtime issue</h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted-strong)]">
              The current screen could not finish loading. Try the request again, and if the issue
              persists, check the live database setup in Vercel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="tara-button-primary touch-target inline-flex items-center justify-center gap-2 rounded-[22px] px-5 text-sm font-medium"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                Try again
              </button>
              <a
                href="/login"
                className="tara-button-secondary touch-target inline-flex items-center justify-center rounded-[22px] px-5 text-sm font-medium"
              >
                Back to sign-in
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
