"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Camera,
  ClipboardCheck,
  Copy,
  Film,
  Hash,
  ImageIcon,
  ListChecks,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Surface } from "@/components/ui/surface";
import {
  ALL_SCENTS_SLUG,
  aspectOptions,
  buildCreativeBrief,
  channelOptions,
  formatOptions,
  objectiveOptions,
  presetOptions,
  scentOptions,
  upscaleOptions,
  workflowOptions,
  type CreativeAspectPreset,
  type CreativeBrief,
  type CreativeChannel,
  type CreativeFormat,
  type CreativeObjective,
  type CreativePreset,
  type CreativeRequest,
  type CreativeUpscaleMode,
  type CreativeWorkflow,
} from "@/lib/creative-model";
import { getAllProductImageUrls, getProductImageUrls } from "@/lib/product-media";
import { cn } from "@/lib/utils";

type CreativeStudioProps = {
  initialBrief: CreativeBrief;
  initialRequest: CreativeRequest;
};

type GeneratedImage = {
  dataUrl: string;
  model: string;
  size: string;
  sourceReferenceLabel: string;
  revisedPrompt: string | null;
};

type UploadedReference = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
};

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: Array<{
    value: T;
    label: string;
    description: string;
  }>;
  onChange: (value: T) => void;
};

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  const selected = options.find((option) => option.value === value);

  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="tara-input touch-target rounded-2xl px-4 text-sm font-medium outline-none transition"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="min-h-10 text-sm leading-5 text-[var(--muted)]">
        {selected?.description}
      </span>
    </label>
  );
}

function PromptBlock({
  title,
  value,
  copied,
  onCopy,
  icon,
}: {
  title: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  icon: "camera" | "film";
}) {
  const Icon = icon === "camera" ? Camera : Film;

  return (
    <Surface className="flex min-h-[420px] flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="tara-panel-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">
              Prompt
            </p>
            <h3 className="mt-1 text-xl font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="tara-button-secondary touch-target inline-flex items-center gap-2 rounded-2xl px-4 text-sm font-medium transition"
        >
          <Copy className="h-4 w-4" strokeWidth={1.8} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap rounded-[24px] border border-[var(--line)] bg-white/55 p-5 text-sm leading-7 text-[var(--brand-midnight)]">
        {value}
      </pre>
    </Surface>
  );
}

function DetailList({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: "checks" | "hash" | "clipboard";
}) {
  const Icon = icon === "hash" ? Hash : icon === "clipboard" ? ClipboardCheck : ListChecks;

  return (
    <Surface className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="tara-panel-dark flex h-10 w-10 items-center justify-center rounded-2xl">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      </div>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[var(--line)] bg-white/55 px-4 py-3 text-sm leading-6 text-[var(--muted-strong)]"
          >
            {item}
          </div>
        ))}
      </div>
    </Surface>
  );
}

function ReferencePreview({
  title,
  description,
  srcs,
  badge,
}: {
  title: string;
  description: string;
  srcs: string[];
  badge: string;
}) {
  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
        </div>
        <Pill tone="accent">{badge}</Pill>
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--brand-ivory)]">
        {srcs.length > 1 ? (
          <div className="grid grid-cols-3 gap-2 p-2">
            {srcs.map((src, index) => (
              <Image
                key={`${title}-${index}`}
                src={src}
                alt={`${title} ${index + 1}`}
                width={512}
                height={640}
                unoptimized={src.startsWith("data:")}
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : srcs[0] ? (
          <Image
            src={srcs[0]}
            alt={title}
            width={1024}
            height={1280}
            unoptimized={srcs[0].startsWith("data:")}
            className="aspect-[4/5] w-full object-cover"
          />
        ) : (
          <div className="grid aspect-[4/5] place-items-center p-6 text-center">
            <div className="max-w-[14rem]">
              <ImageIcon
                className="mx-auto h-8 w-8 text-[var(--brand-gold)]"
                strokeWidth={1.8}
              />
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                No image available yet for this reference source.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreativeStudio({ initialBrief, initialRequest }: CreativeStudioProps) {
  const [request, setRequest] = useState<CreativeRequest>(initialRequest);
  const [brief, setBrief] = useState<CreativeBrief>(initialBrief);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [uploadedReference, setUploadedReference] = useState<UploadedReference | null>(null);

  const productReferenceUrls =
    request.scentSlug === ALL_SCENTS_SLUG
      ? getAllProductImageUrls()
      : getProductImageUrls(request.scentSlug);
  const canRenderInStudio = request.workflow !== "midjourney-handoff";
  const midjourneyPackText = [
    "MIDJOURNEY BASE PROMPT",
    brief.midjourney.primaryPrompt,
    "",
    "DISCORD COMMAND",
    brief.midjourney.discordCommand,
    "",
    "REFERENCE PLAN",
    ...brief.midjourney.referencePlan.map((item, index) => `${index + 1}. ${item}`),
    "",
    "WEB SETUP",
    ...brief.midjourney.webSetup.map((item, index) => `${index + 1}. ${item}`),
    "",
    "PARAMETER GUIDE",
    ...brief.midjourney.parameterGuide.map((item, index) => `${index + 1}. ${item}`),
    "",
    "PRECISION LOOP",
    ...brief.midjourney.precisionLoop.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");

  function updateRequest<Key extends keyof CreativeRequest>(
    key: Key,
    value: CreativeRequest[Key],
  ) {
    const nextRequest = { ...request, [key]: value };

    setRequest(nextRequest);
    setBrief(buildCreativeBrief(nextRequest));
    setGeneratedImage(null);
    setError(null);
    setImageError(null);
  }

  async function handleReferenceUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setImageError("Upload a JPG, PNG, or WEBP image for the creative reference.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("The uploaded file could not be read."));
      };
      reader.onerror = () => reject(reader.error ?? new Error("The uploaded file could not be read."));
      reader.readAsDataURL(file);
    }).catch((error) => {
      setImageError(error instanceof Error ? error.message : "The uploaded file could not be read.");
      return null;
    });

    if (!dataUrl) {
      return;
    }

    setUploadedReference({
      dataUrl,
      fileName: file.name,
      mimeType: file.type,
    });
    setGeneratedImage(null);
    setImageError(null);
  }

  async function generateBrief(nextRequest = request) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/creative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextRequest),
      });
      const result = (await response.json()) as CreativeBrief & { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "The creative model could not answer.");
      }

      setBrief(result);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The creative model could not answer right now.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function createImage() {
    setImageLoading(true);
    setImageError(null);
    setGeneratedImage(null);

    try {
      const response = await fetch("/api/creative/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...request,
          uploadedReference,
        }),
      });
      const result = (await response.json()) as {
        brief?: CreativeBrief;
        image?: GeneratedImage;
        message?: string;
      };

      if (!response.ok || !result.image || !result.brief) {
        throw new Error(result.message ?? "The image renderer could not create this asset.");
      }

      setBrief(result.brief);
      setGeneratedImage(result.image);
    } catch (caughtError) {
      setImageError(
        caughtError instanceof Error
          ? caughtError.message
          : "The image renderer could not create this asset right now.",
      );
    } finally {
      setImageLoading(false);
    }
  }

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1400);
  }

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
        <Surface className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">
                Creative model
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">
                Build or render TARA content
              </h3>
            </div>
            <Pill tone="accent">TARA rules</Pill>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white/55 px-4 py-3 text-sm leading-6 text-[var(--muted-strong)]">
            TARA rules means each output uses the house palette, scent data, tone, and
            product-accuracy checks, with Malaysian audiences, local environments, and
            respectful Malay, Chinese, and Indian representation built in.
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <SelectField
              label="Product / scent"
              value={request.scentSlug}
              options={scentOptions}
              onChange={(value) => updateRequest("scentSlug", value)}
            />
            <SelectField<CreativeWorkflow>
              label="Workflow"
              value={request.workflow}
              options={workflowOptions}
              onChange={(value) => updateRequest("workflow", value)}
            />
            <SelectField<CreativeFormat>
              label="Format"
              value={request.format}
              options={formatOptions}
              onChange={(value) => updateRequest("format", value)}
            />
            <SelectField<CreativeChannel>
              label="Channel"
              value={request.channel}
              options={channelOptions}
              onChange={(value) => updateRequest("channel", value)}
            />
            <SelectField<CreativeObjective>
              label="Objective"
              value={request.objective}
              options={objectiveOptions}
              onChange={(value) => updateRequest("objective", value)}
            />
            <SelectField<CreativePreset>
              label="Content mode"
              value={request.preset}
              options={presetOptions}
              onChange={(value) => updateRequest("preset", value)}
            />
            <SelectField<CreativeAspectPreset>
              label="Aspect ratio"
              value={request.aspectPreset}
              options={aspectOptions}
              onChange={(value) => updateRequest("aspectPreset", value)}
            />
            <SelectField<CreativeUpscaleMode>
              label="Upscale output"
              value={request.upscaleMode}
              options={upscaleOptions}
              onChange={(value) => updateRequest("upscaleMode", value)}
            />
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Target audience nuance
            </span>
            <input
              value={request.audienceNote ?? ""}
              onChange={(event) => updateRequest("audienceNote", event.target.value)}
              placeholder="Example: premium gift buyers at KL pop-ups"
              className="tara-input touch-target rounded-2xl px-4 text-sm outline-none transition"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Extra creative direction
            </span>
            <textarea
              value={request.customBrief ?? ""}
              onChange={(event) => updateRequest("customBrief", event.target.value)}
              rows={4}
              placeholder="Example: show a private preorder mood with a handwritten card and one scent strip"
              className="tara-input resize-none rounded-2xl px-4 py-3 text-sm leading-6 outline-none transition"
            />
          </label>

          <div className="grid gap-4">
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                    Content upload
                  </p>
                  <h4 className="mt-2 text-lg font-semibold text-foreground">
                    Add a creative reference photo
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Upload a lifestyle, creator, prop, or composition reference. If you do not
                    upload anything, the renderer falls back to the saved POS product photo.
                  </p>
                </div>
                {uploadedReference ? <Pill tone="accent">Uploaded</Pill> : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <label className="tara-button-secondary touch-target inline-flex cursor-pointer items-center gap-2 rounded-2xl px-4 text-sm font-medium transition">
                  <Upload className="h-4 w-4" strokeWidth={1.8} />
                  Upload photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleReferenceUpload}
                    className="hidden"
                  />
                </label>
                {uploadedReference ? (
                  <button
                    type="button"
                    onClick={() => setUploadedReference(null)}
                    className="tara-button-secondary touch-target inline-flex items-center gap-2 rounded-2xl px-4 text-sm font-medium transition"
                  >
                    <X className="h-4 w-4" strokeWidth={1.8} />
                    Clear upload
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <ReferencePreview
                  title={
                    request.scentSlug === ALL_SCENTS_SLUG
                      ? "Saved POS product photos"
                      : "Saved POS product photo"
                  }
                  description={
                    request.scentSlug === ALL_SCENTS_SLUG
                      ? "These are the default product identity references for Aureya, Zephyr, and Maris."
                      : "This is the default product identity reference from the POS catalog."
                  }
                  srcs={productReferenceUrls}
                  badge={
                    productReferenceUrls.length > 1
                      ? `${productReferenceUrls.length} refs`
                      : productReferenceUrls[0]
                        ? "Fallback ready"
                        : "Missing"
                  }
                />
                <ReferencePreview
                  title="Uploaded content photo"
                  description="Optional extra mood or composition reference for creator-style content."
                  srcs={uploadedReference?.dataUrl ? [uploadedReference.dataUrl] : []}
                  badge={uploadedReference ? "Attached" : "Optional"}
                />
              </div>

              {!productReferenceUrls.length && !uploadedReference ? (
                <div className="tara-alert-warning mt-4 rounded-2xl px-4 py-3 text-sm leading-6">
                  This selection does not have a saved POS product photo yet. Upload a content
                  photo or packshot first if you want the renderer to preserve the product more
                  tightly.
                </div>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="tara-alert-danger rounded-2xl px-4 py-3 text-sm leading-6">
              {error}
            </div>
          ) : null}

          <div
            className={cn(
              "grid gap-3",
              canRenderInStudio ? "sm:grid-cols-3" : "sm:grid-cols-2",
            )}
          >
            <button
              type="button"
              onClick={() => generateBrief()}
              disabled={loading || imageLoading}
              className={cn(
                "touch-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
                loading ? "tara-button-secondary cursor-not-allowed" : "tara-button-secondary",
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
              ) : (
                <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
              )}
              Build brief
            </button>
            <button
              type="button"
              onClick={() => copyText("midjourney-pack", midjourneyPackText)}
              disabled={loading || imageLoading}
              className={cn(
                "touch-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
                loading || imageLoading
                  ? "tara-button-secondary cursor-not-allowed"
                  : "tara-button-secondary",
              )}
            >
              <Copy className="h-4 w-4" strokeWidth={1.8} />
              {copiedKey === "midjourney-pack" ? "Copied" : "Copy MJ pack"}
            </button>
            {canRenderInStudio ? (
              <button
                type="button"
                onClick={createImage}
                disabled={loading || imageLoading}
                className={cn(
                  "touch-target inline-flex items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
                  imageLoading
                    ? "tara-button-secondary cursor-not-allowed"
                    : "tara-button-primary",
                )}
              >
                {imageLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                ) : (
                  <ImageIcon className="h-4 w-4" strokeWidth={1.8} />
                )}
                Create image
              </button>
            ) : null}
          </div>

          {imageError ? (
            <div className="tara-alert-warning rounded-2xl px-4 py-3 text-sm leading-6">
              {imageError}
            </div>
          ) : null}
        </Surface>

        <Surface className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">
                Direction
              </p>
              <h3 className="mt-2 font-display text-5xl leading-none text-foreground">
                {brief.title}
              </h3>
            </div>
            <div
              className="h-14 w-14 rounded-2xl border border-white/60 shadow-lg"
              style={{ background: brief.scent.accentHex }}
              aria-label={`${brief.scent.name} accent color`}
            />
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[var(--line)] bg-white/55">
            {generatedImage ? (
              <div>
                <Image
                  src={generatedImage.dataUrl}
                  alt={`${brief.scent.name} generated campaign asset`}
                  width={1024}
                  height={1536}
                  unoptimized
                  className="max-h-[680px] w-full object-contain bg-[var(--brand-onyx)]"
                />
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm text-[var(--muted)]">
                  <span>
                    Rendered with {generatedImage.model} at {generatedImage.size} using{" "}
                    {generatedImage.sourceReferenceLabel}
                  </span>
                  {generatedImage.revisedPrompt ? (
                    <button
                      type="button"
                      onClick={() => copyText("revised", generatedImage.revisedPrompt ?? "")}
                      className="tara-button-secondary inline-flex min-h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition"
                    >
                      <Copy className="h-4 w-4" strokeWidth={1.8} />
                      {copiedKey === "revised" ? "Copied" : "Copy revised prompt"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="grid min-h-[260px] place-items-center p-6 text-center">
                <div className="max-w-md">
                  <div className="tara-panel-dark mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                    <ImageIcon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <h4 className="mt-4 text-xl font-semibold text-foreground">
                    {canRenderInStudio ? "No rendered image yet" : "Midjourney handoff active"}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {canRenderInStudio
                      ? "Use Create image to turn the current TARA brief into an actual visual. If no API key is connected, the app will show the setup step here."
                      : "This workflow keeps rendering in Midjourney. Copy the Midjourney pack, then use the reference plan and web setup below for the final generation."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Angle</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.angle}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Audience</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.audience}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Nuance</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.nuance}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                Extra direction
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.creativeDirection}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Channel</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.channelFit}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Aspect</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.aspectLabel} · {brief.strategy.aspectRatio}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Upscale</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.upscaleLabel}
              </p>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Workflow</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">
                {brief.strategy.workflowLabel}
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--brand-gold)]" strokeWidth={1.8} />
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                Model stack
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {brief.modelStack.map((step, index) => (
                <div key={step} className="flex gap-3 text-sm leading-6 text-[var(--muted-strong)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--brand-onyx)]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PromptBlock
          title="Image generation"
          value={brief.imagePrompt}
          icon="camera"
          copied={copiedKey === "image"}
          onCopy={() => copyText("image", brief.imagePrompt)}
        />
        <PromptBlock
          title="Midjourney base prompt"
          value={brief.midjourney.primaryPrompt}
          icon="camera"
          copied={copiedKey === "midjourney-primary"}
          onCopy={() => copyText("midjourney-primary", brief.midjourney.primaryPrompt)}
        />
        <PromptBlock
          title="Video generation"
          value={brief.videoPrompt}
          icon="film"
          copied={copiedKey === "video"}
          onCopy={() => copyText("video", brief.videoPrompt)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <PromptBlock
          title="Midjourney Discord command"
          value={brief.midjourney.discordCommand}
          icon="camera"
          copied={copiedKey === "midjourney-command"}
          onCopy={() => copyText("midjourney-command", brief.midjourney.discordCommand)}
        />
        <DetailList
          title="Midjourney reference plan"
          items={brief.midjourney.referencePlan}
          icon="checks"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DetailList title="Midjourney web setup" items={brief.midjourney.webSetup} icon="clipboard" />
        <DetailList
          title="Midjourney parameter guide"
          items={brief.midjourney.parameterGuide}
          icon="hash"
        />
        <DetailList
          title="Midjourney precision loop"
          items={brief.midjourney.precisionLoop}
          icon="checks"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Surface className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--brand-gold)]">
                Caption
              </p>
              <h3 className="mt-1 text-xl font-semibold text-foreground">Ready for posting</h3>
            </div>
            <button
              type="button"
              onClick={() =>
                copyText("caption", `${brief.caption}\n\n${brief.hashtags.join(" ")}`)
              }
              className="tara-button-secondary touch-target inline-flex items-center gap-2 rounded-2xl px-4 text-sm font-medium transition"
            >
              <Copy className="h-4 w-4" strokeWidth={1.8} />
              {copiedKey === "caption" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="rounded-[24px] border border-[var(--line)] bg-white/55 p-5 text-sm leading-7 whitespace-pre-line text-[var(--brand-midnight)]">
            {brief.caption}
          </div>
          <div className="flex flex-wrap gap-2">
            {brief.hashtags.map((tag) => (
              <Pill key={tag}>{tag}</Pill>
            ))}
          </div>
        </Surface>
        <DetailList title="Shot list" items={brief.shotList} icon="checks" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DetailList title="QA checklist" items={brief.qaChecklist} icon="clipboard" />
        <DetailList title="Production notes" items={brief.productionNotes} icon="checks" />
        <DetailList
          title="Negative prompt"
          items={brief.negativePrompt.split(", ")}
          icon="hash"
        />
      </section>
    </>
  );
}
