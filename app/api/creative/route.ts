import { NextResponse } from "next/server";
import {
  buildCreativeBrief,
  normalizeCreativeRequest,
  type CreativeRequest,
} from "@/lib/creative-model";

export const preferredRegion = "sin1";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const requestedVariationIndex = body.variationIndex;
    const creativeRequest = normalizeCreativeRequest(
      {
        ...body,
        variationIndex:
          typeof requestedVariationIndex === "number" && Number.isFinite(requestedVariationIndex)
            ? requestedVariationIndex
            : Date.now(),
      } as Partial<CreativeRequest>,
    );
    const brief = buildCreativeBrief(creativeRequest);

    return NextResponse.json(brief);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "The creative model could not build this content brief." },
      { status: 500 },
    );
  }
}
