import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ALL_SCENTS_SLUG,
  buildCreativeBrief,
  getAspectProfile,
  getCreativeVariationCue,
  getUpscaleProfile,
  normalizeCreativeRequest,
  type CreativeRequest,
} from "@/lib/creative-model";
import { getAllProductImageUrls, getProductImageUrls } from "@/lib/product-media";

export const preferredRegion = "sin1";

type UploadedReferenceInput = {
  dataUrl?: string;
  fileName?: string;
  mimeType?: string;
};

type CreativeImageRouteBody = Partial<CreativeRequest> & {
  variationIndex?: number;
  uploadedReference?: UploadedReferenceInput | null;
};

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    revised_prompt?: string;
  }>;
  error?: {
    message?: string;
  };
};

type ReferenceImage = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  label: string;
  source: "product" | "uploaded";
};

type VariationPack = {
  label: string;
  scene: string;
  framing: string;
  styling: string;
  energy: string;
};

const variationPacksByPreset: Partial<Record<CreativeRequest["preset"], VariationPack[]>> = {
  "after-rain-silence": [
    {
      label: "window rain hush",
      scene: "Place the model near soft window daylight after rain, with the background reduced to a green-gray blur and no visible objects.",
      framing: "Use a close-to-mid vertical crop on shoulders, neck, collarbone, hands, and the full readable bottle near the collarbone.",
      styling: "Use slightly damp hair, fine skin droplets, neutral ivory or muted green styling, and relaxed fingers with no accessories.",
      energy: "Feel quiet, intimate, and melancholic but calming, with skin and light carrying more emotion than pose.",
    },
    {
      label: "deep green stillness",
      scene: "Move the scene into a darker green-gray gradient world with no scenery, no props, and a stronger post-water silence.",
      framing: "Hold the bottle in the middle third, secondary to the face and collarbone but still clear and label-forward.",
      styling: "Use off-shoulder wet fabric, natural skin texture, soft droplets, and hair falling naturally across one shoulder.",
      energy: "Feel editorial, restrained, and skin-close rather than glamorous or performative.",
    },
    {
      label: "eyes closed breath",
      scene: "Make the private moment about eyes closed and a slow breath after water, using only diffused daylight and soft shadow.",
      framing: "Crop just below the upper torso with generous negative space above and beside the subject.",
      styling: "Keep makeup nearly invisible, skin fresh, fabric neutral, and the hand holding the bottle loose rather than staged.",
      energy: "Feel like an emotional pause, not a product demonstration.",
    },
  ],
  "golden-distance": [
    {
      label: "last warm light",
      scene: "Use a barely defined golden-hour backdrop with warm sky and champagne blur, no objects, no furniture, and no beach details.",
      framing: "Frame thigh-to-head or upper body, with the bottle held near waist or collarbone at natural scale.",
      styling: "Use radiant natural skin, soft blush or ivory bikini styling, tousled hair, and a distant gaze away from camera.",
      energy: "Feel warm, sensual, effortless, and expensive without becoming posed or flashy.",
    },
    {
      label: "sun on shoulder",
      scene: "Let the image turn around a soft sun highlight across shoulder and glass, keeping the environment abstract and minimal.",
      framing: "Use a balanced vertical composition with skin and product sharing attention, bottle readable but not enlarged.",
      styling: "Keep wardrobe champagne or ivory, no patterns, no jewelry, and no heavy makeup.",
      energy: "Feel quiet-luxury magnetic, like a private pause before leaving.",
    },
    {
      label: "seated golden calm",
      scene: "Seat the subject naturally in warm light against a neutral blurred backdrop with no props and no scenic dominance.",
      framing: "Use upper-body focus, relaxed posture, bottle near thigh or waist, face turned slightly away.",
      styling: "Use smooth natural skin highlights, simple neutral bikini styling, and hair with soft natural movement.",
      energy: "Feel composed, intimate, and editorial, not influencer-style.",
    },
  ],
  "skin-memory": [
    {
      label: "collarbone witness",
      scene: "Make the scent feel like a memory held against the skin in a near-abstract neutral backdrop with no props.",
      framing: "Tight vertical crop on neck, collarbone, shoulder, hand, and full readable bottle pressed lightly near the sternum.",
      styling: "Use natural skin texture, relaxed fingers, neutral off-shoulder fabric, and eyes lowered or outside the frame.",
      energy: "Feel close, human, quiet, and memorable.",
    },
    {
      label: "hands and breath",
      scene: "Let hands and skin-light interaction carry the story, with the model mostly still and the world blurred away.",
      framing: "Use shallow depth of field with the bottle sharp enough for label reading and the face softly secondary.",
      styling: "Keep wardrobe beige, ivory, muted green, champagne, or soft blush with no accessories.",
      energy: "Feel private, refined, and emotionally restrained.",
    },
    {
      label: "soft side light",
      scene: "Move the light to one side so the shoulder, hand, and glass catch a narrow gentle highlight.",
      framing: "Keep shoulders, neck, and product inside the frame, avoiding full-body glamour composition.",
      styling: "Use no heavy makeup, no glossy retouching, and a natural posture that feels grounded.",
      energy: "Feel intimate and cinematic, like scent becoming part of skin.",
    },
  ],
  "quiet-threshold": [
    {
      label: "before leaving",
      scene: "Place the subject at a minimal doorway or window-edge threshold with a calm neutral gradient and no visible props.",
      framing: "Use a vertical mid shot with the body angled away and the bottle held near shoulder or waist.",
      styling: "Use understated neutral wardrobe, natural grooming, and a gaze downward or away from camera.",
      energy: "Feel poised, thoughtful, and emotionally charged without drama.",
    },
    {
      label: "green-gray pause",
      scene: "Reduce the space to a soft green-gray wall and a single directional daylight gradient.",
      framing: "Keep strong negative space, bottle clear in the middle third, and product scale believable.",
      styling: "Use clean skin, soft fabric, no patterns, no jewelry, and no flashy colors.",
      energy: "Feel restrained, premium, and quietly memorable.",
    },
    {
      label: "held composure",
      scene: "Focus on a calm standing posture as if the subject has paused mid-transition, with no set dressing at all.",
      framing: "Balance skin, face, hands, and product with shallow depth of field and smooth background falloff.",
      styling: "Keep expression distant but soft, posture confident, and bottle held loosely rather than presented.",
      energy: "Feel confident without performance, luxury without noise.",
    },
  ],
  "first-light-afterglow": [
    {
      label: "pale window breath",
      scene: "Place the model near a pale morning window with the room reduced to linen, soft stone, and clean haze, no furniture or prop dominance.",
      framing: "Use a vertical close-to-mid crop on shoulder, neck, relaxed hand, and full readable bottle near collarbone or sternum.",
      styling: "Use fresh skin, sleep-soft or slightly damp hair, ivory or pale champagne fabric, no patterns, no accessories, and no heavy makeup.",
      energy: "Feel newly awake, private, and calm, with first light doing more storytelling than pose.",
    },
    {
      label: "linen afterglow",
      scene: "Make the frame cleaner and paler, with soft cotton or linen texture implied only as a background plane.",
      framing: "Hold the bottle in the middle third with breathing room above the cap and a lowered gaze softened by depth of field.",
      styling: "Keep skin natural and luminous, wardrobe white, beige, or champagne, and every object outside the product absent.",
      energy: "Feel fresh, elegant, and emotionally quiet rather than styled like a bedroom scene.",
    },
    {
      label: "morning hand detail",
      scene: "Focus on the first gesture of picking up the perfume after water or sleep, keeping the environment abstract and minimal.",
      framing: "Crop around hand, wrist, collarbone, and bottle with the face partial or gently out of focus.",
      styling: "Use clean nails, relaxed fingers, soft daylight, pale fabric, and realistic glass transparency.",
      energy: "Feel close, honest, and premium, not commercial-demo direct.",
    },
  ],
  "steam-veil": [
    {
      label: "fogged glass hush",
      scene: "Use a fogged-glass or steam-softened plane as a minimal background, with no bathroom clutter and no visible water splash.",
      framing: "Keep the full bottle sharp and readable while skin, damp hair, and background dissolve into shallow haze.",
      styling: "Use neutral wet fabric, natural skin, fine condensation, relaxed posture, and no accessories.",
      energy: "Feel intimate and warm but restrained, like a post-shower pause.",
    },
    {
      label: "haze around shoulder",
      scene: "Let steam veil the edge of the shoulder and hair while the bottle catches a subtle controlled highlight.",
      framing: "Use a tight vertical upper-body composition with bottle near neck or shoulder, never cropped.",
      styling: "Keep makeup invisible, droplets minimal, fabric ivory or muted green, and reflections physically believable.",
      energy: "Feel sensory and skin-close without becoming glossy or dramatic.",
    },
    {
      label: "soft condensation",
      scene: "Shift the moisture language to fine condensation and diffused warmth rather than visible dripping water.",
      framing: "Frame the hand lifting the bottle through haze with generous negative space and a no-direct-eye-contact expression.",
      styling: "Use damp hair falling naturally, neutral tones, clean skin, and no set dressing.",
      energy: "Feel quiet, private, and editorial.",
    },
  ],
  "dusk-skin-veil": [
    {
      label: "champagne teal split",
      scene: "Create an abstract dusk field where one side is champagne warm and the other falls into deep teal-gray shadow, no props or scenery.",
      framing: "Use a mid-to-close crop balancing skin profile, hand, and readable bottle near waist, thigh, neck, or collarbone.",
      styling: "Use neutral fabric, natural tousled hair, soft skin glow, and no direct eye contact.",
      energy: "Feel reflective, magnetic, and evening-led without looking like nightlife.",
    },
    {
      label: "last light turn-away",
      scene: "Turn the body slightly away from the warm edge light so the scene feels remembered rather than presented.",
      framing: "Place the bottle off-center and let the color gradient create emotional space around it.",
      styling: "Use ivory, champagne, blush, or muted green fabric, no jewelry, no heavy makeup, and realistic glass highlights.",
      energy: "Feel warm, sensual, and quiet, never exaggerated.",
    },
    {
      label: "teal-gray afterglow",
      scene: "Let the background become darker and cooler while a small gold highlight catches skin and cap or glass shoulder.",
      framing: "Use shallow depth of field, upper-body focus, and product at natural scale, not oversized.",
      styling: "Keep the scene object-free and let skin, fabric, and liquid tint carry the palette.",
      energy: "Feel cinematic, subdued, and premium.",
    },
  ],
  "mirror-pause": [
    {
      label: "angled reflection",
      scene: "Use an angled mirror or reflective wall suggestion with softened edges and no vanity clutter.",
      framing: "Show partial face or shoulder line, one hand, and the full readable bottle in the main plane so the label stays unwarped.",
      styling: "Use natural skin, neutral fabric, no jewelry emphasis, and gaze below or away from the reflection.",
      energy: "Feel self-contained, intimate, and editorial, not like a selfie.",
    },
    {
      label: "mirror bloom",
      scene: "Let diffused mirror bloom soften the background while the product remains crisp and accurate.",
      framing: "Place the reflection on one side and the bottle in the opposite middle third for visual tension.",
      styling: "Use soft grooming, damp or loosely falling hair, no patterns, and no visible props.",
      energy: "Feel quiet, private, and slightly melancholic.",
    },
    {
      label: "not looking back",
      scene: "Make the story about the model refusing direct eye contact, looking past the mirror or downward.",
      framing: "Use a close vertical portrait-product crop with collarbone, jawline, hand, and full bottle.",
      styling: "Keep makeup nearly invisible, palette neutral, and the reflection clean rather than decorative.",
      energy: "Feel restrained and emotionally magnetic.",
    },
  ],
  "midnight-balcony": [
    {
      label: "humid night edge",
      scene: "Place the model at an abstract night window or balcony edge with deep teal, charcoal, and amber blur, no skyline dominance.",
      framing: "Use a vertical mid shot or upper-body crop with the bottle held near wrist, thigh, waist, or collarbone.",
      styling: "Use black, ivory, champagne, or muted green simple fabric, damp or wind-soft hair, and natural skin.",
      energy: "Feel after-dark, intimate, airy, and restrained rather than club-like.",
    },
    {
      label: "single amber line",
      scene: "Let one warm edge light define skin, cap, and bottle shoulder against a dark quiet background.",
      framing: "Keep negative space around the subject and avoid a centered packshot composition.",
      styling: "Use no props, no neon, no nightlife cliches, and realistic low-light glass reflections.",
      energy: "Feel confident, humid, and cinematic.",
    },
    {
      label: "turned from city",
      scene: "Suggest Malaysian night air through softness and distance without showing landmarks or busy city detail.",
      framing: "Angle the subject away from camera, bottle clear in the middle third, face softened or partly out of frame.",
      styling: "Keep wardrobe minimal and neutral, skin gently sheened, and product at natural scale.",
      energy: "Feel private, nocturnal, and premium.",
    },
  ],
  "remembered-room": [
    {
      label: "quiet witness",
      scene: "Make the bottle feel like the trace left after a private moment, inside a nearly empty room with warm-cool light and no props.",
      framing: "Use product-led or partial-body vertical framing with generous negative space and the bottle fully visible.",
      styling: "If a model appears, limit the human cue to hand, shoulder, neck, or soft profile in neutral fabric.",
      energy: "Feel emotionally present, still, and memorable.",
    },
    {
      label: "fabric settling",
      scene: "Let one soft fabric plane settle behind or beside the product without turning it into a styled prop scene.",
      framing: "Use a close but uncropped bottle view with shallow focus and a changed focal distance from prior attempts.",
      styling: "Use warm-cool mixed light, clean shadow, and restrained texture with no extra objects.",
      energy: "Feel hushed, premium, and almost cinematic-still-life.",
    },
    {
      label: "empty room afterglow",
      scene: "Shift the frame emptier, with the bottle as the main emotional anchor and only a partial human trace if needed.",
      framing: "Place the bottle slightly off-center with a large quiet field of shadow or soft neutral wall.",
      styling: "Keep reflections realistic, label readable, product untouched, and colors muted.",
      energy: "Feel like radiance remembered, subtle and lingering.",
    },
  ],
  "nocturne-vanity": [
    {
      label: "mirror glow",
      scene: "Shift the vanity world toward a softly reflective mirror corner with candles pushed into the deep background and more breathing room around the bottle.",
      framing: "Use an off-center editorial crop with the bottle sitting in the lower-middle zone rather than the exact center.",
      styling: "Let jewelry become a subtle edge detail instead of a foreground hero prop, and let silk fall in long diagonal folds.",
      energy: "Feel intimate, cinematic, and quietly expensive rather than static showroom-perfect.",
    },
    {
      label: "bedside ritual",
      scene: "Reframe the bottle as part of a late-evening bedside ritual with one candle near frame edge, one folded silk layer, and a darker room behind.",
      framing: "Push the camera slightly lower so the bottle feels taller and more statuesque.",
      styling: "Make the prop story about personal ritual rather than jewelry display, using fewer objects and stronger negative space.",
      energy: "Feel more private and skin-close, like a scene caught between wear and memory.",
    },
    {
      label: "window drape",
      scene: "Place the bottle near sheer drapery with warm city glow bleeding in from outside instead of a fully enclosed vanity table.",
      framing: "Use a taller vertical crop with more negative space above and beside the bottle for a campaign-like silhouette.",
      styling: "Keep the tray secondary and let soft fabric motion and light gradients do more of the visual work.",
      energy: "Feel airy, luminous, and slightly more fashion-editorial.",
    },
    {
      label: "jewelry tray close-up",
      scene: "Build the scene around a luxury tray detail with tighter intimacy and closer candle reflections in the glass.",
      framing: "Come in for a closer product crop while still keeping the full bottle visible and uncropped.",
      styling: "Use rings or chain details as tiny glitter accents instead of a repeated tray-and-silk layout.",
      energy: "Feel richer and more tactile, with denser highlights and stronger macro polish.",
    },
  ],
  "after-dark-tailoring": [
    {
      label: "cuff and collar",
      scene: "Move the product into a sharper tailoring vignette with cuff detail, folded shirt structure, and a cleaner background plane.",
      framing: "Use a low, masculine three-quarter angle rather than a straight-on centered shelf shot.",
      styling: "Keep props precise and sparse, focusing on cloth lines and polished metal rather than broad tabletop clutter.",
      energy: "Feel disciplined, nocturnal, and composed.",
    },
    {
      label: "desk after midnight",
      scene: "Shift toward an after-hours executive desk scene with controlled city bokeh and a cleaner architectural backdrop.",
      framing: "Place the bottle slightly off-center with a stronger horizon or desk-edge line cutting across the lower frame.",
      styling: "Use one strong masculine object only, such as a pen, watch, or key, instead of a full prop set.",
      energy: "Feel colder, cleaner, and more strategic.",
    },
    {
      label: "stone and shadow",
      scene: "Use a darker stone surface with a narrow slice of amber edge light and more negative shadow mass around the bottle.",
      framing: "Let the frame breathe wider so the bottle owns a pool of light inside a darker environment.",
      styling: "Strip away busy details and let surface, shadow, and glass weight carry the composition.",
      energy: "Feel minimal, architectural, and high-end.",
    },
  ],
  "influencer-lifestyle": [
    {
      label: "cafe check-in",
      scene: "Stage the product in a premium Malaysian cafe moment with a believable table setting and natural lifestyle posture.",
      framing: "Use a more candid creator framing, as if captured mid-moment instead of a locked studio pose.",
      styling: "Let the product remain the hero while the human presence feels natural and not over-staged.",
      energy: "Feel contemporary, save-worthy, and social-native.",
    },
    {
      label: "vanity selfie world",
      scene: "Shift into a condo vanity or getting-ready scene with soft personal luxury cues and believable creator intimacy.",
      framing: "Use a closer, more portrait-led composition while keeping the product fully legible.",
      styling: "Use softer glam details and cleaner skin-light rather than heavy props.",
      energy: "Feel warm, aspirational, and personal.",
    },
    {
      label: "boutique corridor",
      scene: "Place the product in a premium boutique or mall corridor mood with local Malaysian retail cues and controlled movement.",
      framing: "Use a more dynamic vertical composition with the subject and bottle interacting across depth, not just head-on.",
      styling: "Keep the environment real and premium, avoiding generic influencer apartment repetition.",
      energy: "Feel polished, mobile, and public-facing.",
    },
  ],
  "scent-ingredients": [
    {
      label: "ingredient halo",
      scene: "Arrange the notes in a looser halo around the bottle instead of a flat front-facing lineup.",
      framing: "Use a cleaner overhead-to-three-quarter compromise rather than a default straight-on table view.",
      styling: "Let only the most relevant ingredients show, with more breathing room and fewer repeated citrus slices or flowers.",
      energy: "Feel controlled, elevated, and more gallery-like.",
    },
    {
      label: "material study",
      scene: "Make the frame read like a luxury material study, where the notes are implied through fragments and textures rather than obvious full ingredients.",
      framing: "Use a tighter crop and stronger directional lighting to highlight glass, liquid, and selected ingredients.",
      styling: "Avoid cookbook literalness and make the objects feel expensive and restrained.",
      energy: "Feel intelligent, tactile, and premium.",
    },
    {
      label: "editorial table spread",
      scene: "Spread the notes further out with a stronger sense of editorial layout and more intentional negative space.",
      framing: "Use a slightly wider composition with asymmetry rather than a centered catalog arrangement.",
      styling: "Choose one hero ingredient and let the others play supporting roles.",
      energy: "Feel expressive and art-directed without becoming busy.",
    },
  ],
  "booth-glow": [
    {
      label: "sampling counter",
      scene: "Lean into a premium sampling counter with scent strips and tester cues rather than a generic product pedestal.",
      framing: "Use a shopper-eye perspective with stronger depth and clearer retail conversion cues.",
      styling: "Let signage and props stay minimal, with the product still carrying the frame.",
      energy: "Feel warm, inviting, and conversion-ready.",
    },
    {
      label: "pop-up spotlight",
      scene: "Treat the booth like a premium pop-up spotlight moment with a cleaner branded backdrop and one bright invitation zone.",
      framing: "Use a more poster-like vertical composition with room for headlines or QR overlays.",
      styling: "Keep the merchandising sparse and intentional, not crowded or market-stall-like.",
      energy: "Feel elevated, event-ready, and premium retail.",
    },
    {
      label: "counter discovery",
      scene: "Show a discovery moment at the counter with subtle hands, strips, or testers implying engagement.",
      framing: "Use a slight diagonal angle rather than a head-on static product hero.",
      styling: "Keep the human cue restrained so the bottle still dominates.",
      energy: "Feel alive and shopper-friendly.",
    },
  ],
  "gift-box-ritual": [
    {
      label: "unboxing quiet luxury",
      scene: "Center the composition around a refined unboxing ritual with soft ribbon movement and opened packaging details.",
      framing: "Use a three-quarter tabletop angle rather than a rigid top-down layout.",
      styling: "Make the gift elements feel tactile and premium, with fewer but better props.",
      energy: "Feel intimate, ceremonial, and polished.",
    },
    {
      label: "client gifting set",
      scene: "Shift toward a client-gifting presentation with note card, ribbon, and neat arrangement precision.",
      framing: "Use a cleaner commerce-editorial framing with more room for copy and message placement.",
      styling: "Keep the festive cues subtle and premium, not seasonal or decorative-heavy.",
      energy: "Feel thoughtful, elevated, and corporate-luxury friendly.",
    },
    {
      label: "ribbon and card detail",
      scene: "Let the gift card and ribbon details play a stronger role while the product stays fully visible and hero-led.",
      framing: "Use a closer crop with richer texture detail and a more tactile sense of gift materials.",
      styling: "Reduce box clutter and focus on two or three precise gift cues only.",
      energy: "Feel elegant, soft, and giftable.",
    },
  ],
};

const fallbackVariationPacks: VariationPack[] = [
  {
    label: "fresh angle shift",
    scene: "Keep the same TARA product rules but rebuild the scene with a new light direction, cleaner negative space, and no repeated set arrangement.",
    framing: "Change the camera height, product placement, and crop from the previous attempt while keeping the bottle fully visible.",
    styling: "Use fewer objects, more refined material language, and a distinct palette balance from the last render.",
    energy: "Feel new, premium, and intentional rather than a minor remix.",
  },
  {
    label: "new gesture and light",
    scene: "If a person appears, change the gesture and body angle; if product-only, change the surface, horizon line, and shadow mass.",
    framing: "Move from centered product logic to off-center editorial balance or from close crop to a wider breathing frame.",
    styling: "Keep TARA colors and product identity exact, but vary fabric, reflection, and background gradient language.",
    energy: "Feel materially different while staying inside the brand world.",
  },
  {
    label: "quiet reset",
    scene: "Strip the composition down and let a single emotional cue, surface, or light event drive the image.",
    framing: "Use shallow depth of field and a fresh focal distance, never a duplicated pose, table setup, or bottle arrangement.",
    styling: "Remove visual noise and use skin, glass, shadow, or one texture as the main storytelling device.",
    energy: "Feel refined, memorable, and not similar to the previous output.",
  },
];

function getImageMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

function imageSizeForRequest(request: CreativeRequest) {
  return getAspectProfile(request.aspectPreset).size;
}

function imageQualityForRequest(request: CreativeRequest) {
  return getUpscaleProfile(request.upscaleMode).quality;
}

function isImageDataUrl(value: string) {
  return /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

function stripQueryFromAssetPath(assetPath: string) {
  return assetPath.split("?")[0] ?? assetPath;
}

async function getProductReferences(slug: string): Promise<ReferenceImage[]> {
  const imageUrls =
    slug === ALL_SCENTS_SLUG ? getAllProductImageUrls() : getProductImageUrls(slug);

  const references = await Promise.all(
    imageUrls
      .filter((imageUrl) => imageUrl.startsWith("/"))
      .map(async (imageUrl) => {
        const filePath = path.join(
          process.cwd(),
          "public",
          stripQueryFromAssetPath(imageUrl).replace(/^\//, ""),
        );
        const bytes = await readFile(filePath);
        const mimeType = getImageMimeType(filePath);

        return {
          dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
          fileName: path.basename(filePath),
          mimeType,
          label:
            slug === ALL_SCENTS_SLUG
              ? "Saved POS product photos for Aureya, Zephyr, and Maris"
              : "Saved POS product photo",
          source: "product" as const,
        };
      }),
  );

  return references;
}

function getUploadedReference(input: UploadedReferenceInput | null | undefined): ReferenceImage | null {
  const dataUrl = input?.dataUrl?.trim();

  if (!dataUrl) {
    return null;
  }

  if (!isImageDataUrl(dataUrl)) {
    throw new Error("Uploaded reference must be an image file.");
  }

  return {
    dataUrl,
    fileName: input?.fileName?.trim() || "uploaded-reference.png",
    mimeType: input?.mimeType?.trim() || "image/png",
    label: "Uploaded content photo",
    source: "uploaded",
  };
}

function referenceLabelFor(productReferences: ReferenceImage[], uploadedReference: ReferenceImage | null) {
  if (productReferences.length && uploadedReference) {
    return productReferences.length > 3
      ? "Saved POS product photos for all 3 scents + trio lineup reference + uploaded content photo"
      : productReferences.length > 1
        ? "Saved POS product photos for all 3 scents + uploaded content photo"
      : "Saved POS product photo + uploaded content photo";
  }

  if (uploadedReference) {
    return uploadedReference.label;
  }

  if (productReferences.length) {
    return productReferences.length > 3
      ? "Saved POS product photos for all 3 scents + trio lineup reference"
      : (productReferences[0]?.label ?? "Saved POS product photo");
  }

  return "Prompt only";
}

function shouldForceSingleFrame(request: CreativeRequest) {
  return (
    request.format === "story-reel" ||
    request.format === "image-to-video" ||
    request.aspectPreset === "tiktok" ||
    request.aspectPreset === "instagram-story"
  );
}

function getVariationPack(request: CreativeRequest, variationIndex: number) {
  const packs = variationPacksByPreset[request.preset] ?? fallbackVariationPacks;
  const normalizedIndex = Number.isFinite(variationIndex) ? Math.max(0, variationIndex) : 0;
  const fallback = fallbackVariationPacks[0];

  if (!fallback) {
    throw new Error("Creative image variation packs are not configured.");
  }

  return packs[normalizedIndex % packs.length] ?? fallback;
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          message:
            "Image rendering is not connected yet. Add OPENAI_API_KEY to tara-pos/.env.local, then restart the dev server.",
        },
        { status: 501 },
      );
    }

    const body = (await request.json()) as CreativeImageRouteBody;
    const requestedVariationIndex = body.variationIndex;
    const variationIndex =
      typeof requestedVariationIndex === "number" && Number.isFinite(requestedVariationIndex)
        ? Math.max(0, Math.trunc(requestedVariationIndex))
        : Date.now();
    const renderAttemptNumber =
      typeof requestedVariationIndex === "number" && Number.isFinite(requestedVariationIndex)
        ? variationIndex + 1
        : 1;
    const creativeRequest = normalizeCreativeRequest({
      ...body,
      variationIndex,
    });
    const brief = buildCreativeBrief(creativeRequest);
    const variationPack = getVariationPack(creativeRequest, variationIndex);
    const freshnessCue = getCreativeVariationCue(creativeRequest.preset, variationIndex);

    if (creativeRequest.workflow === "midjourney-handoff") {
      return NextResponse.json(
        {
          brief,
          message:
            "This brief is set to Midjourney handoff only. Copy the Midjourney pack from the Creative Studio or switch the workflow to Hybrid precision or Render in TARA.",
        },
        { status: 409 },
      );
    }

    const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5";
    const size = imageSizeForRequest(creativeRequest);
    const quality = imageQualityForRequest(creativeRequest);
    const productReferences = await getProductReferences(creativeRequest.scentSlug);
    const uploadedReference = getUploadedReference(body.uploadedReference);
    const referenceImages = [...productReferences, uploadedReference].filter(
      Boolean,
    ) as ReferenceImage[];
    const singleFrameRule = shouldForceSingleFrame(creativeRequest)
      ? "Generate exactly one single vertical hero image. Do not return a collage, diptych, grid, storyboard, tiled layout, contact sheet, split-screen, or multiple frames in one canvas."
      : null;

    const prompt = [
      `Fresh creative direction for render attempt ${renderAttemptNumber}: ${variationPack.label}.`,
      productReferences.length > 3
        ? "Use the first three reference images as the exact TARA product identity references for Aureya, Zephyr, and Maris. Use the fourth reference image as the trio lineup composition reference. Preserve each bottle precisely and include all three together in one balanced composition."
        : productReferences.length > 1
        ? "Use the first three reference images as the exact TARA product identity references for Aureya, Zephyr, and Maris. Preserve each bottle precisely and include all three together in one balanced composition."
        : productReferences[0]
          ? "Use the first reference image as the exact TARA product identity reference and preserve it precisely."
        : "No saved POS product image is available, so rely on the remaining references and the prompt for product styling.",
      uploadedReference
        ? productReferences.length
          ? productReferences.length > 3
            ? "Use the uploaded content reference as extra direction for scene, framing, creator styling, props, or lighting while using the saved trio lineup reference to guide the overall three-bottle composition without changing any product identity."
            : productReferences.length > 1
            ? "Use the uploaded content reference as extra direction for scene, framing, creator styling, props, or lighting without changing any of the three product identities."
            : "Use the second reference image as extra content direction for scene, framing, creator styling, props, or lighting without changing the product identity."
          : "Use the uploaded content photo as the main visual reference while keeping the product premium and believable."
        : productReferences.length > 3
          ? "No uploaded content reference was provided, so continue with the saved POS product photos for Aureya, Zephyr, and Maris plus the saved trio lineup composition reference."
          : productReferences.length > 1
          ? "No uploaded content reference was provided, so continue with the saved POS product photos for Aureya, Zephyr, and Maris."
          : "No uploaded content reference was provided, so continue with the saved POS product photo when available.",
      productReferences.length > 1
        ? "The generated content may change the scene, lighting, model, pose, and environment, but Aureya, Zephyr, and Maris must each remain visually identical to their TARA reference image and appear only once."
        : "The generated content may change the scene, lighting, model, pose, and environment, but the actual product must remain visually identical to the TARA reference whenever a POS product photo is present.",
      "Make this output materially different from previous generations under the same preset while staying on-brand and product-accurate.",
      `Anti-repetition cue: ${freshnessCue.label}. ${freshnessCue.storyBeat}. ${freshnessCue.compositionShift}. ${freshnessCue.materialShift}. ${freshnessCue.antiRepeatRule}.`,
      variationPack.scene,
      variationPack.framing,
      variationPack.styling,
      variationPack.energy,
      singleFrameRule,
      `Output quality: ${brief.strategy.upscaleLabel}.`,
      brief.imagePrompt,
      `Compose the frame for ${brief.strategy.aspectLabel} (${brief.strategy.aspectRatio}) using the ${size} canvas with crop-safe margins.`,
    ]
      .filter(Boolean)
      .join(" ");

    const endpoint = referenceImages.length
      ? "https://api.openai.com/v1/images/edits"
      : "https://api.openai.com/v1/images/generations";

    const openAiBody = referenceImages.length
      ? {
          model,
          prompt,
          images: referenceImages.map((image) => ({
            image_url: image.dataUrl,
          })),
          input_fidelity: "high",
          size,
          quality,
          background: "opaque",
          output_format: "png",
        }
      : {
          model,
          prompt,
          size,
          quality,
          background: "opaque",
          output_format: "png",
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(openAiBody),
    });

    const result = (await response.json()) as OpenAIImageResponse;

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            result.error?.message ??
            "The image model could not create this asset. Try a simpler prompt.",
        },
        { status: response.status },
      );
    }

    const b64Json = result.data?.[0]?.b64_json;

    if (!b64Json) {
      return NextResponse.json(
        { message: "The image model returned no image data." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      brief,
      image: {
        dataUrl: `data:image/png;base64,${b64Json}`,
        model,
        size,
        sourceReferenceLabel: referenceLabelFor(productReferences, uploadedReference),
        revisedPrompt: result.data?.[0]?.revised_prompt ?? null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "The image renderer could not create this asset.",
      },
      { status: 500 },
    );
  }
}
