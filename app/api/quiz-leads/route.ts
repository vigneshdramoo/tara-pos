import { Prisma, PurchaseIntent, QuizLeadSource } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  describeDatabaseIssue,
  requirePrisma,
} from "@/lib/prisma";
import { getMalaysiaTimestamp } from "@/lib/time";

const allowedScentMatches = new Set(["aureya", "zephyr", "maris", "discovery-pack"]);

class QuizLeadError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function normalizeText(value: unknown, maxLength = 180) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function normalizeEmail(value: unknown) {
  const email = normalizeText(value, 160)?.toLowerCase() ?? null;
  if (!email) return null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new QuizLeadError("Enter a valid email or leave it blank.", 400);
  }

  return email;
}

function normalizePhone(value: unknown) {
  const phone = normalizeText(value, 40);
  return phone?.replace(/[^\d+]/g, "") || null;
}

function normalizeEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
  fallback: T[keyof T],
) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return (Object.values(enumObject) as string[]).includes(candidate)
    ? (candidate as T[keyof T])
    : fallback;
}

function normalizeJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return value as Prisma.InputJsonValue;
}

function buildLeadNumber() {
  const stamp = getMalaysiaTimestamp();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LEAD-${stamp}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          name?: unknown;
          email?: unknown;
          phone?: unknown;
          ageRange?: unknown;
          genderIdentity?: unknown;
          city?: unknown;
          eventName?: unknown;
          source?: unknown;
          resultScent?: unknown;
          secondaryScent?: unknown;
          purchaseIntent?: unknown;
          marketingConsent?: unknown;
          answers?: unknown;
          scores?: unknown;
          notes?: unknown;
        }
      | null;

    if (!body) {
      throw new QuizLeadError("Lead details are missing.", 400);
    }

    const resultScent = normalizeText(body.resultScent, 60);
    if (!resultScent || !allowedScentMatches.has(resultScent)) {
      throw new QuizLeadError("Choose a valid scent result before saving the lead.", 400);
    }

    const secondaryScent = normalizeText(body.secondaryScent, 60);
    const name = normalizeText(body.name, 120);
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const prisma = requirePrisma();

    const existingCustomer = phone
      ? await prisma.customer.findUnique({ where: { phone } })
      : email
        ? await prisma.customer.findUnique({ where: { email } })
        : null;

    const lead = await prisma.quizLead.create({
      data: {
        leadNumber: buildLeadNumber(),
        name,
        email,
        phone,
        ageRange: normalizeText(body.ageRange, 40),
        genderIdentity: normalizeText(body.genderIdentity, 80),
        city: normalizeText(body.city, 90),
        eventName: normalizeText(body.eventName, 120) ?? "Popup booth",
        source: normalizeEnumValue(QuizLeadSource, body.source, QuizLeadSource.POPUP_BOOTH),
        resultScent,
        secondaryScent:
          secondaryScent && allowedScentMatches.has(secondaryScent) ? secondaryScent : null,
        purchaseIntent: normalizeEnumValue(
          PurchaseIntent,
          body.purchaseIntent,
          PurchaseIntent.JUST_EXPLORING,
        ),
        marketingConsent: body.marketingConsent === true,
        answers: normalizeJson(body.answers),
        scores: normalizeJson(body.scores),
        notes: normalizeText(body.notes, 600),
        convertedCustomerId: existingCustomer?.id,
      },
    });

    revalidatePath("/leads");
    revalidatePath("/customers");
    revalidatePath("/assistant");

    return NextResponse.json({
      success: true,
      leadNumber: lead.leadNumber,
      message: `Lead ${lead.leadNumber} saved.`,
    });
  } catch (error) {
    console.error("[quiz-leads:create]", error);

    if (error instanceof QuizLeadError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    const databaseIssue = describeDatabaseIssue(error);
    if (databaseIssue) {
      return NextResponse.json({ message: databaseIssue }, { status: 503 });
    }

    return NextResponse.json(
      { message: "Lead capture failed. Please try again." },
      { status: 500 },
    );
  }
}
