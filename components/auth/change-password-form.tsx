"use client";

import { useState, useTransition } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-policy";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !nextPassword || !confirmPassword) {
      setError("Fill in all password fields before saving.");
      setSuccess(null);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError("The new password confirmation does not match.");
      setSuccess(null);
      return;
    }

    if (currentPassword === nextPassword) {
      setError("Choose a new password that is different from the current one.");
      setSuccess(null);
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          nextPassword,
          confirmPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(payload?.message ?? "Password update failed.");
        return;
      }

      setCurrentPassword("");
      setNextPassword("");
      setConfirmPassword("");
      setSuccess("Password updated. Use the new password the next time you sign in.");
    });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="rounded-[28px] border border-[var(--line)] bg-white/75 p-5 shadow-[0_24px_70px_rgba(18,22,34,0.06)]">
        <div className="flex items-center gap-3">
          <div className="tara-panel-dark flex h-12 w-12 items-center justify-center rounded-2xl">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Reset your own password</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Update the boutique default after first sign-in and rotate it whenever needed.
            </p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
            Current password
          </span>
          <div className="tara-input mt-3 flex items-center gap-3 rounded-[22px] px-4">
            <KeyRound className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Enter current password"
              className="touch-target w-full bg-transparent text-base text-foreground outline-none placeholder:text-[var(--muted)]"
              autoComplete="current-password"
              disabled={isPending}
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
            New password
          </span>
          <div className="tara-input mt-3 flex items-center gap-3 rounded-[22px] px-4">
            <KeyRound className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
            <input
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              placeholder={`Use at least ${MIN_PASSWORD_LENGTH} characters`}
              className="touch-target w-full bg-transparent text-base text-foreground outline-none placeholder:text-[var(--muted)]"
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.28em] text-[var(--brand-gold)]">
            Confirm new password
          </span>
          <div className="tara-input mt-3 flex items-center gap-3 rounded-[22px] px-4">
            <KeyRound className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Retype the new password"
              className="touch-target w-full bg-transparent text-base text-foreground outline-none placeholder:text-[var(--muted)]"
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>
        </label>

        {error ? (
          <p className="tara-alert-danger mt-4 rounded-[18px] px-4 py-3 text-sm">{error}</p>
        ) : null}

        {success ? (
          <p className="tara-alert-success mt-4 rounded-[18px] px-4 py-3 text-sm">{success}</p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="tara-button-primary touch-target mt-6 inline-flex w-full items-center justify-center rounded-[22px] px-5 text-base font-medium transition disabled:cursor-not-allowed"
        >
          {isPending ? "Updating password..." : "Save new password"}
        </button>
      </div>
    </form>
  );
}
