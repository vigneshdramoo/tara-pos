"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  RotateCcw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SCENT_ORDER = [
  "AURORA",
  "SIREN",
  "NOVA",
  "EMBER",
  "ZEPHYR",
  "ZENITH",
  "ARDOR",
  "SOL",
] as const;

type ScentKey = (typeof SCENT_ORDER)[number];
type ScentFamily = "feminine" | "masculine";
type QuizGender = "feminine" | "masculine" | "open";
type ScoreMap = Record<ScentKey, number>;

type ScentProfile = {
  name: string;
  family: ScentFamily;
  collection: "Hera" | "Zeus";
  identityTitle: string;
  mood: string;
  olfactiveProfile: string;
  experience: string;
  character: string;
  signatureLine: string;
  accent: string;
  productUrl: string | null;
};

type QuestionOption = {
  label: string;
  caption: string;
  scores: Partial<ScoreMap>;
};

type Question = {
  eyebrow: string;
  prompt: string;
  guidance: string;
  options: QuestionOption[];
};

type RankedScent = {
  key: ScentKey;
  score: number;
};

type QuizProfile = {
  gender: QuizGender | null;
  email: string;
  mobile: string;
};

const SCENT_PRIORITY = SCENT_ORDER.reduce(
  (priority, key, index) => {
    priority[key] = index;
    return priority;
  },
  {} as Record<ScentKey, number>,
);

const SCENTS: Record<ScentKey, ScentProfile> = {
  AURORA: {
    name: "Aurora",
    family: "feminine",
    collection: "Hera",
    identityTitle: "The Luminous Muse",
    mood: "Radiant, Intimate, Unforgettable",
    olfactiveProfile: "Pear, Jasmine, Rose, Neroli, White Musk, Amber, Tonka",
    experience:
      "A luminous floral-musky composition that opens with a delicate glow of pear and soft freshness, unfolding into a graceful heart of jasmine, rose, and neroli before settling into clean white musk and amber warmth.",
    character: "Soft-spoken magnetism with a bright, golden center.",
    signatureLine: "She arrives like first light and lingers like memory.",
    accent: "#CA9E5B",
    productUrl: null,
  },
  SIREN: {
    name: "Siren",
    family: "feminine",
    collection: "Hera",
    identityTitle: "The Velvet Temptress",
    mood: "Magnetic, Luxurious, Dangerous",
    olfactiveProfile:
      "Dark Florals, Creamy White Flowers, Velvet Amber, Soft Spice, Patchouli Shadow, Warm Musk",
    experience:
      "A dark floral-amber composition with seductive depth and elegant tension, revealing velvety florals, creamy facets, and a sensual base that feels opulent, mysterious, and distinctly feminine.",
    character: "Seductive poise sharpened by shadow and restraint.",
    signatureLine: "Opulence, but with teeth.",
    accent: "#4B306A",
    productUrl: null,
  },
  NOVA: {
    name: "Nova",
    family: "feminine",
    collection: "Hera",
    identityTitle: "The Modern Icon",
    mood: "Radiant, Poised, Distinctive",
    olfactiveProfile:
      "Luminous Florals, Aldehydic Sparkle, Jasmine Glow, Soft Rose, Powdered Grace, Clean Musk",
    experience:
      "A refined floral-aldehydic composition with brightness, elegance, and a polished feminine aura, opening with luminous freshness before resting on a soft, graceful trail that feels classic yet modern.",
    character: "Elegant precision with unmistakable presence.",
    signatureLine: "Bright, polished, and impossible to misplace.",
    accent: "#E0BC7F",
    productUrl: null,
  },
  EMBER: {
    name: "Ember",
    family: "feminine",
    collection: "Hera",
    identityTitle: "The Golden Romantic",
    mood: "Warm, Sensual, Comforting",
    olfactiveProfile:
      "Sweet Bloom, Floral Warmth, Soft Fruit Glow, Vanilla Haze, Amber, Gentle Musk",
    experience:
      "A luminous gourmand-floral composition that opens with sweetness and sparkle, softens into a lush floral heart, and settles into a warm, enveloping trail that feels romantic, familiar, and deeply inviting.",
    character: "Tender warmth that turns familiarity into desire.",
    signatureLine: "Comfort, lit from within.",
    accent: "#C88E4D",
    productUrl: null,
  },
  ZEPHYR: {
    name: "Zephyr",
    family: "masculine",
    collection: "Zeus",
    identityTitle: "The Effortless Charmer",
    mood: "Airy, Confident, Effortless",
    olfactiveProfile:
      "Citrus Freshness, Pineapple Accent, Aromatic Woods, Lavender Nuance, Clean Musk, Amberwood",
    experience:
      "A bright aromatic-woody composition with crisp freshness and luminous citrus, sharpened by a subtle fruited lift before it settles into smooth woods, aromatic facets, and a polished clean trail.",
    character: "Fresh confidence worn with quiet ease.",
    signatureLine: "Clean, bright, and never forced.",
    accent: "#1A334A",
    productUrl: null,
  },
  ZENITH: {
    name: "Zenith",
    family: "masculine",
    collection: "Zeus",
    identityTitle: "The Commanding Force",
    mood: "Powerful, Clean, Commanding",
    olfactiveProfile:
      "Crisp Freshness, Bright Citrus Lift, Aromatic Edge, Dry Woods, Amber, Radiant Musk",
    experience:
      "A fresh woody-amber composition with sharp clarity and modern force, opening with crisp brightness and energetic lift before settling into a dry, radiating base that feels assertive, polished, and unmistakably present.",
    character: "Modern authority with immaculate edges.",
    signatureLine: "Presence without excess.",
    accent: "#42586D",
    productUrl: null,
  },
  ARDOR: {
    name: "Ardor",
    family: "masculine",
    collection: "Zeus",
    identityTitle: "The Smouldering Rebel",
    mood: "Smouldering, Bold, Addictive",
    olfactiveProfile:
      "Hot Spice, Dark Sweetness, Aromatic Heart, Amber, Woods, Tonka Warmth",
    experience:
      "A warm spicy-amber composition built around heat, contrast, and tension, opening with vivid spice and dark sweetness before settling into an intense trail of ambered woods and sensual warmth.",
    character: "Heat, tension, and dark charisma held in control.",
    signatureLine: "A slow burn that never asks permission.",
    accent: "#A86B37",
    productUrl: null,
  },
  SOL: {
    name: "Sol",
    family: "masculine",
    collection: "Zeus",
    identityTitle: "The Refined Intimate",
    mood: "Warm, Intimate, Refined",
    olfactiveProfile:
      "Cardamom Glow, Aromatic Warmth, Polished Woods, Soft Spice, Tonka Hush, Musk",
    experience:
      "A smooth woody-spiced composition with subtle sensuality and controlled depth, opening with softened spice and aromatic warmth before unfolding into polished woods and a close, inviting base.",
    character: "Quiet fire in perfectly tailored form.",
    signatureLine: "Intimacy with impeccable restraint.",
    accent: "#CA9E5B",
    productUrl: null,
  },
};

const DISCOVERY_SET_URL: string | null = null;

const QUESTIONS: Question[] = [
  {
    eyebrow: "Atmosphere",
    prompt: "The energy you leave behind should feel...",
    guidance: "Choose the atmosphere that feels closest to your natural pull.",
    options: [
      {
        label: "Luminous",
        caption: "Soft radiance with a clean golden afterglow.",
        scores: { AURORA: 3, NOVA: 2, SOL: 1 },
      },
      {
        label: "Magnetic",
        caption: "Velvet tension, depth, and unmistakable allure.",
        scores: { SIREN: 3, ARDOR: 1, EMBER: 1 },
      },
      {
        label: "Warm",
        caption: "Close, enveloping, and softly addictive.",
        scores: { EMBER: 3, SOL: 2, AURORA: 1 },
      },
      {
        label: "Commanding",
        caption: "Crisp, polished, and impossible to ignore.",
        scores: { ZENITH: 3, ZEPHYR: 2, ARDOR: 1 },
      },
    ],
  },
  {
    eyebrow: "Opening",
    prompt: "Which opening draws you in first?",
    guidance: "Start with the note family you instinctively reach for.",
    options: [
      {
        label: "Pearlit florals",
        caption: "Airy fruit, jasmine, neroli, and glow.",
        scores: { AURORA: 3, NOVA: 1 },
      },
      {
        label: "Dark petals",
        caption: "White florals deepened with amber and shadow.",
        scores: { SIREN: 3, EMBER: 1 },
      },
      {
        label: "Bright citrus",
        caption: "Clean air, aromatic lift, and effortless shine.",
        scores: { ZEPHYR: 3, ZENITH: 2 },
      },
      {
        label: "Smoked spice",
        caption: "Heat, sweetness, and ambered woods.",
        scores: { ARDOR: 3, SOL: 2, EMBER: 1 },
      },
    ],
  },
  {
    eyebrow: "After Dark",
    prompt: "Your ideal presence at night is...",
    guidance: "Think about how you want a room to read you after sunset.",
    options: [
      {
        label: "Poised",
        caption: "Elegant, bright, and fully composed.",
        scores: { NOVA: 3, AURORA: 2 },
      },
      {
        label: "Intimate",
        caption: "Warm skin, soft spice, and a private glow.",
        scores: { SOL: 3, EMBER: 2, AURORA: 1 },
      },
      {
        label: "Dangerous",
        caption: "Seductive, opulent, and quietly devastating.",
        scores: { SIREN: 3, ARDOR: 1, EMBER: 1 },
      },
      {
        label: "Sharp",
        caption: "Modern force with immaculate edges.",
        scores: { ZENITH: 3, ZEPHYR: 2 },
      },
    ],
  },
  {
    eyebrow: "Texture",
    prompt: "Pick a texture.",
    guidance: "Luxury is tactile. Go with what feels right in your mind first.",
    options: [
      {
        label: "Silk chiffon",
        caption: "Weightless, luminous, and impeccably refined.",
        scores: { AURORA: 2, NOVA: 3 },
      },
      {
        label: "Gold satin",
        caption: "Rich warmth with a romantic sheen.",
        scores: { EMBER: 3, SOL: 1, AURORA: 1 },
      },
      {
        label: "Velvet smoke",
        caption: "Dark florals wrapped in heat and mystery.",
        scores: { SIREN: 3, ARDOR: 2 },
      },
      {
        label: "Tailored linen",
        caption: "Fresh structure, clarity, and cool confidence.",
        scores: { ZEPHYR: 3, ZENITH: 2, SOL: 1 },
      },
    ],
  },
  {
    eyebrow: "Scene",
    prompt: "Where should your fragrance feel most at home?",
    guidance: "Picture the setting where you feel fully expressed.",
    options: [
      {
        label: "Golden hour terrace",
        caption: "Open air, champagne light, and easy elegance.",
        scores: { AURORA: 2, ZEPHYR: 2, NOVA: 1 },
      },
      {
        label: "Private dinner",
        caption: "Candlelight, skin warmth, and slow conversation.",
        scores: { EMBER: 2, SOL: 2, SIREN: 1 },
      },
      {
        label: "Gallery after dark",
        caption: "Artful restraint with a magnetic pull.",
        scores: { NOVA: 2, SIREN: 2, ZENITH: 1 },
      },
      {
        label: "Grand entrance",
        caption: "Black tailoring, intensity, and command.",
        scores: { ZENITH: 2, ARDOR: 2, SOL: 1 },
      },
    ],
  },
  {
    eyebrow: "Trail",
    prompt: "Choose the trail you want to leave.",
    guidance: "This is about the feeling that stays after you are gone.",
    options: [
      {
        label: "Clean glow",
        caption: "Luminous florals softened by musk.",
        scores: { AURORA: 2, NOVA: 2, ZEPHYR: 1 },
      },
      {
        label: "Creamy seduction",
        caption: "Velvet amber with floral depth.",
        scores: { SIREN: 2, EMBER: 2 },
      },
      {
        label: "Warm spice",
        caption: "Skin-close heat that keeps unfolding.",
        scores: { SOL: 2, ARDOR: 2, EMBER: 1 },
      },
      {
        label: "Dry woods",
        caption: "Radiant structure with modern bite.",
        scores: { ZENITH: 2, ZEPHYR: 1, ARDOR: 1 },
      },
    ],
  },
  {
    eyebrow: "Persona",
    prompt: "Which statement sounds most like you?",
    guidance: "Go with the line that feels instinctive, not aspirational.",
    options: [
      {
        label: "I make elegance feel effortless.",
        caption: "Refined, bright, and never overdone.",
        scores: { NOVA: 2, ZEPHYR: 1, AURORA: 1 },
      },
      {
        label: "I arrive softly and stay unforgettable.",
        caption: "Quiet radiance with intimate pull.",
        scores: { AURORA: 3, SOL: 1, EMBER: 1 },
      },
      {
        label: "I turn comfort into temptation.",
        caption: "Warmth, allure, and velvet depth.",
        scores: { EMBER: 2, SIREN: 2 },
      },
      {
        label: "I make restraint feel dangerous.",
        caption: "Controlled heat and unmistakable force.",
        scores: { ARDOR: 2, ZENITH: 2, SOL: 1 },
      },
    ],
  },
];

function createEmptyScores(): ScoreMap {
  return SCENT_ORDER.reduce(
    (scores, key) => {
      scores[key] = 0;
      return scores;
    },
    {} as ScoreMap,
  );
}

function toSafeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function tallyScores(answers: number[]) {
  const totals = createEmptyScores();

  answers.forEach((answerIndex, questionIndex) => {
    const option = QUESTIONS[questionIndex]?.options[answerIndex];

    if (!option) {
      return;
    }

    Object.entries(option.scores).forEach(([key, value]) => {
      const scent = key as ScentKey;
      totals[scent] += toSafeScore(value);
    });
  });

  return totals;
}

function rankScents(scores: Partial<Record<ScentKey, number>>): RankedScent[] {
  return SCENT_ORDER.map((key) => ({
    key,
    score: toSafeScore(scores[key]),
  })).sort(
    (left, right) =>
      right.score - left.score || SCENT_PRIORITY[left.key] - SCENT_PRIORITY[right.key],
  );
}

function renderActionHref(href: string) {
  const external = href.startsWith("http://") || href.startsWith("https://");

  return {
    href,
    target: external ? "_blank" : undefined,
    rel: external ? "noreferrer" : undefined,
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function QuizAction({
  label,
  icon: Icon,
  href,
  onClick,
  tone = "primary",
}: {
  label: string;
  icon: LucideIcon;
  href?: string | null;
  onClick?: () => void;
  tone?: "primary" | "secondary" | "ghost";
}) {
  const sharedClassName =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-all duration-300";
  const toneClassName =
    tone === "primary"
      ? "tara-button-primary"
      : tone === "secondary"
        ? "tara-button-inverse"
        : "border border-white/12 bg-white/6 text-[rgba(247,243,235,0.88)] hover:border-white/20 hover:bg-white/10";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(sharedClassName, toneClassName)}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
        {label}
      </button>
    );
  }

  if (href) {
    const actionLink = renderActionHref(href);

    return (
      <a {...actionLink} className={cn(sharedClassName, toneClassName)}>
        <Icon className="h-4 w-4" strokeWidth={1.8} />
        {label}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled
      className={cn(sharedClassName, toneClassName, "cursor-not-allowed opacity-55")}
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}

function DetailBlock({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[24px] border border-white/10 bg-white/6 p-5", className)}>
      <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.54)]">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.84)]">{value}</p>
    </div>
  );
}

function MatchCard({
  match,
  badge,
  compact = false,
}: {
  match: RankedScent;
  badge: string;
  compact?: boolean;
}) {
  const scent = SCENTS[match.key];

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/8",
        compact ? "h-full" : "min-h-[220px]",
      )}
      style={{
        boxShadow: `0 28px 70px ${scent.accent}22`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${scent.accent}, transparent)` }}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em]"
            style={{
              borderColor: `${scent.accent}55`,
              backgroundColor: `${scent.accent}14`,
              color: "rgba(247,243,235,0.88)",
            }}
          >
            {badge}
          </span>
          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-[rgba(247,243,235,0.56)]">
            {scent.collection} • {scent.family}
          </span>
        </div>
        <h3 className="mt-5 font-display text-4xl leading-none text-white">{scent.name}</h3>
        <p className="mt-2 text-base text-[rgba(247,243,235,0.82)]">{scent.identityTitle}</p>
        <p className="mt-4 text-sm uppercase tracking-[0.24em] text-[rgba(247,243,235,0.5)]">
          {scent.mood}
        </p>
        <p className="mt-4 text-sm leading-7 text-[rgba(247,243,235,0.74)]">
          {compact ? scent.signatureLine : scent.character}
        </p>
      </div>
    </article>
  );
}

export default function FindYourLightPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [profile, setProfile] = useState<QuizProfile>({
    gender: null,
    email: "",
    mobile: "",
  });
  const [answers, setAnswers] = useState<number[]>(() => Array(QUESTIONS.length).fill(-1));
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isResults = hasStarted && step >= QUESTIONS.length;
  const showIntro = !hasStarted;
  const currentQuestion = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];
  const progress = showIntro ? 0 : isResults ? 100 : (step / QUESTIONS.length) * 100;
  const scoreTotals = tallyScores(answers);
  const rankedScents = rankScents(scoreTotals);
  const primaryMatch = rankedScents[0];
  const secondaryMatches = rankedScents.slice(1, 3);
  const feminineMatches = rankedScents.filter((match) => SCENTS[match.key].family === "feminine");
  const masculineMatches = rankedScents.filter(
    (match) => SCENTS[match.key].family === "masculine",
  );
  const primaryScent = SCENTS[primaryMatch.key];
  const pageGlow = isResults ? primaryScent.accent : "#CA9E5B";
  const trimmedEmail = profile.email.trim();
  const trimmedMobile = profile.mobile.trim();
  const emailIsValid = trimmedEmail.length === 0 || isValidEmail(trimmedEmail);
  const mobileIsValid = trimmedMobile.length === 0 || isValidMobile(trimmedMobile);
  const canStartQuiz = profile.gender !== null && emailIsValid && mobileIsValid;

  function animateTransition(action: () => void) {
    setIsVisible(false);
    setIsTransitioning(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      action();

      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        window.requestAnimationFrame(() => {
          setIsVisible(true);
          setIsTransitioning(false);
        });
      } else {
        setIsVisible(true);
        setIsTransitioning(false);
      }
    }, 230);
  }

  function queueStep(nextStep: number, nextAnswers: number[]) {
    setAnswers(nextAnswers);
    animateTransition(() => {
      setStep(nextStep);
    });
  }

  function handleStartQuiz() {
    if (!canStartQuiz || isTransitioning) {
      return;
    }

    animateTransition(() => {
      setHasStarted(true);
      setStep(0);
    });
  }

  function handleSelect(optionIndex: number) {
    if (isTransitioning || showIntro || isResults) {
      return;
    }

    const nextAnswers = [...answers];
    nextAnswers[step] = optionIndex;
    const nextStep = step === QUESTIONS.length - 1 ? QUESTIONS.length : step + 1;
    queueStep(nextStep, nextAnswers);
  }

  function handleBack() {
    if (isTransitioning || showIntro) {
      return;
    }

    if (step === 0) {
      animateTransition(() => {
        setHasStarted(false);
      });
      return;
    }

    queueStep(step - 1, [...answers]);
  }

  function handleRetake() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    animateTransition(() => {
      setAnswers(Array(QUESTIONS.length).fill(-1));
      setStep(0);
      setHasStarted(false);
    });
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050608] text-[var(--brand-ivory)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(202,158,91,0.18),transparent_30%),radial-gradient(circle_at_top_right,rgba(75,48,106,0.22),transparent_26%),linear-gradient(180deg,#050608_0%,#0c1016_45%,#131922_100%)]" />
      <div
        className="absolute -left-28 top-16 h-72 w-72 rounded-full blur-[120px]"
        style={{ backgroundColor: "#4B306A", opacity: 0.18 }}
      />
      <div
        className="absolute right-0 top-24 h-80 w-80 rounded-full blur-[140px]"
        style={{ backgroundColor: pageGlow, opacity: 0.22 }}
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
                Back To TARA
              </Link>
              <p className="mt-5 text-xs uppercase tracking-[0.42em] text-[rgba(202,158,91,0.9)]">
                TARA Atelier
              </p>
              <h1 className="mt-4 font-display text-6xl leading-none text-white sm:text-7xl">
                Find Your Light
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[rgba(247,243,235,0.72)] sm:text-base">
                A cinematic scent ritual designed to reveal the TARA fragrance that mirrors your
                presence, pace, and afterglow.
              </p>
            </div>

            <div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-white/6 p-5 backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.48)]">
                    Progress
                  </p>
                  <p className="mt-2 text-sm text-[rgba(247,243,235,0.82)]">
                    {showIntro
                      ? "Before you begin"
                      : isResults
                        ? "Result revealed"
                        : `Question ${step + 1} of ${QUESTIONS.length}`}
                  </p>
                </div>
                <p className="text-sm font-medium text-[rgba(247,243,235,0.72)]">
                  {Math.round(progress)}%
                </p>
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

        {showIntro ? (
          <section
            className={cn(
              "grid flex-1 gap-8 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[0.85fr_1.15fr] lg:items-start",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            <div className="space-y-6">
              <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.48)]">
                  Before You Begin
                </p>
                <h2 className="mt-4 font-display text-4xl text-white sm:text-5xl">
                  Set your profile, then step into the ritual.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                  Choose the gender direction you want the experience to center around, then add
                  email or mobile only if you want those details ready for a future concierge
                  touchpoint.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(202,158,91,0.88)]">
                    Feminine
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SCENT_ORDER.filter((key) => SCENTS[key].family === "feminine").map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(247,243,235,0.72)]"
                      >
                        {SCENTS[key].name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(202,158,91,0.88)]">
                    Masculine
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SCENT_ORDER.filter((key) => SCENTS[key].family === "masculine").map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(247,243,235,0.72)]"
                      >
                        {SCENTS[key].name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[36px] border border-white/10 bg-white/6 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.36em] text-[rgba(202,158,91,0.9)]">
                    Profile Capture
                  </p>
                  <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white sm:text-5xl">
                    Identify the gender before the first question.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(247,243,235,0.66)]">
                    Gender selection is required to begin. Email and mobile are completely
                    optional, and the quiz ranking stays exactly the same.
                  </p>
                </div>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[rgba(247,243,235,0.54)] sm:inline-flex">
                  Intro
                </span>
              </div>

              <div className="mt-8">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.52)]">
                  Gender
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      value: "feminine",
                      label: "Feminine",
                      caption: "Center the ritual around Hera energy.",
                    },
                    {
                      value: "masculine",
                      label: "Masculine",
                      caption: "Center the ritual around Zeus energy.",
                    },
                    {
                      value: "open",
                      label: "Open",
                      caption: "Explore the full TARA spectrum.",
                    },
                  ].map((option) => {
                    const isSelected = profile.gender === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setProfile((current) => ({
                            ...current,
                            gender: option.value as QuizGender,
                          }))
                        }
                        aria-pressed={isSelected}
                        className={cn(
                          "group rounded-[28px] border px-5 py-6 text-left transition-all duration-300 ease-out",
                          isSelected
                            ? "border-[rgba(202,158,91,0.66)] bg-[linear-gradient(180deg,rgba(202,158,91,0.18),rgba(255,255,255,0.06))] shadow-[0_22px_50px_rgba(202,158,91,0.16)]"
                            : "border-white/10 bg-white/4 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/8",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-medium text-white">{option.label}</p>
                            <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                              {option.caption}
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
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.52)]">
                    Email
                  </span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={profile.email}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="mt-3 min-h-14 w-full rounded-[22px] border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.34)] focus:border-[rgba(202,158,91,0.52)] focus:bg-white/7"
                  />
                  {!emailIsValid ? (
                    <p className="mt-2 text-xs text-[rgba(255,204,184,0.88)]">
                      Enter a valid email address or leave this blank.
                    </p>
                  ) : null}
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.52)]">
                    Mobile
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={profile.mobile}
                    onChange={(event) =>
                      setProfile((current) => ({
                        ...current,
                        mobile: event.target.value,
                      }))
                    }
                    placeholder="Optional"
                    className="mt-3 min-h-14 w-full rounded-[22px] border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-[rgba(247,243,235,0.34)] focus:border-[rgba(202,158,91,0.52)] focus:bg-white/7"
                  />
                  {!mobileIsValid ? (
                    <p className="mt-2 text-xs text-[rgba(255,204,184,0.88)]">
                      Enter a valid mobile number or leave this blank.
                    </p>
                  ) : null}
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[rgba(247,243,235,0.44)]">
                    Start Requirement
                  </p>
                  <p className="mt-2 text-sm text-[rgba(247,243,235,0.72)]">
                    Select a gender profile to unlock question one.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={!canStartQuiz || isTransitioning}
                  className="tara-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                  Begin Quiz
                </button>
              </div>
            </div>
          </section>
        ) : !isResults ? (
          <section
            className={cn(
              "grid flex-1 gap-8 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:grid-cols-[0.8fr_1.2fr] lg:items-start",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            <div className="space-y-6">
              <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(247,243,235,0.48)]">
                  Scent Portrait
                </p>
                <h2 className="mt-4 font-display text-4xl text-white sm:text-5xl">
                  Eight identities. One unmistakable match.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                  Each answer shapes how the quiz reads your brightness, sensuality, depth, and
                  force, then ranks every scent with a stable tie-breaker so the finish is always
                  consistent.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(202,158,91,0.88)]">
                    Feminine
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SCENT_ORDER.filter((key) => SCENTS[key].family === "feminine").map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(247,243,235,0.72)]"
                      >
                        {SCENTS[key].name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/6 p-6">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-[rgba(202,158,91,0.88)]">
                    Masculine
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SCENT_ORDER.filter((key) => SCENTS[key].family === "masculine").map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-[rgba(247,243,235,0.72)]"
                      >
                        {SCENTS[key].name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[36px] border border-white/10 bg-white/6 p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.36em] text-[rgba(202,158,91,0.9)]">
                    {currentQuestion.eyebrow}
                  </p>
                  <h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white sm:text-5xl">
                    {currentQuestion.prompt}
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[rgba(247,243,235,0.66)]">
                    {currentQuestion.guidance}
                  </p>
                </div>
                <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[rgba(247,243,235,0.54)] sm:inline-flex">
                  {step + 1}/{QUESTIONS.length}
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {currentQuestion.options.map((option, optionIndex) => {
                  const isSelected = answers[step] === optionIndex;

                  return (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => handleSelect(optionIndex)}
                      aria-pressed={isSelected}
                      className={cn(
                        "group relative overflow-hidden rounded-[28px] border px-5 py-6 text-left transition-all duration-300 ease-out",
                        isSelected
                          ? "border-[rgba(202,158,91,0.66)] bg-[linear-gradient(180deg,rgba(202,158,91,0.18),rgba(255,255,255,0.06))] shadow-[0_22px_50px_rgba(202,158,91,0.16)]"
                          : "border-white/10 bg-white/4 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/8",
                        isTransitioning && "pointer-events-none",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-medium text-white">{option.label}</p>
                          <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.72)]">
                            {option.caption}
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

              <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-[rgba(247,243,235,0.88)] transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                  {step === 0 ? "Profile" : "Previous"}
                </button>
                <p className="text-right text-xs uppercase tracking-[0.3em] text-[rgba(247,243,235,0.42)]">
                  Select an answer to continue
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section
            className={cn(
              "flex-1 space-y-8 py-10 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
            aria-live="polite"
          >
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_390px]">
              <article
                className="relative overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-8 lg:p-10"
                style={{
                  boxShadow: `0 42px 120px ${primaryScent.accent}2A`,
                }}
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

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-[rgba(202,158,91,0.42)] bg-[rgba(202,158,91,0.14)] px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.86)]">
                      Primary Result
                    </span>
                    <span className="rounded-full border border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.32em] text-[rgba(247,243,235,0.54)]">
                      {primaryScent.collection} • {primaryScent.family}
                    </span>
                  </div>

                  <h2 className="mt-6 font-display text-6xl leading-none text-white sm:text-7xl">
                    {primaryScent.name}
                  </h2>
                  <p className="mt-4 text-xl text-[rgba(247,243,235,0.82)] sm:text-2xl">
                    {primaryScent.identityTitle}
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <DetailBlock label="Mood" value={primaryScent.mood} />
                    <DetailBlock label="Olfactive Profile" value={primaryScent.olfactiveProfile} />
                    <DetailBlock
                      label="Experience"
                      value={primaryScent.experience}
                      className="md:col-span-2"
                    />
                    <DetailBlock label="Character" value={primaryScent.character} />
                    <DetailBlock
                      label="Signature Line"
                      value={`“${primaryScent.signatureLine}”`}
                    />
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <QuizAction
                      label="Shop Primary Scent"
                      icon={ShoppingBag}
                      href={primaryScent.productUrl}
                    />
                    <QuizAction
                      label="Explore Discovery Set"
                      icon={Sparkles}
                      href={DISCOVERY_SET_URL}
                      tone="secondary"
                    />
                    <QuizAction
                      label="Retake Quiz"
                      icon={RotateCcw}
                      onClick={handleRetake}
                      tone="ghost"
                    />
                  </div>
                </div>
              </article>

              <aside className="space-y-6">
                <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl">
                  <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.88)]">
                    Also suits you
                  </p>
                  <h3 className="mt-4 font-display text-3xl text-white">Two close companions</h3>
                  <p className="mt-3 text-sm leading-7 text-[rgba(247,243,235,0.68)]">
                    If you want to explore nearby moods, these two stay closest to your scent
                    profile.
                  </p>
                </div>

                {secondaryMatches.map((match, index) => (
                  <MatchCard
                    key={match.key}
                    match={match}
                    badge={`Also Suits You ${index + 1}`}
                  />
                ))}
              </aside>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-[36px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.88)]">
                      Best Masculine Picks
                    </p>
                    <h3 className="mt-4 font-display text-4xl text-white">Zeus ranking</h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[rgba(247,243,235,0.42)]" strokeWidth={1.7} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {masculineMatches.map((match, index) => (
                    <MatchCard
                      key={match.key}
                      match={match}
                      badge={index === 0 ? "Top Masculine Match" : `Masculine ${index + 1}`}
                      compact
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-[36px] border border-white/10 bg-white/6 p-6 backdrop-blur-2xl sm:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.34em] text-[rgba(202,158,91,0.88)]">
                      Best Feminine Picks
                    </p>
                    <h3 className="mt-4 font-display text-4xl text-white">Hera ranking</h3>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[rgba(247,243,235,0.42)]" strokeWidth={1.7} />
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {feminineMatches.map((match, index) => (
                    <MatchCard
                      key={match.key}
                      match={match}
                      badge={index === 0 ? "Top Feminine Match" : `Feminine ${index + 1}`}
                      compact
                    />
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
