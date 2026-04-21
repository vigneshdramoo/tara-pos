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
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authConfigured) {
      setError("Set DATABASE_URL, POS_SESSION_SECRET, and seed the staff accounts before sign-in.");
      return;
    }

    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier, password }),
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
      <div className="rounded-[28px] border border-[var(--line-strong)] bg-[rgba(255,251,246,0.84)] p-5 shadow-[0_30px_80px_rgba(18,22,34,0.08)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Staff sign-in</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Private access for the TARA selling floor.
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
            Username or email
          </span>
          <div className="tara-input mt-3 flex items-center gap-3 rounded-[22px] px-4">
            <ShieldCheck className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="daniel or shireen"
              className="touch-target w-full bg-transparent text-base text-foreground outline-none placeholder:text-[var(--muted)]"
              autoComplete="username"
              disabled={isPending || !authConfigured}
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
            Password
          </span>
          <div className="tara-input mt-3 flex items-center gap-3 rounded-[22px] px-4">
            <LockKeyhole className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter account password"
              className="touch-target w-full bg-transparent text-base text-foreground outline-none placeholder:text-[var(--muted)]"
              autoComplete="current-password"
              disabled={isPending || !authConfigured}
            />
          </div>
        </label>

        {error ? (
          <p className="tara-alert-danger mt-4 rounded-[18px] px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        {!authConfigured ? (
          <p className="tara-alert-warning mt-4 rounded-[18px] px-4 py-3 text-sm">
            Staff sign-in needs the database, session secret, and seeded staff accounts.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending || !authConfigured}
          className="tara-button-primary touch-target mt-6 inline-flex w-full items-center justify-center rounded-[22px] px-5 text-base font-medium transition disabled:cursor-not-allowed"
        >
          {isPending ? "Signing in..." : "Enter POS"}
        </button>
      </div>
    </form>
  );
}
