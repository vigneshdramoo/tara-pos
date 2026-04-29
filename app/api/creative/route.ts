import { NextResponse } from "next/server";
import { buildCreativeBrief, normalizeCreativeRequest } from "@/lib/creative-model";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const creativeRequest = normalizeCreativeRequest(body);
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
