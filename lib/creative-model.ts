import { catalogProductSeeds } from "@/prisma/catalog-seeds";

export type CreativeFormat =
  | "product-image"
  | "image-to-video"
  | "carousel"
  | "story-reel"
  | "booth-poster";

export type CreativeChannel =
  | "instagram-feed"
  | "instagram-story"
  | "tiktok-reel"
  | "website-hero"
  | "marketplace";

export type CreativeObjective =
  | "launch-drop"
  | "product-education"
  | "sampling-conversion"
  | "corporate-gifting"
  | "ugc-remix";

export type CreativePreset =
  | "nocturne-vanity"
  | "after-dark-tailoring"
  | "influencer-lifestyle"
  | "scent-ingredients"
  | "booth-glow"
  | "gift-box-ritual";

export type CreativeAspectPreset =
  | "tiktok"
  | "instagram-portrait"
  | "instagram-square"
  | "instagram-story"
  | "web-hero"
  | "poster";

export type CreativeUpscaleMode = "standard" | "enhanced" | "maximum";

export type CreativeWorkflow =
  | "openai-render"
  | "midjourney-handoff"
  | "hybrid-precision";

export type CreativeRequest = {
  scentSlug: string;
  workflow: CreativeWorkflow;
  format: CreativeFormat;
  channel: CreativeChannel;
  objective: CreativeObjective;
  preset: CreativePreset;
  aspectPreset: CreativeAspectPreset;
  upscaleMode: CreativeUpscaleMode;
  audienceNote?: string;
  customBrief?: string;
};

export type CreativeOption<T extends string = string> = {
  value: T;
  label: string;
  description: string;
};

export type CreativeMidjourneyPack = {
  primaryPrompt: string;
  discordCommand: string;
  referencePlan: string[];
  webSetup: string[];
  parameterGuide: string[];
  precisionLoop: string[];
};

export type CreativeBrief = {
  title: string;
  scent: {
    name: string;
    collection: string;
    notes: string[];
    mood: string[];
    accentHex: string;
  };
  strategy: {
    angle: string;
    audience: string;
    nuance: string;
    creativeDirection: string;
    channelFit: string;
    aspectLabel: string;
    aspectRatio: string;
    upscaleLabel: string;
    workflowLabel: string;
  };
  modelStack: string[];
  shotList: string[];
  imagePrompt: string;
  videoPrompt: string;
  midjourney: CreativeMidjourneyPack;
  negativePrompt: string;
  caption: string;
  hashtags: string[];
  qaChecklist: string[];
  productionNotes: string[];
};

type ScentProfile = {
  slug: string;
  name: string;
  collection: string;
  description: string;
  notes: string[];
  mood: string[];
  sizeMl: number;
  accentHex: string;
  persona: "feminine" | "masculine" | "neutral";
  temperature: string;
  texture: string;
  signatureScene: string;
};

type PresetProfile = {
  label: string;
  environment: string;
  lighting: string;
  camera: string;
  styling: string;
  motion: string;
  sound: string;
};

type FormatProfile = {
  label: string;
  aspectRatio: string;
  composition: string;
  deliverable: string;
};

type AspectProfile = {
  label: string;
  aspectRatio: string;
  size: "1024x1024" | "1024x1536" | "1536x1024";
  cropGuidance: string;
};

type UpscaleProfile = {
  label: string;
  quality: "low" | "medium" | "high";
  note: string;
};

const brandRules = [
  "premium Malaysian fragrance house",
  "dark editorial luxury with sensual restraint",
  "black glass, warm gold reflections, polished shadows, and skin-close intimacy",
  "built for Malaysian customers, Malaysian retail moments, and Malaysian climate",
  "no discount-store mood, no loud neon, no cluttered props",
  "exact bottle silhouette, cap, label alignment, and product proportions preserved",
];

const productPreservationRules = [
  "always retain the original look of the entire product",
  "preserve the exact TARA bottle shape, cap geometry, color, material, label, proportions, and packaging details",
  "do not redesign, recolor, relabel, simplify, translate, replace, crop away, or stylize the product",
  "keep label text crisp, centered, readable, and unwarped",
  "do not invent extra logos, badges, QR codes, or packaging claims",
  "avoid duplicated bottles unless the shot list explicitly asks for multiples",
  "keep liquid, glass, reflections, and shadows physically plausible",
];

const malaysiaMarketRules = [
  "target Malaysian shoppers and Malaysian fragrance buyers",
  "use only Malaysian-relevant culture, retail settings, architecture, weather, food-and-beverage context, gifting rituals, and lifestyle cues",
  "when people appear, cast local Malaysian adult models and subjects with respectful Malay, Chinese, and Indian representation",
  "style people as modern Malaysians in natural everyday or premium occasion wear, never as costumes or stereotypes",
  "use Malaysian environments such as Kuala Lumpur boutiques, Klang Valley malls, curated bazaars, humid tropical evenings, local cafe tables, Raya, Chinese New Year, Deepavali, and premium pop-up counters when relevant",
  "avoid foreign landmarks, winter scenes, Western mansion cues, non-Malaysian street signs, and imported-looking campaign settings",
];

function resolveScentPersona(product: (typeof catalogProductSeeds)[number]) {
  const collection = product.collection.toLowerCase();

  if (collection.includes("her")) {
    return "feminine" as const;
  }

  if (collection.includes("him")) {
    return "masculine" as const;
  }

  return "neutral" as const;
}

const scentProfiles: ScentProfile[] = catalogProductSeeds.map((product) => {
  const notes = product.notes.split(",").map((note) => note.trim());
  const mood = product.mood.split(",").map((item) => item.trim());
  const persona = resolveScentPersona(product);

  return {
    slug: product.slug,
    name: product.name,
    collection: product.collection,
    description: product.description,
    notes,
    mood,
    sizeMl: product.sizeMl,
    accentHex: product.accentHex,
    persona,
    temperature:
      persona === "feminine"
        ? "luminous, warm, intimate"
        : persona === "masculine"
          ? "cool, polished, structured"
          : "clean, intimate, softly aquatic",
    texture:
      persona === "feminine"
        ? "silk, amber haze, soft skin glow"
        : persona === "masculine"
          ? "tailored fabric, mineral air, clean woods"
          : "soft daylight, skin-close musk, mineral air, quiet water",
    signatureScene:
      persona === "feminine"
        ? "a candlelit vanity with ivory silk, gold jewelry, and close warm reflections"
        : persona === "masculine"
          ? "a midnight tailoring table with charcoal cloth, cool glass, and a clean line of gold light"
          : "a quiet morning window scene with soft stone, clean glass, and calm close-range light",
  };
});

export const scentOptions: CreativeOption[] = scentProfiles.map((scent) => ({
  value: scent.slug,
  label: scent.name,
  description: `${scent.collection} - ${scent.mood.join(", ")}`,
}));

export const formatOptions: CreativeOption<CreativeFormat>[] = [
  {
    value: "product-image",
    label: "Product image",
    description: "One premium still for ads, product pages, and campaign posts.",
  },
  {
    value: "image-to-video",
    label: "Image to video",
    description: "A polished still frame designed to animate into a short clip.",
  },
  {
    value: "carousel",
    label: "Carousel",
    description: "A sequence with hero, notes, mood, and call-to-action frames.",
  },
  {
    value: "story-reel",
    label: "Story/Reel",
    description: "A vertical short-form concept with motion, cut points, and sound.",
  },
  {
    value: "booth-poster",
    label: "Booth poster",
    description: "A clear conversion asset for pop-ups, bazaars, and sampling.",
  },
];

export const channelOptions: CreativeOption<CreativeChannel>[] = [
  {
    value: "instagram-feed",
    label: "Instagram feed",
    description: "Editorial square or portrait post with caption and hashtags.",
  },
  {
    value: "instagram-story",
    label: "Instagram story",
    description: "Vertical, fast-read frame with direct preorder action.",
  },
  {
    value: "tiktok-reel",
    label: "TikTok/Reel",
    description: "Mobile-first motion concept with sensory pacing.",
  },
  {
    value: "website-hero",
    label: "Website hero",
    description: "Wide luxury composition for landing or scent pages.",
  },
  {
    value: "marketplace",
    label: "Marketplace",
    description: "Cleaner product-forward asset for commerce listings.",
  },
];

export const objectiveOptions: CreativeOption<CreativeObjective>[] = [
  {
    value: "launch-drop",
    label: "Launch drop",
    description: "Announce scarcity, mood, and preorder intent.",
  },
  {
    value: "product-education",
    label: "Product education",
    description: "Explain notes, wear occasion, and scent personality.",
  },
  {
    value: "sampling-conversion",
    label: "Sampling conversion",
    description: "Support booth traffic, testers, and quick decisions.",
  },
  {
    value: "corporate-gifting",
    label: "Corporate gifting",
    description: "Make the scent feel polished for client and festive gifts.",
  },
  {
    value: "ugc-remix",
    label: "UGC remix",
    description: "Guide creator-style content while keeping the brand premium.",
  },
];

export const presetOptions: CreativeOption<CreativePreset>[] = [
  {
    value: "nocturne-vanity",
    label: "Nocturne vanity",
    description: "Candlelit silk, jewelry, black glass, and intimate warmth.",
  },
  {
    value: "after-dark-tailoring",
    label: "After-dark tailoring",
    description: "Dark collars, clean woods, midnight air, and masculine polish.",
  },
  {
    value: "influencer-lifestyle",
    label: "Influencer/model lifestyle",
    description: "Realistic Malaysian influencer or model content with the product preserved.",
  },
  {
    value: "scent-ingredients",
    label: "Scent ingredients",
    description: "Notes and materials arranged as a controlled luxury still life.",
  },
  {
    value: "booth-glow",
    label: "Booth glow",
    description: "Premium pop-up counter setup with testers and warm conversion light.",
  },
  {
    value: "gift-box-ritual",
    label: "Gift box ritual",
    description: "Corporate miniature set, ribbon, thank-you card, and clean packaging.",
  },
];

export const aspectOptions: CreativeOption<CreativeAspectPreset>[] = [
  {
    value: "tiktok",
    label: "TikTok / Reels",
    description: "9:16 vertical framing for TikTok, Reels, and short-form launch edits.",
  },
  {
    value: "instagram-portrait",
    label: "Instagram portrait",
    description: "4:5 portrait framing for premium feed posts and carousel hero frames.",
  },
  {
    value: "instagram-square",
    label: "Instagram square",
    description: "1:1 framing for classic feed posts, catalog tiles, and marketplace crops.",
  },
  {
    value: "instagram-story",
    label: "Instagram story",
    description: "9:16 with sticker-safe negative space for stories and direct-response frames.",
  },
  {
    value: "web-hero",
    label: "Web hero",
    description: "Wide 3:2 web framing with room for headline, CTA, and scent storytelling.",
  },
  {
    value: "poster",
    label: "Poster / print",
    description: "3:4 vertical composition for booth posters, signage, and in-store displays.",
  },
];

export const upscaleOptions: CreativeOption<CreativeUpscaleMode>[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Fastest pass for previews and concept checks with no heavy upscale.",
  },
  {
    value: "enhanced",
    label: "Enhanced",
    description: "Balanced upscale for sharper social assets and cleaner premium detail.",
  },
  {
    value: "maximum",
    label: "Maximum",
    description: "Highest-fidelity upscale for launch visuals, web hero frames, and print-ready reviews.",
  },
];

export const workflowOptions: CreativeOption<CreativeWorkflow>[] = [
  {
    value: "hybrid-precision",
    label: "Hybrid precision",
    description:
      "Use ChatGPT to shape the brief and prompt pack, then hand the asset off to Midjourney for final exploration.",
  },
  {
    value: "midjourney-handoff",
    label: "Midjourney handoff",
    description:
      "Build the full TARA strategy and Midjourney-ready prompt pack without rendering inside the POS.",
  },
  {
    value: "openai-render",
    label: "Render in TARA",
    description:
      "Keep the current in-app OpenAI render flow for quick proofs and direct image output from the POS.",
  },
];

const presetProfiles: Record<CreativePreset, PresetProfile> = {
  "nocturne-vanity": {
    label: "Nocturne vanity",
    environment:
      "Kuala Lumpur condo vanity, black marble tray, ivory silk, slim gold jewelry, one perfume bottle",
    lighting: "low candle glow with a narrow warm key light and realistic glass reflections",
    camera: "85mm editorial macro, shallow depth of field, premium fragrance campaign framing",
    styling:
      "minimal Malaysian luxury props, negative space, soft shadow, refined feminine restraint",
    motion: "slow push-in across silk, light gliding across the bottle shoulder",
    sound: "soft fabric movement, faint glass touch, warm ambient room tone",
  },
  "after-dark-tailoring": {
    label: "After-dark tailoring",
    environment:
      "Kuala Lumpur after-dark tailoring table, pressed dark shirt, cuff detail, one perfume bottle",
    lighting: "cool midnight fill with a precise amber edge light and crisp reflections",
    camera: "70mm product editorial, low angle, controlled masculine geometry",
    styling:
      "modern Malaysian tailoring, brushed metal, clean negative space, confident restraint",
    motion: "camera pans from collar line to bottle, cap catches a clean gold highlight",
    sound: "quiet city air, soft collar movement, subtle polished click",
  },
  "influencer-lifestyle": {
    label: "Influencer/model lifestyle",
    environment:
      "realistic Malaysian influencer or model lifestyle scene in Kuala Lumpur, such as a premium local cafe table, condo vanity, mall corridor, boutique pop-up counter, or humid tropical evening street entrance, with one TARA perfume bottle clearly visible",
    lighting:
      "natural Malaysian daylight or warm evening ambient light with believable skin tones, soft shadows, and realistic phone-camera or editorial-camera highlights",
    camera:
      "realistic creator campaign photography, 50mm lifestyle lens or premium phone camera look, natural framing, authentic Malaysian social content polish",
    styling:
      "modern local Malaysian adult model or influencer styling, Malay, Chinese, or Indian representation, premium everyday wear or occasion wear, relaxed confident posture, product remains the hero",
    motion:
      "influencer lifts the bottle naturally, applies fragrance to wrist or collar area, smiles subtly, then places the product back with label readable",
    sound:
      "soft Malaysian cafe or boutique ambience, subtle fabric movement, gentle bottle placement, restrained lifestyle music cue",
  },
  "scent-ingredients": {
    label: "Scent ingredients",
    environment:
      "polished stone surface with Malaysian-relevant florals, citrus, woods, and restrained scent notes arranged around the bottle",
    lighting: "softbox top light, warm side reflection, natural shadows beneath every object",
    camera: "studio product photography, high detail, balanced composition",
    styling:
      "ingredients appear expensive, sparse, and locally believable, never kitchen-like or messy",
    motion: "ingredients drift subtly into frame, bottle remains perfectly stable",
    sound: "barely audible glass, soft air, elegant atmospheric swell",
  },
  "booth-glow": {
    label: "Booth glow",
    environment:
      "premium Malaysian mall or curated bazaar pop-up counter with testers, scent strips, QR stand, and two hero bottles",
    lighting: "warm boutique booth light with realistic shadows and clean readable surfaces",
    camera: "documentary-luxury retail angle, waist-level, inviting but uncluttered",
    styling:
      "conversion-ready Malaysian retail setup, no crowd clutter, no discount signage",
    motion: "hand places a scent strip beside the bottle, camera settles on the preorder card",
    sound: "soft retail ambience, paper scent strip, gentle bottle placement",
  },
  "gift-box-ritual": {
    label: "Gift box ritual",
    environment:
      "open luxury miniature gift box for Malaysian corporate gifting, ribbon, ivory note card, three fragrance vials",
    lighting: "clean premium tabletop light with gold edge reflections and soft shadows",
    camera: "commerce editorial, precise overhead-to-three-quarter angle",
    styling:
      "corporate gifting polish for Raya, Chinese New Year, Deepavali, and client appreciation, quiet festive elegance, no busy wrapping patterns",
    motion: "box lid opens slowly, ribbon settles, camera moves toward the vials",
    sound: "soft ribbon movement, lid opening, restrained warm music cue",
  },
};

const formatProfiles: Record<CreativeFormat, FormatProfile> = {
  "product-image": {
    label: "Product image",
    aspectRatio: "4:5",
    composition: "single hero still with the bottle as the unmistakable focal point",
    deliverable: "one high-resolution product campaign image",
  },
  "image-to-video": {
    label: "Image to video",
    aspectRatio: "9:16",
    composition: "first frame built like a premium still, leaving room for slow motion",
    deliverable: "one still frame plus an image-to-video motion prompt",
  },
  carousel: {
    label: "Carousel",
    aspectRatio: "4:5",
    composition: "five coordinated frames: hero, notes, mood, wear occasion, preorder",
    deliverable: "carousel image prompts and caption",
  },
  "story-reel": {
    label: "Story/Reel",
    aspectRatio: "9:16",
    composition: "vertical sequence with close details, movement, and a clear end CTA",
    deliverable: "short-form video prompt and shot rhythm",
  },
  "booth-poster": {
    label: "Booth poster",
    aspectRatio: "3:4",
    composition: "poster-safe layout with product, scent name, price, and scanning room",
    deliverable: "print/social poster prompt for pop-up conversion",
  },
};

const aspectProfiles: Record<CreativeAspectPreset, AspectProfile> = {
  tiktok: {
    label: "TikTok / Reels",
    aspectRatio: "9:16",
    size: "1024x1536",
    cropGuidance:
      "Keep the bottle centered in the middle 60% of frame so captions and app chrome do not hide the product.",
  },
  "instagram-portrait": {
    label: "Instagram portrait",
    aspectRatio: "4:5",
    size: "1024x1536",
    cropGuidance:
      "Compose inside a 4:5 crop while keeping generous breathing room above the cap and below the base.",
  },
  "instagram-square": {
    label: "Instagram square",
    aspectRatio: "1:1",
    size: "1024x1024",
    cropGuidance:
      "Use a centered square-safe composition with the hero bottle fully visible and text-safe side margins.",
  },
  "instagram-story": {
    label: "Instagram story",
    aspectRatio: "9:16",
    size: "1024x1536",
    cropGuidance:
      "Leave clean top and bottom zones for story stickers, links, and preorder CTA overlays.",
  },
  "web-hero": {
    label: "Web hero",
    aspectRatio: "3:2",
    size: "1536x1024",
    cropGuidance:
      "Hold the product off-center enough to leave headline and CTA space in the first viewport without losing impact.",
  },
  poster: {
    label: "Poster / print",
    aspectRatio: "3:4",
    size: "1024x1536",
    cropGuidance:
      "Keep strong vertical balance with room for scent name, price, and sampling CTA in the lower third.",
  },
};

const upscaleProfiles: Record<CreativeUpscaleMode, UpscaleProfile> = {
  standard: {
    label: "Standard",
    quality: "low",
    note: "Fast preview render with lighter detail and no premium upscale pass.",
  },
  enhanced: {
    label: "Enhanced",
    quality: "medium",
    note: "Balanced upscale for sharper glass, label, and lighting detail.",
  },
  maximum: {
    label: "Maximum",
    quality: "high",
    note: "Highest fidelity upscale for final campaign, web hero, and poster review assets.",
  },
};

const channelGuidance: Record<CreativeChannel, string> = {
  "instagram-feed":
    "Works best as a polished 4:5 editorial post for Malaysian fragrance shoppers with a caption that sells the mood.",
  "instagram-story":
    "Keep the scene vertical, readable in two seconds, and leave space for a WhatsApp or preorder link sticker.",
  "tiktok-reel":
    "Use strong first-frame contrast, slow sensory motion, and one simple transformation that feels native to Malaysian short-form content.",
  "website-hero":
    "Leave clean negative space for headline placement, keep the product visible in the first viewport, and ground the world in premium Malaysia.",
  marketplace:
    "Prioritize product accuracy, clean background logic, Malaysian buyer trust, and less cinematic darkness.",
};

const objectiveAngles: Record<CreativeObjective, string> = {
  "launch-drop":
    "Make the scent feel limited, newly released, and worth reserving now for Malaysian customers.",
  "product-education":
    "Teach the note pyramid through texture, mood, and Malaysian wear occasions without sounding clinical.",
  "sampling-conversion":
    "Help a Malaysian booth visitor understand the scent quickly and feel confident trying it.",
  "corporate-gifting":
    "Frame the product as premium, tasteful, and safe for Malaysian client or team gifting.",
  "ugc-remix":
    "Make the concept creator-friendly for Malaysian social content while preserving TARA's dark luxury tone.",
};

const workflowLabels: Record<CreativeWorkflow, string> = {
  "openai-render": "Render in TARA",
  "midjourney-handoff": "Midjourney handoff",
  "hybrid-precision": "Hybrid precision",
};

const workflowDescriptions: Record<CreativeWorkflow, string> = {
  "openai-render":
    "Build the strategy in TARA and render directly inside the POS when speed matters more than external iteration.",
  "midjourney-handoff":
    "Use TARA to generate the brief, nuance, and Midjourney-ready prompt pack, then finish the visual exploration in Midjourney Web or Discord.",
  "hybrid-precision":
    "Use TARA to lock the scent strategy and product rules, optionally render a proof in-app, then push the refined prompt and references into Midjourney for final exploration.",
};

const channelHashtags: Record<CreativeChannel, string[]> = {
  "instagram-feed": [
    "#TARAScents",
    "#MalaysiaPerfume",
    "#PerfumeMalaysia",
    "#MalaysianBrand",
    "#LuxuryFragrance",
  ],
  "instagram-story": ["#TARAScents", "#ScentOfTheNight", "#PerfumeMalaysia", "#MalaysianBrand"],
  "tiktok-reel": ["#PerfumeTok", "#TARAScents", "#FragranceTok", "#MalaysiaBrand"],
  "website-hero": ["#TARAScents", "#LuxuryFragrance", "#MalaysianBrand"],
  marketplace: ["#TARAScents", "#PerfumeMalaysia", "#MalaysianBrand", "#EDP"],
};

function findOption<T extends string>(options: CreativeOption<T>[], value: string, fallback: T) {
  return options.find((option) => option.value === value)?.value ?? fallback;
}

function defaultAspectPreset(
  format: CreativeFormat,
  channel: CreativeChannel,
): CreativeAspectPreset {
  if (channel === "website-hero") {
    return "web-hero";
  }

  if (channel === "instagram-story") {
    return "instagram-story";
  }

  if (channel === "tiktok-reel") {
    return "tiktok";
  }

  if (format === "image-to-video" || format === "story-reel") {
    return "tiktok";
  }

  if (format === "booth-poster") {
    return "poster";
  }

  if (channel === "marketplace") {
    return "instagram-square";
  }

  return "instagram-portrait";
}

export function getAspectProfile(aspectPreset: CreativeAspectPreset) {
  return aspectProfiles[aspectPreset];
}

export function getUpscaleProfile(upscaleMode: CreativeUpscaleMode) {
  return upscaleProfiles[upscaleMode];
}

export function normalizeCreativeRequest(input: Partial<CreativeRequest>): CreativeRequest {
  const format = findOption(formatOptions, input.format ?? "", "product-image");
  const channel = findOption(channelOptions, input.channel ?? "", "instagram-feed");

  return {
    scentSlug: input.scentSlug && scentProfiles.some((scent) => scent.slug === input.scentSlug)
      ? input.scentSlug
      : scentProfiles[0]?.slug ?? "aureya",
    workflow: findOption(workflowOptions, input.workflow ?? "", "hybrid-precision"),
    format,
    channel,
    objective: findOption(objectiveOptions, input.objective ?? "", "launch-drop"),
    preset: findOption(presetOptions, input.preset ?? "", "nocturne-vanity"),
    aspectPreset: findOption(
      aspectOptions,
      input.aspectPreset ?? "",
      defaultAspectPreset(format, channel),
    ),
    upscaleMode: findOption(upscaleOptions, input.upscaleMode ?? "", "enhanced"),
    audienceNote: input.audienceNote?.trim().slice(0, 180),
    customBrief: input.customBrief?.trim().slice(0, 360),
  };
}

function getScent(slug: string) {
  return scentProfiles.find((scent) => scent.slug === slug) ?? scentProfiles[0];
}

function sentenceJoin(items: string[]) {
  return items.filter(Boolean).join(", ");
}

function buildSuggestedAudience(request: CreativeRequest, scent: ScentProfile) {
  if (request.audienceNote) {
    return request.audienceNote;
  }

  if (request.objective === "corporate-gifting") {
    return "Malaysian corporate gift buyers, premium festive shoppers, and polished client-facing purchasers who want tasteful fragrance gifting.";
  }

  if (request.objective === "sampling-conversion") {
    return scent.persona === "feminine"
      ? "Malaysian women at pop-ups and counters who want an intimate feminine scent they can trust after one skin test."
      : scent.persona === "masculine"
        ? "Malaysian men at pop-ups and counters who want a clean, confident scent they can decide on quickly after one spray."
        : "Malaysian shoppers who want a skin-close, clean signature that feels intimate, modern, and easy to wear after one test.";
  }

  if (request.objective === "ugc-remix") {
    return scent.persona === "feminine"
      ? "Style-aware Malaysian women who save sensual, polished beauty content and want luxury that still feels wearable."
      : scent.persona === "masculine"
        ? "Modern Malaysian men who respond to refined grooming, tailoring, and quietly powerful fragrance content."
        : "Style-aware Malaysian audiences who save clean, intimate fragrance content that feels modern, airy, and softly addictive.";
  }

  return scent.persona === "feminine"
    ? "Malaysian women drawn to luminous, skin-close florals with premium softness, gifting appeal, and evening polish."
    : scent.persona === "masculine"
      ? "Modern Malaysian men drawn to clean structure, confident woods, and premium restraint that feels polished rather than loud."
      : "Modern Malaysian fragrance buyers drawn to clean intimacy, aquatic freshness, and a signature that stays close to skin.";
}

function buildSuggestedNuance(
  request: CreativeRequest,
  scent: ScentProfile,
  format: FormatProfile,
  aspect: AspectProfile,
) {
  const audience = buildSuggestedAudience(request, scent);

  return `${scent.name} should feel ${scent.temperature}, with ${scent.mood
    .join(", ")
    .toLowerCase()} energy translated for ${audience.toLowerCase()} in a ${format.label.toLowerCase()} built for ${aspect.label.toLowerCase()} framing.`;
}

function buildSuggestedCreativeDirection(
  request: CreativeRequest,
  scent: ScentProfile,
  preset: PresetProfile,
  aspect: AspectProfile,
) {
  const customBrief = request.customBrief ? ` Honor this added direction: ${request.customBrief}.` : "";

  return `Stage ${scent.name} inside ${preset.environment}, light it with ${preset.lighting}, and keep the world grounded in ${scent.signatureScene}. ${aspect.cropGuidance} Let the frame lean into ${scent.texture} while preserving a premium Malaysian point of view.${customBrief}`;
}

function buildShotList(
  request: CreativeRequest,
  scent: ScentProfile,
  preset: PresetProfile,
  format: FormatProfile,
) {
  if (request.format === "carousel") {
    return [
      `${scent.name} hero frame: ${format.composition}.`,
      `Notes frame: show ${scent.notes.slice(0, 4).join(", ")} as sparse premium materials.`,
      `Mood frame: translate ${scent.mood.join(", ")} into Malaysian fabric, light, and posture cues.`,
      `Wear frame: show the bottle beside ${
        scent.persona === "feminine"
          ? "modern Malaysian evening details"
          : scent.persona === "masculine"
            ? "modern Malaysian tailoring details"
            : "quiet modern Malaysian daily ritual details"
      }.`,
      "CTA frame: reserve the 50mL Eau de Parfum, keep text minimal and poster-safe.",
    ];
  }

  if (request.format === "booth-poster") {
    return [
      `Bottle centered with ${preset.environment}.`,
      "Leave upper negative space for scent name and lower space for price/preorder CTA.",
      "Include a subtle tester strip cue so shoppers understand they can sample it.",
      "Keep the Malaysian pop-up counter premium and clean, with no discount or crowded market cues.",
    ];
  }

  if (request.format === "story-reel" || request.format === "image-to-video") {
    return [
      `Opening: ${scent.name} bottle held steady in ${preset.environment}.`,
      `Movement: ${preset.motion}.`,
      `Sensory insert: ${scent.notes.slice(0, 3).join(", ")} appear through Malaysian-relevant light, texture, or restrained ingredient details.`,
      "End frame: bottle upright, label readable, warm preorder cue, no hard-sell graphics.",
    ];
  }

  return [
    `Hero composition: ${format.composition}.`,
    `Scene: ${preset.environment}.`,
    `Light: ${preset.lighting}.`,
    "Final check: label readable, bottle accurate, reflections realistic.",
  ];
}

function buildImagePrompt(
  request: CreativeRequest,
  scent: ScentProfile,
  preset: PresetProfile,
  format: FormatProfile,
  aspect: AspectProfile,
  upscale: UpscaleProfile,
  suggestedAudience: string,
  suggestedNuance: string,
  suggestedCreativeDirection: string,
) {
  const audience = `Target audience: ${suggestedAudience}.`;
  const nuance = `Nuance: ${suggestedNuance}.`;
  const direction = `Creative direction: ${suggestedCreativeDirection}.`;

  return [
    `Create ${format.deliverable} for TARA ${scent.name}, a ${scent.sizeMl}mL Eau de Parfum in the ${scent.collection} collection.`,
    audience,
    nuance,
    direction,
    `Brand world: ${brandRules.join("; ")}.`,
    `Malaysia market rules: ${malaysiaMarketRules.join("; ")}.`,
    `Scent mood: ${scent.mood.join(", ")}. Notes to imply visually: ${scent.notes.join(", ")}.`,
    `Scene: ${preset.environment}.`,
    `Lighting: ${preset.lighting}.`,
    `Camera: ${preset.camera}.`,
    `Composition: ${format.composition}. Aspect ratio ${aspect.aspectRatio} for ${aspect.label}. ${aspect.cropGuidance}`,
    `Styling: ${preset.styling}. Texture language: ${scent.texture}.`,
    `Upscale target: ${upscale.label}. ${upscale.note}`,
    `Product rules: ${productPreservationRules.join("; ")}.`,
    "Photorealistic, high-end commercial fragrance photography, physically accurate shadows, realistic glass caustics, premium retouching, crisp focal point.",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function midjourneyStylizeFor(preset: CreativePreset) {
  if (preset === "scent-ingredients") {
    return 75;
  }

  if (preset === "influencer-lifestyle") {
    return 140;
  }

  return 100;
}

function buildMidjourneyPrimaryPrompt(
  scent: ScentProfile,
  preset: PresetProfile,
  format: FormatProfile,
  suggestedAudience: string,
  suggestedNuance: string,
  suggestedCreativeDirection: string,
) {
  return [
    `luxury commercial fragrance campaign for TARA ${scent.name}`,
    `${scent.sizeMl}mL bottle, ${scent.collection} collection`,
    `${format.composition}`,
    `${scent.mood.join(", ")} mood`,
    `notes implied through ${scent.notes.join(", ")}`,
    preset.environment,
    preset.lighting,
    preset.camera,
    `targeted to ${suggestedAudience.toLowerCase()}`,
    suggestedNuance,
    suggestedCreativeDirection,
    "premium Malaysian setting and audience cues",
    "product remains photoreal and identical to the reference bottle",
    "label crisp, centered, readable",
    "realistic glass, realistic reflections, premium retouching, quiet luxury",
  ]
    .join(", ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildMidjourneyDiscordCommand(
  request: CreativeRequest,
  scent: ScentProfile,
  preset: PresetProfile,
  format: FormatProfile,
  aspect: AspectProfile,
  suggestedAudience: string,
  suggestedNuance: string,
  suggestedCreativeDirection: string,
) {
  const stylize = midjourneyStylizeFor(request.preset);
  const prompt = buildMidjourneyPrimaryPrompt(
    scent,
    preset,
    format,
    suggestedAudience,
    suggestedNuance,
    suggestedCreativeDirection,
  );

  return [
    "/imagine prompt:",
    "[optional_uploaded_image_prompt_url]",
    prompt,
    `--ar ${aspect.aspectRatio}`,
    "--v 7",
    "--raw",
    `--stylize ${stylize}`,
    "--oref [POS_PRODUCT_OMNI_REFERENCE_URL]",
    "--ow 250",
    "--sref [OPTIONAL_UPLOADED_STYLE_REFERENCE_URL]",
    "--sw 125",
  ].join(" ");
}

function buildMidjourneyReferencePlan(aspect: AspectProfile, upscale: UpscaleProfile) {
  return [
    "Use the saved POS product photo as the Omni Reference first so the bottle silhouette, cap, glass, and label stay locked to the real TARA product.",
    "If you upload a content photo, start by using it as the Style Reference for palette, atmosphere, lighting, and vibe transfer.",
    "If the uploaded photo is really about composition or prop placement instead of mood, rerun with it as an Image Prompt rather than a Style Reference.",
    `If no content photo is uploaded, proceed with the saved POS product photo alone and let the text prompt control the ${aspect.label.toLowerCase()} scene.`,
    `Upscale target: ${upscale.label}. Keep the winning frame product-accurate before you upscale anything.`,
  ];
}

function buildMidjourneyWebSetup(request: CreativeRequest, aspect: AspectProfile) {
  const upscaleStep =
    request.upscaleMode === "standard"
      ? "Leave the image at the base grid first, or use a very light upscale only after the label is clearly correct."
      : request.upscaleMode === "enhanced"
        ? "Use Midjourney's Subtle Upscale on the winning image for cleaner glass and label edges."
        : "Use Subtle Upscale first, then test Creative Upscale only if the bottle and label still hold perfectly for poster or web review.";

  return [
    "Open Midjourney Web and start a new image prompt with the TARA brief beside you.",
    "Attach the saved POS product photo as the Omni Reference to anchor the product identity.",
    "Attach the uploaded content photo as the Style Reference when you want its mood and lighting carried over.",
    `Set the aspect ratio to ${aspect.aspectRatio} for ${aspect.label}, paste the Midjourney base prompt, and keep Raw mode on for tighter product control.`,
    upscaleStep,
  ];
}

function buildMidjourneyParameterGuide(
  request: CreativeRequest,
  aspect: AspectProfile,
  upscale: UpscaleProfile,
) {
  return [
    `Aspect ratio: use --ar ${aspect.aspectRatio} to match ${aspect.label}.`,
    "Version: use V7 so Omni Reference is available and the product can stay locked to the reference photo.",
    `Raw mode plus stylize: start with --raw and --stylize ${midjourneyStylizeFor(request.preset)} so the scent mood stays elegant without drifting away from the bottle.`,
    "Omni Reference: start around --ow 250 and only raise it if the label, bottle color, or cap geometry starts drifting.",
    "Style Reference: when you upload a content photo, begin around --sw 125 and lower it if the style overwhelms the product.",
    `Upscale: ${upscale.label}. ${upscale.note}`,
  ];
}

function buildMidjourneyPrecisionLoop(request: CreativeRequest) {
  const firstPass =
    request.workflow === "hybrid-precision"
      ? "Start by using TARA's own brief and, if helpful, a quick in-app render as the precision check before you widen the exploration in Midjourney."
      : "Start with one clean Midjourney pass using the product Omni Reference and no extra prompt clutter.";

  return [
    firstPass,
    "If the mood is strong but the bottle drifts, raise Omni weight before rewriting the whole prompt.",
    "If the product is accurate but the scene feels generic, keep the reference setup and only refine the environment, lighting, or prop language.",
    "If the uploaded content photo feels too dominant, lower style weight or switch that upload from Style Reference to Image Prompt for one comparison run.",
    "Approve the frame only after the bottle, cap, label, reflections, and Malaysian context all feel correct at full view.",
  ];
}

function buildVideoPrompt(
  scent: ScentProfile,
  preset: PresetProfile,
  aspect: AspectProfile,
  suggestedCreativeDirection: string,
) {
  return [
    `Animate the approved TARA ${scent.name} hero still into a ${aspect.aspectRatio} premium fragrance clip for ${aspect.label}.`,
    `Always retain the original look of the entire product: exact bottle silhouette, cap, color, label, scale, packaging details, material, and reflections.`,
    `Do not redesign, recolor, relabel, crop away, duplicate, or morph the product.`,
    `Malaysia market rules: ${malaysiaMarketRules.join("; ")}.`,
    `Creative direction: ${suggestedCreativeDirection}.`,
    `Motion: ${preset.motion}.`,
    `The action unfolds slowly: first hold the hero composition, then introduce a subtle light pass, then end on a stable readable bottle frame.`,
    `Use ${scent.temperature} atmosphere with ${scent.texture}.`,
    `Sound direction: ${preset.sound}.`,
    "No morphing, no extra bottles, no warped text, no sudden camera shake, no unrealistic liquid movement.",
  ].join(" ");
}

function buildCaption(request: CreativeRequest, scent: ScentProfile) {
  const leadByObjective: Record<CreativeObjective, string> = {
    "launch-drop": `${scent.name} steps into the first TARA chapter with ${scent.mood
      .slice(0, 2)
      .join(" and ")
      .toLowerCase()} energy.`,
    "product-education": `${scent.name} opens through ${scent.notes
      .slice(0, 2)
      .join(" and ")
      .toLowerCase()}, then settles into ${scent.notes.slice(-2).join(" and ").toLowerCase()}.`,
    "sampling-conversion": `Try ${scent.name} on skin and give it a minute to show its full temperature.`,
    "corporate-gifting": `${scent.name} is a polished gifting gesture with a scent story that feels personal without becoming too loud.`,
    "ugc-remix": `The ${scent.name} mood: ${scent.mood.join(", ").toLowerCase()}, filmed close enough to feel remembered.`,
  };

  const cta =
    request.objective === "sampling-conversion"
      ? "Meet the house at the next booth or message TARA to reserve your bottle."
      : request.objective === "corporate-gifting"
        ? "Message TARA for corporate gifting and miniature set requests."
        : "Reserve the 50mL Eau de Parfum through TARA preorder.";

  return `${leadByObjective[request.objective]}\n\n${cta}`;
}

function buildNegativePrompt() {
  return [
    "warped label text",
    "misspelled brand name",
    "extra logo",
    "duplicate bottle",
    "redesigned bottle",
    "changed product color",
    "different cap",
    "new packaging",
    "cropped product",
    "deformed cap",
    "plastic-looking glass",
    "unrealistic reflection",
    "cheap discount poster",
    "cluttered props",
    "neon club lighting",
    "medical claims",
    "celebrity likeness",
    "hands with distorted fingers",
    "foreign landmarks",
    "winter scene",
    "Western mansion",
    "European street",
    "non-Malaysian street signs",
    "costume-like cultural styling",
    "ethnic stereotype",
  ].join(", ");
}

function buildModelStack(request: CreativeRequest, upscale: UpscaleProfile) {
  if (request.workflow === "openai-render") {
    return [
      "Generate the strategy in TARA first, then render directly inside the POS with the saved product photo plus any uploaded content reference.",
      "Use Malaysian-relevant scenes, subjects, retail environments, and cultural context by default.",
      "If people appear, use local Malaysian adult models with respectful Malay, Chinese, and Indian representation.",
      "Run 4 variations, reject anything with changed product shape, warped label text, duplicated bottles, foreign settings, or unrealistic glass.",
      "Use the strongest still as the first frame for image-to-video instead of starting video from text only.",
      `Upscale setting: ${upscale.label}. ${upscale.note}`,
    ];
  }

  if (request.workflow === "midjourney-handoff") {
    return [
      "Generate the TARA brief and Midjourney prompt pack first so the scent strategy and audience nuance are locked before rendering elsewhere.",
      "Use the saved POS product photo as the Midjourney Omni Reference, and add an uploaded content photo only when you want extra mood or composition guidance.",
      "Keep Malaysian-relevant retail, lifestyle, architecture, and model-casting cues visible in every pass.",
      "Run a small variation set first, reject anything with label drift or product redesign, then refine the best pass rather than rewriting from zero.",
      `Upscale setting: ${upscale.label}. ${upscale.note}`,
    ];
  }

  return [
    "Use TARA to lock the scent strategy, audience nuance, and product rules before you render anything.",
    "Render a quick proof in TARA when helpful, then use the Midjourney prompt pack to widen exploration while preserving the same product identity.",
    "Use the saved POS product photo as the product-accuracy anchor and any uploaded content photo as optional creative direction.",
    "If people appear, use local Malaysian adult models with respectful Malay, Chinese, and Indian representation.",
    "Approve only frames that keep the bottle, label, reflections, and Malaysian context believable at full resolution.",
    `Upscale setting: ${upscale.label}. ${upscale.note}`,
  ];
}

export function buildCreativeBrief(input: Partial<CreativeRequest>): CreativeBrief {
  const request = normalizeCreativeRequest(input);
  const scent = getScent(request.scentSlug);
  const preset = presetProfiles[request.preset];
  const format = formatProfiles[request.format];
  const aspect = aspectProfiles[request.aspectPreset];
  const upscale = upscaleProfiles[request.upscaleMode];
  const suggestedAudience = buildSuggestedAudience(request, scent);
  const suggestedNuance = buildSuggestedNuance(request, scent, format, aspect);
  const suggestedCreativeDirection = buildSuggestedCreativeDirection(
    request,
    scent,
    preset,
    aspect,
  );
  const shotList = buildShotList(request, scent, preset, format);
  const midjourneyPrimaryPrompt = buildMidjourneyPrimaryPrompt(
    scent,
    preset,
    format,
    suggestedAudience,
    suggestedNuance,
    suggestedCreativeDirection,
  );
  const midjourneyDiscordCommand = buildMidjourneyDiscordCommand(
    request,
    scent,
    preset,
    format,
    aspect,
    suggestedAudience,
    suggestedNuance,
    suggestedCreativeDirection,
  );

  return {
    title: `${scent.name} ${format.label} - ${preset.label}`,
    scent: {
      name: scent.name,
      collection: scent.collection,
      notes: scent.notes,
      mood: scent.mood,
      accentHex: scent.accentHex,
    },
    strategy: {
      angle: objectiveAngles[request.objective],
      audience: suggestedAudience,
      nuance: suggestedNuance,
      creativeDirection: suggestedCreativeDirection,
      channelFit: channelGuidance[request.channel],
      aspectLabel: aspect.label,
      aspectRatio: aspect.aspectRatio,
      upscaleLabel: upscale.label,
      workflowLabel: workflowLabels[request.workflow],
    },
    modelStack: buildModelStack(request, upscale),
    shotList,
    imagePrompt: buildImagePrompt(
      request,
      scent,
      preset,
      format,
      aspect,
      upscale,
      suggestedAudience,
      suggestedNuance,
      suggestedCreativeDirection,
    ),
    videoPrompt: buildVideoPrompt(scent, preset, aspect, suggestedCreativeDirection),
    midjourney: {
      primaryPrompt: midjourneyPrimaryPrompt,
      discordCommand: midjourneyDiscordCommand,
      referencePlan: buildMidjourneyReferencePlan(aspect, upscale),
      webSetup: buildMidjourneyWebSetup(request, aspect),
      parameterGuide: buildMidjourneyParameterGuide(request, aspect, upscale),
      precisionLoop: buildMidjourneyPrecisionLoop(request),
    },
    negativePrompt: buildNegativePrompt(),
    caption: buildCaption(request, scent),
    hashtags: Array.from(
      new Set([
        ...channelHashtags[request.channel],
        `#${scent.name}ByTARA`,
        `#${scent.collection}Collection`,
      ]),
    ),
    qaChecklist: [
      `The viewer can identify ${scent.name} in under two seconds.`,
      "The entire original product look is retained: bottle, cap, label, color, proportions, and packaging details.",
      "Bottle silhouette, cap, label position, and glass weight feel physically real.",
      "Scene supports the scent notes with Malaysian-relevant elements without becoming literal or cluttered.",
      "People, if present, read as modern local Malaysian adults with respectful Malay, Chinese, and Indian representation.",
      "The final frame leaves room for preorder, price, or link-sticker text if needed.",
      "Caption makes no medical, attraction-guarantee, or long-wear claims.",
    ],
    productionNotes: [
      `Preferred workflow: ${workflowLabels[request.workflow]}. ${workflowDescriptions[request.workflow]}`,
      `Preferred aspect ratio: ${aspect.label} (${aspect.aspectRatio}) on a ${aspect.size} canvas.`,
      `Upscale plan: ${upscale.label}. ${upscale.note}`,
      `Primary visual materials: ${sentenceJoin([scent.texture, preset.environment])}.`,
      "For real generation, upload a content photo when you have one. If you do not upload anything, the studio falls back to the saved POS product photo when available.",
      "Keep Malaysian market relevance visible through location, model casting, styling, gifting moments, climate, and retail context.",
      "For video, keep the clip to one scene at first; stitch multiple scenes only after product consistency is proven.",
    ],
  };
}
