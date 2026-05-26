"use client";

import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { Download, Search, Sparkles, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ageRangeOptions,
  getLeadSourceLabel,
  getPurchaseIntentLabel,
  getScentMatchLabel,
  leadSourceOptions,
  purchaseIntentOptions,
  scentMatchOptions,
} from "@/lib/lead-options";
import type { QuizLeadInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

type LeadFormState = {
  name: string;
  email: string;
  phone: string;
  ageRange: string;
  genderIdentity: string;
  city: string;
  eventName: string;
  source: string;
  resultScent: string;
  secondaryScent: string;
  purchaseIntent: string;
  marketingConsent: boolean;
  notes: string;
};

const initialLeadForm: LeadFormState = {
  name: "",
  email: "",
  phone: "",
  ageRange: "",
  genderIdentity: "",
  city: "",
  eventName: "",
  source: "POPUP_BOOTH",
  resultScent: "aureya",
  secondaryScent: "",
  purchaseIntent: "JUST_EXPLORING",
  marketingConsent: false,
  notes: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function LeadField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-gold)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function BoothLeadsWorkspace({ leads }: { leads: QuizLeadInsight[] }) {
  const router = useRouter();
  const [form, setForm] = useState(initialLeadForm);
  const [query, setQuery] = useState("");
  const [scentFilter, setScentFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, startRefreshTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return leads.filter((lead) => {
      const haystack = [
        lead.leadNumber,
        lead.name,
        lead.email,
        lead.phone,
        lead.ageRange,
        lead.genderIdentity,
        lead.city,
        lead.eventName,
        getScentMatchLabel(lead.resultScent),
        getPurchaseIntentLabel(lead.purchaseIntent),
        lead.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesScent = scentFilter === "all" || lead.resultScent === scentFilter;
      const matchesIntent = intentFilter === "all" || lead.purchaseIntent === intentFilter;
      return matchesQuery && matchesScent && matchesIntent;
    });
  }, [deferredQuery, intentFilter, leads, scentFilter]);

  const consentedCount = leads.filter((lead) => lead.marketingConsent).length;
  const highIntentCount = leads.filter((lead) =>
    ["BUY_TODAY", "BUY_LATER", "DISCOVERY_PACK"].includes(lead.purchaseIntent),
  ).length;
  const topScent = scentMatchOptions
    .map((option) => ({
      label: option.label,
      count: leads.filter((lead) => lead.resultScent === option.value).length,
    }))
    .sort((left, right) => right.count - left.count)[0];

  function updateForm<K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/quiz-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Lead capture failed.");
      }

      setFeedback({
        type: "success",
        message: result.message ?? "Lead saved.",
      });
      setForm({
        ...initialLeadForm,
        eventName: form.eventName,
        city: form.city,
      });
      startRefreshTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Lead capture failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_440px]">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Quiz leads", value: leads.length, detail: "Booth visitors captured" },
            {
              label: "Follow-up consent",
              value: consentedCount,
              detail: "Eligible for WhatsApp/email nurturing",
            },
            {
              label: "High-intent leads",
              value: highIntentCount,
              detail: topScent?.count ? `${topScent.label} leads most often` : "No scent trend yet",
            },
          ].map((stat) => (
            <article key={stat.label} className="tara-surface p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
                {stat.label}
              </p>
              <p className="mt-4 text-4xl font-semibold text-foreground">{stat.value}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{stat.detail}</p>
            </article>
          ))}
        </div>

        <div className="tara-surface flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, city, scent, intent, phone..."
              className="tara-input touch-target w-full rounded-2xl pl-12 pr-4 outline-none"
            />
          </div>
          <select
            value={scentFilter}
            onChange={(event) => setScentFilter(event.target.value)}
            className="tara-input touch-target rounded-2xl px-4 outline-none"
          >
            <option value="all">All scents</option>
            {scentMatchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={intentFilter}
            onChange={(event) => setIntentFilter(event.target.value)}
            className="tara-input touch-target rounded-2xl px-4 outline-none"
          >
            <option value="all">All intent</option>
            {purchaseIntentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <a
            href="/api/quiz-leads/export"
            className="tara-button-secondary touch-target inline-flex items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold"
          >
            <Download className="h-4 w-4" strokeWidth={1.8} />
            Export CSV
          </a>
        </div>

        <div className="grid gap-3">
          {filteredLeads.length ? (
            filteredLeads.map((lead) => (
              <article key={lead.id} className="tara-surface p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tara-chip-default rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                        {getScentMatchLabel(lead.resultScent)}
                      </span>
                      <span className="tara-chip-default rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                        {getPurchaseIntentLabel(lead.purchaseIntent)}
                      </span>
                      {lead.marketingConsent ? (
                        <span className="tara-alert-success rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                          Consent
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-foreground">
                      {lead.name || "Unnamed booth visitor"}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      {lead.leadNumber} · {formatDate(lead.createdAt)}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                      {[lead.phone, lead.email, lead.city, lead.ageRange, lead.genderIdentity]
                        .filter(Boolean)
                        .join(" · ") || "No contact or demographic details captured yet."}
                    </p>
                    {lead.notes ? (
                      <p className="mt-3 rounded-2xl bg-white/60 px-4 py-3 text-sm leading-7 text-stone-700">
                        {lead.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="min-w-[190px] rounded-[22px] border border-[var(--line)] bg-white/70 p-4 text-sm leading-7 text-[var(--muted)]">
                    <p>
                      <span className="font-semibold text-foreground">Source:</span>{" "}
                      {getLeadSourceLabel(lead.source)}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Event:</span>{" "}
                      {lead.eventName || "Popup booth"}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">Buyer match:</span>{" "}
                      {lead.convertedCustomerName ?? "Not linked"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="tara-surface px-6 py-12 text-center">
              <Sparkles className="mx-auto h-9 w-9 text-[var(--brand-gold)]" strokeWidth={1.6} />
              <h3 className="mt-4 text-2xl font-semibold text-foreground">No leads match yet</h3>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                Capture the first booth visitor or loosen the current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tara-surface sticky top-4 self-start p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(202,158,91,0.14)] text-[var(--brand-gold)]">
            <UserPlus className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--brand-gold)]">
              Booth Capture
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">Save a visitor</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Use this for walk-up conversations, manual quiz capture, and non-buyers.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <LeadField label="Name / nickname">
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className="tara-input touch-target rounded-2xl px-4 outline-none"
              placeholder="Optional"
            />
          </LeadField>

          <div className="grid gap-4 md:grid-cols-2">
            <LeadField label="Phone">
              <input
                value={form.phone}
                onChange={(event) => updateForm("phone", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
                placeholder="+60..."
              />
            </LeadField>
            <LeadField label="Email">
              <input
                value={form.email}
                onChange={(event) => updateForm("email", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
                placeholder="Optional"
              />
            </LeadField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LeadField label="Age range">
              <select
                value={form.ageRange}
                onChange={(event) => updateForm("ageRange", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
              >
                <option value="">Not asked</option>
                {ageRangeOptions.map((ageRange) => (
                  <option key={ageRange} value={ageRange}>
                    {ageRange}
                  </option>
                ))}
              </select>
            </LeadField>
            <LeadField label="Identity">
              <input
                value={form.genderIdentity}
                onChange={(event) => updateForm("genderIdentity", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
                placeholder="e.g. feminine, masculine, unisex"
              />
            </LeadField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LeadField label="City">
              <input
                value={form.city}
                onChange={(event) => updateForm("city", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
                placeholder="Kuala Lumpur"
              />
            </LeadField>
            <LeadField label="Event">
              <input
                value={form.eventName}
                onChange={(event) => updateForm("eventName", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
                placeholder="Weekend popup"
              />
            </LeadField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LeadField label="Result scent">
              <select
                value={form.resultScent}
                onChange={(event) => updateForm("resultScent", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
              >
                {scentMatchOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadField>
            <LeadField label="Purchase intent">
              <select
                value={form.purchaseIntent}
                onChange={(event) => updateForm("purchaseIntent", event.target.value)}
                className="tara-input touch-target rounded-2xl px-4 outline-none"
              >
                {purchaseIntentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </LeadField>
          </div>

          <LeadField label="Source">
            <select
              value={form.source}
              onChange={(event) => updateForm("source", event.target.value)}
              className="tara-input touch-target rounded-2xl px-4 outline-none"
            >
              {leadSourceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </LeadField>

          <LeadField label="Notes">
            <textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              rows={3}
              className="tara-input rounded-2xl px-4 py-3 outline-none"
              placeholder="What they liked, objections, gift context..."
            />
          </LeadField>

          <label className="flex items-start gap-3 rounded-[22px] border border-[var(--line)] bg-white/70 p-4 text-sm leading-6 text-[var(--muted)]">
            <input
              type="checkbox"
              checked={form.marketingConsent}
              onChange={(event) => updateForm("marketingConsent", event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--brand-gold)]"
            />
            <span>
              Visitor agrees to receive TARA follow-ups by WhatsApp or email. Keep this off when
              they only want the booth experience.
            </span>
          </label>
        </div>

        {feedback ? (
          <div
            className={cn(
              "mt-5 rounded-[18px] px-4 py-3 text-sm leading-6",
              feedback.type === "success" ? "tara-alert-success" : "tara-alert-danger",
            )}
          >
            {feedback.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting || refreshing}
          className="tara-button-primary touch-target mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="h-4 w-4" strokeWidth={1.8} />
          {submitting ? "Saving lead..." : refreshing ? "Refreshing CRM..." : "Save Booth Lead"}
        </button>
      </form>
    </section>
  );
}
