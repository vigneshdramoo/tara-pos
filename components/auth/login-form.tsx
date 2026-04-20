"use client";

import type { Route } from "next";
import { useState, useTransition } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type LoginFormProps = {
  authConfigured: boolean;
  nextPath: Route;
};

export function LoginForm({ authConfigured, nextPath }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authConfigured) {
      setError("Set POS_ADMIN_PASSWORD and POS_SESSION_SECRET before taking the POS online.");
      return;
    }

    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      setError(payload?.message ?? "Sign-in failed.");
      return;
    }

    startTransition(() => {
      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="rounded-[28px] border border-white/60 bg-white/80 p-5 shadow-[0_30px_80px_rgba(34,25,18,0.08)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-950 text-stone-50">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-950">Staff sign-in</p>
            <p className="mt-1 text-sm text-stone-500">
              Private access for the TARA selling floor.
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-xs uppercase tracking-[0.28em] text-stone-500">
            Access password
          </span>
          <div className="mt-3 flex items-center gap-3 rounded-[22px] border border-stone-200 bg-stone-50/80 px-4">
            <LockKeyhole className="h-4 w-4 text-stone-400" strokeWidth={1.8} />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter staff password"
              className="touch-target w-full bg-transparent text-base text-stone-950 outline-none placeholder:text-stone-400"
              autoComplete="current-password"
              disabled={isPending || !authConfigured}
            />
          </div>
        </label>

        {error ? (
          <p className="mt-4 rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!authConfigured ? (
          <p className="mt-4 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            The app is protected, but the login environment variables are not set yet.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !authConfigured}
          className="touch-target mt-6 inline-flex w-full items-center justify-center rounded-[22px] bg-stone-950 px-5 text-base font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isPending ? "Signing in..." : "Enter POS"}
        </button>
      </div>
    </form>
  );
}
