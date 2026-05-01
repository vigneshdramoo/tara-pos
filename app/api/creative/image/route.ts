import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  ALL_SCENTS_SLUG,
  buildCreativeBrief,
  getAspectProfile,
  getUpscaleProfile,
  normalizeCreativeRequest,
  type CreativeRequest,
} from "@/lib/creative-model";
import { getAllProductImageUrls, getProductImageUrls } from "@/lib/product-media";

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

const variationPacksByPreset: Record<CreativeRequest["preset"], VariationPack[]> = {
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

async function getProductReferences(slug: string): Promise<ReferenceImage[]> {
  const imageUrls =
    slug === ALL_SCENTS_SLUG ? getAllProductImageUrls() : getProductImageUrls(slug);

  const references = await Promise.all(
    imageUrls
      .filter((imageUrl) => imageUrl.startsWith("/"))
      .map(async (imageUrl) => {
        const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
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
    return productReferences.length > 1
      ? "Saved POS product photos for all 3 scents + uploaded content photo"
      : "Saved POS product photo + uploaded content photo";
  }

  if (uploadedReference) {
    return uploadedReference.label;
  }

  if (productReferences.length) {
    return productReferences[0]?.label ?? "Saved POS product photo";
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
  const packs = variationPacksByPreset[request.preset];
  const normalizedIndex = Number.isFinite(variationIndex) ? Math.max(0, variationIndex) : 0;

  return packs[normalizedIndex % packs.length];
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
    const creativeRequest = normalizeCreativeRequest(body);
    const brief = buildCreativeBrief(creativeRequest);
    const variationIndex = Math.max(0, Math.trunc(body.variationIndex ?? 0));
    const variationPack = getVariationPack(creativeRequest, variationIndex);

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
      `Fresh creative direction for render attempt ${variationIndex + 1}: ${variationPack.label}.`,
      productReferences.length > 1
        ? "Use the first three reference images as the exact TARA product identity references for Aureya, Zephyr, and Maris. Preserve each bottle precisely and include all three together in one balanced composition."
        : productReferences[0]
          ? "Use the first reference image as the exact TARA product identity reference and preserve it precisely."
        : "No saved POS product image is available, so rely on the remaining references and the prompt for product styling.",
      uploadedReference
        ? productReferences.length
          ? productReferences.length > 1
            ? "Use the uploaded content reference as extra direction for scene, framing, creator styling, props, or lighting without changing any of the three product identities."
            : "Use the second reference image as extra content direction for scene, framing, creator styling, props, or lighting without changing the product identity."
          : "Use the uploaded content photo as the main visual reference while keeping the product premium and believable."
        : productReferences.length > 1
          ? "No uploaded content reference was provided, so continue with the saved POS product photos for Aureya, Zephyr, and Maris."
          : "No uploaded content reference was provided, so continue with the saved POS product photo when available.",
      productReferences.length > 1
        ? "The generated content may change the scene, lighting, model, pose, and environment, but Aureya, Zephyr, and Maris must each remain visually identical to their TARA reference image and appear only once."
        : "The generated content may change the scene, lighting, model, pose, and environment, but the actual product must remain visually identical to the TARA reference whenever a POS product photo is present.",
      "Make this output materially different from previous generations under the same preset while staying on-brand and product-accurate.",
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
