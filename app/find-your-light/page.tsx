"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  RotateCcw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  ageRangeOptions,
  purchaseIntentOptions,
} from "@/lib/lead-options";
import { cn } from "@/lib/utils";

const SCENT_ORDER = ["aureya", "zephyr", "maris"] as const;

type ScentKey = (typeof SCENT_ORDER)[number];
type ScoreMap = Record<ScentKey, number>;

type ScentProfile = {
  slug: ScentKey;
  name: string;
  audience: string;
  identity: string;
  line: string;
  summary: string;
  character: string;
  notes: string[];
  mood: string[];
  price: string;
  accent: string;
  image: string;
  imageAlt: string;
};

type QuestionOption = {
  value: string;
  label: string;
  detail: string;
  weights: ScoreMap;
};

type Question = {
  id: string;
  eyebrow: string;
  prompt: string;
  options: QuestionOption[];
};

type RankedScent = {
  key: ScentKey;
  score: number;
};

type LeadCaptureState = {
  name: string;
  phone: string;
  email: string;
  ageRange: string;
  genderIdentity: string;
  city: string;
  eventName: string;
  purchaseIntent: string;
  marketingConsent: boolean;
  notes: string;
};

const SCENTS: Record<ScentKey, ScentProfile> = {
  aureya: {
    slug: "aureya",
    name: "Aureya",
    audience: "For Her",
    identity: "Radiant Identity",
    line: "Pear / Neroli / Jasmine / Amber",
    summary:
      "Aureya opens with pear brightness and sheer neroli, then softens into jasmine, white petals, amber, tonka, and skin musk.",
    character:
      "Warm, graceful, and quietly memorable. Aureya is soft power without needing to perform.",
    notes: ["Pear brightness", "Neroli light", "Jasmine bloom", "Golden amber"],
    mood: ["Radiant", "Graceful", "Warm"],
    price: "RM169 first 100 / RM239 regular",
    accent: "#E6A89A",
    image: "/products/aureya.png",
    imageAlt: "Aureya fragrance bottle with warm golden-pink liquid.",
  },
  zephyr: {
    slug: "zephyr",
    name: "Zephyr",
    audience: "For Him",
    identity: "Controlled Presence",
    line: "Citrus / Aldehyde / Cedar / Musk",
    summary:
      "Zephyr opens clean and bright with citrus, aldehydic air, hedione, cedarwood, ambroxan, dry moss, and polished musks.",
    character:
      "Clear, composed, and quietly magnetic. Zephyr feels tailored before a word is spoken.",
    notes: ["Sparkling citrus", "Brisk air", "Cedarwood aura", "Clean musks"],
    mood: ["Confident", "Clean", "Composed"],
    price: "RM169 first 100 / RM239 regular",
    accent: "#6E8FB5",
    image: "/products/zephyr.png",
    imageAlt: "Zephyr fragrance bottle with cool blue liquid.",
  },
  maris: {
    slug: "maris",
    name: "Maris",
    audience: "For Everyone",
    identity: "Intimate Signature",
    line: "Salt Air / Sage / Mineral Amber / Skin Musk",
    summary:
      "Maris opens with salt air, green sage, and cool bergamot before mineral amber, transparent woods, sandalwood, driftwood, and skin musk settle close.",
    character:
      "Fresh, calm, and intimate. Maris is not loud; it becomes more magnetic the closer someone gets.",
    notes: ["Salt air", "Green sage", "Mineral amber", "Skin musk"],
    mood: ["Quiet", "Intimate", "Addictive"],
    price: "RM169 first 100 / RM239 regular",
    accent: "#87957B",
    image: "/products/maris.png",
    imageAlt: "Maris fragrance bottle with soft green liquid.",
  },
};

const QUESTIONS: Question[] = [
  {
    id: "presence",
    eyebrow: "Presence",
    prompt: "What kind of trail should linger after you leave?",
    options: [
      {
        value: "golden",
        label: "Golden memory",
        detail: "Pear light, jasmine silk, amber, and skin musk that glow close.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "tailored",
        label: "Urban radiance",
        detail: "Sparkling citrus, brisk air, polished woods, and warm musk.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "mineral",
        label: "Salt signal",
        detail: "Salt air, green sage, mineral amber, and skin musk.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "entrance",
    eyebrow: "Entrance",
    prompt: "How do you want to enter a room?",
    options: [
      {
        value: "soft-arrival",
        label: "Soft arrival",
        detail: "Warm, graceful, and noticed slowly rather than announced.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "clean-command",
        label: "Clean command",
        detail: "Composed, sharp, and already in control before you speak.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "quiet-pull",
        label: "Quiet pull",
        detail: "Low-lit, close, and magnetic without asking for attention.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "texture",
    eyebrow: "Texture",
    prompt: "Which texture feels most like your skin today?",
    options: [
      {
        value: "warm-silk",
        label: "Warm silk",
        detail: "Light, glowing, and soft enough to hold memory.",
        weights: { aureya: 3, zephyr: 1, maris: 0 },
      },
      {
        value: "cool-glass",
        label: "Cool glass",
        detail: "Fresh, polished, bright, and impossible to blur.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "wet-stone",
        label: "Wet stone",
        detail: "Mineral, calm, clean, and still warm underneath.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "timing",
    eyebrow: "Timing",
    prompt: "When do you feel most magnetic?",
    options: [
      {
        value: "golden-morning",
        label: "Golden morning",
        detail: "First light, warm skin, soft florals, and quiet promise.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "city-dawn",
        label: "City dawn",
        detail: "Fresh light, clean lines, and a composed stride.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "after-rain",
        label: "After rain",
        detail: "Wet stone, warm skin, blue air, and a narrow beam of light.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "wardrobe",
    eyebrow: "Wardrobe",
    prompt: "Which silhouette feels closest to your body language?",
    options: [
      {
        value: "silk",
        label: "Silk at first light",
        detail: "Fluid, luminous, and quietly self-possessed.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "tailoring",
        label: "Glass-tower tailoring",
        detail: "Structured, modern, and bright with controlled confidence.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "linen",
        label: "White linen after dark",
        detail: "Clean, sensual, and composed after the weather changes.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "weather",
    eyebrow: "Weather",
    prompt: "Which weather would you bottle?",
    options: [
      {
        value: "sun-through-curtains",
        label: "Sun through curtains",
        detail: "Pear brightness, white petals, and golden warmth waking up.",
        weights: { aureya: 3, zephyr: 1, maris: 0 },
      },
      {
        value: "dry-urban-air",
        label: "Dry urban air",
        detail: "Citrus lift, clean metal, and bright space above the city.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "storm-clearing",
        label: "Storm clearing",
        detail: "Salt, sage, mineral air, and the hush after rain.",
        weights: { aureya: 0, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "closeness",
    eyebrow: "Closeness",
    prompt: "What should someone feel when they get closer?",
    options: [
      {
        value: "safe-glow",
        label: "A familiar glow",
        detail: "Warmth, grace, and quiet power that stays in memory.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "clean-magnetism",
        label: "Clean magnetism",
        detail: "Polish, clean distance, and warmth that draws people closer.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "skin-like-calm",
        label: "Skin-like calm",
        detail: "Clean skin, salt air, calm signal, and sensual restraint.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "memory",
    eyebrow: "Memory",
    prompt: "What kind of memory should the scent leave?",
    options: [
      {
        value: "golden-afterimage",
        label: "A golden afterimage",
        detail: "Someone remembers your softness before they remember your words.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "compliment-trail",
        label: "A compliment trail",
        detail: "Someone asks what you are wearing after you have already moved past.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "private-signal",
        label: "A private signal",
        detail: "Someone cannot explain it, only that they wanted to come closer.",
        weights: { aureya: 1, zephyr: 0, maris: 3 },
      },
    ],
  },
  {
    id: "ritual",
    eyebrow: "Ritual",
    prompt: "Where would you spray it first?",
    options: [
      {
        value: "collarbone",
        label: "Collarbone",
        detail: "Close to warmth, jewelry, silk, and the morning pulse.",
        weights: { aureya: 3, zephyr: 0, maris: 1 },
      },
      {
        value: "shirt-cuff",
        label: "Shirt cuff",
        detail: "Clean fabric, hand movement, and a quiet flash of control.",
        weights: { aureya: 0, zephyr: 3, maris: 1 },
      },
      {
        value: "nape",
        label: "Nape of the neck",
        detail: "Skin, air, proximity, and the place memory hides.",
        weights: { aureya: 1, zephyr: 1, maris: 3 },
      },
    ],
  },
  {
    id: "final-instinct",
    eyebrow: "Final Instinct",
    prompt: "Final instinct: what are you really choosing?",
    options: [
      {
        value: "radiance",
        label: "Radiance",
        detail: "To feel softer, warmer, and more impossible to forget.",
        weights: { aureya: 4, zephyr: 0, maris: 1 },
      },
      {
        value: "control",
        label: "Control",
        detail: "To feel clearer, sharper, and quietly untouchable.",
        weights: { aureya: 0, zephyr: 4, maris: 1 },
      },
      {
        value: "intimacy",
        label: "Intimacy",
        detail: "To feel close, calm, mineral, and privately magnetic.",
        weights: { aureya: 1, zephyr: 0, maris: 4 },
      },
    ],
  },
];

function createEmptyScores(): ScoreMap {
  return SCENT_ORDER.reduce(
    (scores, scent) => ({
      ...scores,
      [scent]: 0,
    }),
    {} as ScoreMap,
  );
}

function tallyScores(answers: Record<string, string>) {
  const scores = createEmptyScores();

  QUESTIONS.forEach((question) => {
    const option = question.options.find((candidate) => candidate.value === answers[question.id]);

    if (!option) {
      return;
    }

    SCENT_ORDER.forEach((scent) => {
      scores[scent] += option.weights[scent];
    });
  });

  return scores;
}

function rankScents(scores: ScoreMap): RankedScent[] {
  return SCENT_ORDER.map((key) => ({ key, score: scores[key] })).sort(
    (left, right) =>
      right.score - left.score || SCENT_ORDER.indexOf(left.key) - SCENT_ORDER.indexOf(right.key),
  );
}

function findAnsweredOption(question: Question, answers: Record<string, string>) {
  return question.options.find((option) => option.value === answers[question.id]);
}

function ActionButton({
  href,
  onClick,
  children,
  tone = "primary",
}: {
  href?: Route;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: "primary" | "secondary" | "ghost";
}) {
  const className = cn(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-300",
    tone === "primary" && "tara-button-primary",
    tone === "secondary" && "tara-button-inverse",
    tone === "ghost" &&
      "border border-white/12 bg-white/6 text-[rgba(247,243,235,0.88)] hover:border-white/20 hover:bg-white/10",
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function ScentSummaryCard({ scent }: { scent: ScentProfile }) {
  return (
    <article
      className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/6 p-5"
      style={{ boxShadow: `0 30px 90px ${scent.accent}1F` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${scent.accent}, transparent)` }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.28em]"
            style={{
              borderColor: `${scent.accent}66`,
              backgroundColor: `${scent.accent}18`,
              color: "rgba(247,243,235,0.88)",
            }}
          >
            {scent.audience}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[rgba(247,243,235,0.52)]">
            {scent.identity}
          </span>
        </div>
        <h3 className="mt-5 font-display text-4xl leading-none text-white">{scent.name}</h3>
        <p className="mt-4 text-sm leading-7 text-[rgba(247,243,235,0.72)]">{scent.character}</p>
      </div>
    </article>
  );
}

function QuizLeadCaptureCard({
  answers,
  scores,
  rankedScents,
  primaryScent,
}: {
  answers: Record<string, string>;
  scores: ScoreMap;
  rankedScents: RankedScent[];
  primaryScent: ScentProfile;
}) {
  const [form, setForm] = useState<LeadCaptureState>({
    name: "",
    phone: "",
    email: "",
    ageRange: "",
    genderIdentity: "",
    city: "",
    eventName: "",
    purchaseIntent: "JUST_EXPLORING",
    marketingConsent: false,
    notes: "",
  });
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const secondaryScent = rankedScents[1]?.key ?? "";

  function updateField<K extends keyof LeadCaptureState>(key: K, value: LeadCaptureState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSaveLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/quiz-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          source: "POPUP_BOOTH",
          resultScent: primaryScent.slug,
          secondaryScent,
          answers,
          scores,
        }),
      });
      const result = (await response.json()) as { message?: string; leadNumber?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Lead capture failed.");
      }

      setFeedback({
        type: "success",
        message: result.message ?? "Quiz lead saved.",
      });
      setForm((current) => ({
        ...current,
        name: "",
        phone: "",
        email: "",
        notes: "",
        marketingConsent: false,
      }));
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Lead capture failed.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSaveLead}
      className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.88)]">
            Save Visitor Signal
          </p>
          <h3 className="mt-4 font-display text-3xl text-white">Capture as a booth lead</h3>
          <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.68)]">
            This does not mark them as a buyer. It saves their quiz result, intent, consent, and
            optional demographic details for later audience building.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[rgba(247,243,235,0.52)]">
          {primaryScent.name}
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Name
            </span>
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
              placeholder="Optional"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Phone
            </span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
              placeholder="+60..."
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Email
            </span>
            <input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
              placeholder="Optional"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              City
            </span>
            <input
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
              placeholder="Kuala Lumpur"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Age Range
            </span>
            <select
              value={form.ageRange}
              onChange={(event) => updateField("ageRange", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#11151b] px-4 text-sm text-white outline-none transition focus:border-[rgba(202,158,91,0.62)]"
            >
              <option value="">Not asked</option>
              {ageRangeOptions.map((ageRange) => (
                <option key={ageRange} value={ageRange}>
                  {ageRange}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Identity / style
            </span>
            <input
              value={form.genderIdentity}
              onChange={(event) => updateField("genderIdentity", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
              placeholder="feminine, masculine, unisex..."
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Purchase intent
            </span>
            <select
              value={form.purchaseIntent}
              onChange={(event) => updateField("purchaseIntent", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#11151b] px-4 text-sm text-white outline-none transition focus:border-[rgba(202,158,91,0.62)]"
            >
              {purchaseIntentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
              Booth / event
            </span>
            <input
              value={form.eventName}
              onChange={(event) => updateField("eventName", event.target.value)}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/8 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
              placeholder="Weekend popup"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.9)]">
            Notes
          </span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            rows={3}
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-[rgba(247,243,235,0.38)] focus:border-[rgba(202,158,91,0.62)]"
            placeholder="What they liked, objection, gifting context..."
          />
        </label>

        <label className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/6 p-4 text-sm leading-6 text-[rgba(247,243,235,0.68)]">
          <input
            type="checkbox"
            checked={form.marketingConsent}
            onChange={(event) => updateField("marketingConsent", event.target.checked)}
            className="mt-1 h-4 w-4 accent-[#CA9E5B]"
          />
          Visitor agrees to receive TARA follow-ups by WhatsApp or email.
        </label>
      </div>

      {feedback ? (
        <div
          className={cn(
            "mt-5 rounded-[18px] px-4 py-3 text-sm leading-6",
            feedback.type === "success"
              ? "border border-emerald-300/20 bg-emerald-400/12 text-emerald-100"
              : "border border-red-300/20 bg-red-400/12 text-red-100",
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="tara-button-primary mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
        {isSaving ? "Saving lead..." : "Save Quiz Lead"}
      </button>
    </form>
  );
}

export default function FindYourLightPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const isComplete = hasStarted && step >= QUESTIONS.length;
  const currentQuestion = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];
  const submittedCount = Object.keys(answers).length;
  const progress = !hasStarted ? 0 : isComplete ? 100 : Math.round((submittedCount / QUESTIONS.length) * 100);
  const selectedAnswer = currentQuestion?.options.find((option) => option.value === selectedOption);

  const scores = useMemo(() => tallyScores(answers), [answers]);
  const rankedScents = useMemo(() => rankScents(scores), [scores]);
  const primaryMatch = rankedScents[0];
  const primaryScent = SCENTS[primaryMatch.key];
  const pageGlow = isComplete ? primaryScent.accent : "#CA9E5B";

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function animateTransition(action: () => void) {
    setIsVisible(false);
    setIsTransitioning(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      action();
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.requestAnimationFrame(() => {
        setIsVisible(true);
        setIsTransitioning(false);
      });
    }, 220);
  }

  function handleBegin() {
    if (isTransitioning) {
      return;
    }

    animateTransition(() => {
      setHasStarted(true);
      setStep(0);
      setSelectedOption(answers[QUESTIONS[0]?.id] ?? "");
    });
  }

  function handleSubmitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentQuestion || !selectedOption || isTransitioning) {
      return;
    }

    const nextAnswers = {
      ...answers,
      [currentQuestion.id]: selectedOption,
    };
    const nextStep = step + 1;

    animateTransition(() => {
      setAnswers(nextAnswers);
      setStep(nextStep);
      setSelectedOption(QUESTIONS[nextStep] ? nextAnswers[QUESTIONS[nextStep].id] ?? "" : "");
    });
  }

  function handleBack() {
    if (isTransitioning) {
      return;
    }

    if (!hasStarted) {
      return;
    }

    if (step === 0) {
      animateTransition(() => {
        setHasStarted(false);
        setSelectedOption("");
      });
      return;
    }

    const previousStep = Math.max(0, step - 1);
    const previousQuestion = QUESTIONS[previousStep];

    animateTransition(() => {
      setStep(previousStep);
      setSelectedOption(previousQuestion ? answers[previousQuestion.id] ?? "" : "");
    });
  }

  function handleRetake() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    animateTransition(() => {
      setHasStarted(false);
      setStep(0);
      setAnswers({});
      setSelectedOption("");
    });
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] text-[var(--brand-ivory)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,158,91,0.2),transparent_30%),radial-gradient(circle_at_top_right,rgba(75,48,106,0.2),transparent_26%),linear-gradient(180deg,#050608_0%,#0c1016_45%,#121821_100%)]" />
      <div
        className="absolute -left-28 top-16 h-72 w-72 rounded-full blur-[120px]"
        style={{ backgroundColor: "#4B306A", opacity: 0.18 }}
      />
      <div
        className="absolute right-0 top-24 h-80 w-80 rounded-full blur-[140px]"
        style={{ backgroundColor: pageGlow, opacity: 0.24 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-white/10 pb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.34em] text-[rgba(247,243,235,0.56)] transition hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.9} />
                Back To POS
              </Link>
              <p className="mt-5 text-xs uppercase tracking-[0.42em] text-[rgba(202,158,91,0.9)]">
                TARA Scent Ritual
              </p>
              <h1 className="mt-4 max-w-4xl font-display text-5xl leading-none text-white sm:text-7xl">
                Find your scent identity in ten questions.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[rgba(247,243,235,0.72)] sm:text-base">
                One question appears at a time. Submit the current answer to unlock the next, then
                match the guest to Aureya, Zephyr, or Maris with a clear POS handoff.
              </p>
            </div>

            <div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.48)]">
                    Progress
                  </p>
                  <p className="mt-2 text-sm text-[rgba(247,243,235,0.82)]">
                    {!hasStarted
                      ? "Before you begin"
                      : isComplete
                        ? "Result revealed"
                        : `${submittedCount} of ${QUESTIONS.length} submitted`}
                  </p>
                </div>
                <p className="text-sm font-medium text-[rgba(247,243,235,0.72)]">{progress}%</p>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#CA9E5B_0%,#C88E4D_50%,#F1DBB2_100%)] transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {!hasStarted ? (
          <section
            className={cn(
              "grid flex-1 gap-8 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[0.9fr_1.1fr] lg:items-start",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            <div className="space-y-6">
              <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.48)]">
                  Scent Reading
                </p>
                <h2 className="mt-4 font-display text-4xl text-white sm:text-5xl">
                  Designed for the iPad counter.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                  The guest makes one instinctive choice at a time. Staff can use the result as a
                  guided discovery moment before moving to POS checkout.
                </p>
              </div>

              <div className="grid gap-4">
                {SCENT_ORDER.map((key) => (
                  <ScentSummaryCard key={key} scent={SCENTS[key]} />
                ))}
              </div>
            </div>

            <div className="rounded-[36px] border border-white/10 bg-white/6 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(255,255,255,0.05)]">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/products/aureya.png"
                    alt="Aureya bottle for TARA scent quiz introduction."
                    fill
                    priority
                    className="object-cover opacity-80"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.88),rgba(5,6,8,0.22)),linear-gradient(180deg,transparent,rgba(5,6,8,0.7))]" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.92)]">
                      Ten Prompts
                    </p>
                    <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-white sm:text-5xl">
                      A private scent ritual, built to keep the guest curious.
                    </h2>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                      No wrong answers. Only different temperatures: radiance, control, and
                      intimacy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(247,243,235,0.44)]">
                    Start Requirement
                  </p>
                  <p className="mt-2 text-sm text-[rgba(247,243,235,0.72)]">
                    Tap begin, answer one prompt, then submit to reveal the next.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBegin}
                  disabled={isTransitioning}
                  className="tara-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                  Begin Quiz
                </button>
              </div>
            </div>
          </section>
        ) : !isComplete ? (
          <section
            className={cn(
              "grid flex-1 gap-8 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[0.74fr_1.26fr] lg:items-start",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            <aside className="space-y-6">
              <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.48)]">
                  Current Signal
                </p>
                <h2 className="mt-4 font-display text-4xl text-white sm:text-5xl">
                  {selectedAnswer?.label ?? "Unchosen"}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                  {selectedAnswer?.detail ??
                    "Select an answer first. The next prompt stays hidden until this answer is submitted."}
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur-2xl">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.88)]">
                  Answer Map
                </p>
                <div className="mt-5 grid gap-3">
                  {QUESTIONS.map((question, index) => {
                    const answeredOption = findAnsweredOption(question, answers);
                    const isCurrent = index === step;

                    return (
                      <div
                        key={question.id}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-full border px-4 py-3 text-xs uppercase tracking-[0.18em]",
                          answeredOption
                            ? "border-[rgba(202,158,91,0.24)] bg-[rgba(202,158,91,0.1)] text-[rgba(247,243,235,0.82)]"
                            : isCurrent
                              ? "border-white/18 bg-white/8 text-white"
                              : "border-white/10 bg-white/4 text-[rgba(247,243,235,0.38)]",
                        )}
                      >
                        <span>Prompt {index + 1}</span>
                        <span>{answeredOption ? "Submitted" : isCurrent ? "Open" : "Locked"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            <form
              onSubmit={handleSubmitAnswer}
              className="rounded-[36px] border border-white/10 bg-white/6 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.36em] text-[rgba(202,158,91,0.9)]">
                    {currentQuestion.eyebrow}
                  </p>
                  <h2 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-white sm:text-6xl">
                    {currentQuestion.prompt}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(247,243,235,0.66)]">
                    Choose the answer your body recognizes first. Then submit to unlock the next
                    question.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[rgba(247,243,235,0.54)]">
                  {step + 1}/{QUESTIONS.length}
                </span>
              </div>

              <div className="mt-8 grid gap-4">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedOption(option.value)}
                      aria-pressed={isSelected}
                      disabled={isTransitioning}
                      className={cn(
                        "group relative overflow-hidden rounded-[28px] border px-5 py-6 text-left transition-all duration-300 ease-out",
                        isSelected
                          ? "border-[rgba(202,158,91,0.66)] bg-[linear-gradient(180deg,rgba(202,158,91,0.18),rgba(255,255,255,0.06))] shadow-[0_22px_50px_rgba(202,158,91,0.16)]"
                          : "border-white/10 bg-white/4 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/8",
                        isTransitioning && "pointer-events-none opacity-70",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xl font-medium text-white">{option.label}</p>
                          <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                            {option.detail}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                            isSelected
                              ? "border-[rgba(202,158,91,0.78)] bg-[rgba(202,158,91,0.22)] text-white"
                              : "border-white/12 bg-white/6 text-[rgba(247,243,235,0.38)] group-hover:border-white/20 group-hover:text-[rgba(247,243,235,0.68)]",
                          )}
                        >
                          <Check className="h-4 w-4" strokeWidth={2} />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-sm font-semibold text-[rgba(247,243,235,0.88)] transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                  {step === 0 ? "Intro" : "Previous"}
                </button>
                <button
                  type="submit"
                  disabled={!selectedOption || isTransitioning}
                  className="tara-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {step === QUESTIONS.length - 1 ? "Reveal Scent" : "Submit Answer"}
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section
            className={cn(
              "flex-1 space-y-8 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
            aria-live="polite"
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
              <article
                className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 lg:p-10"
                style={{ boxShadow: `0 42px 120px ${primaryScent.accent}2A` }}
              >
                <div
                  className="absolute -right-12 top-0 h-48 w-48 rounded-full blur-[90px]"
                  style={{ backgroundColor: primaryScent.accent, opacity: 0.26 }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${primaryScent.accent}, transparent)`,
                  }}
                />

                <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/6">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={primaryScent.image}
                        alt={primaryScent.imageAlt}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 40vw"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(5,6,8,0.56))]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-[rgba(202,158,91,0.42)] bg-[rgba(202,158,91,0.14)] px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.86)]">
                        Best Match
                      </span>
                      <span className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.54)]">
                        {primaryScent.audience}
                      </span>
                    </div>

                    <h2 className="mt-6 font-display text-6xl leading-none text-white sm:text-7xl">
                      {primaryScent.name}
                    </h2>
                    <p className="mt-4 text-xl text-[rgba(247,243,235,0.82)] sm:text-2xl">
                      {primaryScent.identity}
                    </p>
                    <p className="mt-4 text-xs uppercase tracking-[0.28em] text-[rgba(247,243,235,0.52)]">
                      {primaryScent.line}
                    </p>
                    <p className="mt-6 text-base leading-8 text-[rgba(247,243,235,0.76)]">
                      {primaryScent.summary}
                    </p>
                    <p className="mt-5 text-sm leading-7 text-[rgba(247,243,235,0.64)]">
                      {primaryScent.character}
                    </p>

                    <div className="mt-7 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                        <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(202,158,91,0.88)]">
                          Notes
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.8)]">
                          {primaryScent.notes.join(" / ")}
                        </p>
                      </div>
                      <div className="rounded-[24px] border border-white/10 bg-white/6 p-5">
                        <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(202,158,91,0.88)]">
                          Launch Offer
                        </p>
                        <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.8)]">
                          {primaryScent.price}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <ActionButton href="/pos">
                        <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
                        Open POS Checkout
                      </ActionButton>
                      <ActionButton href="/pos" tone="secondary">
                        <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                        Add Discovery Conversation
                      </ActionButton>
                      <ActionButton onClick={handleRetake} tone="ghost">
                        <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                        Retake Quiz
                      </ActionButton>
                    </div>
                  </div>
                </div>
              </article>

              <aside className="space-y-6">
                <QuizLeadCaptureCard
                  answers={answers}
                  scores={scores}
                  rankedScents={rankedScents}
                  primaryScent={primaryScent}
                />

                <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl">
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.88)]">
                    Also Suits Them
                  </p>
                  <h3 className="mt-4 font-display text-3xl text-white">Nearby scent moods</h3>
                  <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.68)]">
                    Use these as blotter follow-ups if the guest wants to compare before buying.
                  </p>
                </div>

                {rankedScents.slice(1).map((match, index) => {
                  const scent = SCENTS[match.key];

                  return (
                    <article
                      key={scent.slug}
                      className="rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur-2xl"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-[rgba(202,158,91,0.88)]">
                          Alternative {index + 1}
                        </p>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[rgba(247,243,235,0.52)]">
                          {scent.audience}
                        </span>
                      </div>
                      <h4 className="mt-4 font-display text-4xl leading-none text-white">
                        {scent.name}
                      </h4>
                      <p className="mt-3 text-sm uppercase tracking-[0.24em] text-[rgba(247,243,235,0.5)]">
                        {scent.identity}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                        {scent.character}
                      </p>
                    </article>
                  );
                })}
              </aside>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
