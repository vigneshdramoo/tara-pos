import { NextResponse } from "next/server";
import { buildAssistantReply } from "@/lib/assistant";
import { hasValue } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { prompt?: string };

    if (!hasValue(body.prompt)) {
      return NextResponse.json(
        { message: "Please enter a prompt for the assistant." },
        { status: 400 },
      );
    }

    const reply = await buildAssistantReply(body.prompt!.trim());
    return NextResponse.json(reply);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "The assistant could not build a response." },
      { status: 500 },
    );
  }
}
