import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCreativeBrief,
  getAspectProfile,
  getUpscaleProfile,
  normalizeCreativeRequest,
  type CreativeRequest,
} from "@/lib/creative-model";
import { getProductImageUrl } from "@/lib/product-media";

type UploadedReferenceInput = {
  dataUrl?: string;
  fileName?: string;
  mimeType?: string;
};

type CreativeImageRouteBody = Partial<CreativeRequest> & {
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

async function getProductReference(slug: string): Promise<ReferenceImage | null> {
  const imageUrl = getProductImageUrl(slug);

  if (!imageUrl?.startsWith("/")) {
    return null;
  }

  const filePath = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  const bytes = await readFile(filePath);
  const mimeType = getImageMimeType(filePath);

  return {
    dataUrl: `data:${mimeType};base64,${bytes.toString("base64")}`,
    fileName: path.basename(filePath),
    mimeType,
    label: "Saved POS product photo",
    source: "product",
  };
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

function referenceLabelFor(productReference: ReferenceImage | null, uploadedReference: ReferenceImage | null) {
  if (productReference && uploadedReference) {
    return "Saved POS product photo + uploaded content photo";
  }

  if (uploadedReference) {
    return uploadedReference.label;
  }

  if (productReference) {
    return productReference.label;
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
    const productReference = await getProductReference(creativeRequest.scentSlug);
    const uploadedReference = getUploadedReference(body.uploadedReference);
    const referenceImages = [productReference, uploadedReference].filter(
      Boolean,
    ) as ReferenceImage[];
    const singleFrameRule = shouldForceSingleFrame(creativeRequest)
      ? "Generate exactly one single vertical hero image. Do not return a collage, diptych, grid, storyboard, tiled layout, contact sheet, split-screen, or multiple frames in one canvas."
      : null;

    const prompt = [
      productReference
        ? "Use the first reference image as the exact TARA product identity reference and preserve it precisely."
        : "No saved POS product image is available, so rely on the remaining references and the prompt for product styling.",
      uploadedReference
        ? productReference
          ? "Use the second reference image as extra content direction for scene, framing, creator styling, props, or lighting without changing the product identity."
          : "Use the uploaded content photo as the main visual reference while keeping the product premium and believable."
        : "No uploaded content reference was provided, so continue with the saved POS product photo when available.",
      "The generated content may change the scene, lighting, model, pose, and environment, but the actual product must remain visually identical to the TARA reference whenever a POS product photo is present.",
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
        sourceReferenceLabel: referenceLabelFor(productReference, uploadedReference),
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
