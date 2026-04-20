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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(215,174,104,0.16),_transparent_42%),linear-gradient(180deg,_#f8f2ea_0%,_#f4ede4_46%,_#efe6db_100%)]" />
      <section className="relative z-10 w-full max-w-2xl rounded-[36px] border border-white/70 bg-white/70 p-6 shadow-[0_40px_120px_rgba(34,25,18,0.12)] backdrop-blur md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertTriangle className="h-6 w-6" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.34em] text-stone-500">TARA</p>
            <h1 className="mt-3 font-display text-4xl text-stone-950">The POS hit a runtime issue</h1>
            <p className="mt-4 text-base leading-7 text-stone-700">
              The current screen could not finish loading. Try the request again, and if the issue
              persists, check the live database setup in Vercel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="touch-target inline-flex items-center justify-center gap-2 rounded-[22px] bg-stone-950 px-5 text-sm font-medium text-stone-50"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                Try again
              </button>
              <a
                href="/login"
                className="touch-target inline-flex items-center justify-center rounded-[22px] border border-stone-200 bg-white/80 px-5 text-sm font-medium text-stone-700"
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
