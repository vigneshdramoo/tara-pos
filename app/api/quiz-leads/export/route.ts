import { NextResponse } from "next/server";
import { getLeadSourceLabel, getPurchaseIntentLabel, getScentMatchLabel } from "@/lib/lead-options";
import { describeDatabaseIssue, requirePrisma } from "@/lib/prisma";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const prisma = requirePrisma();
    const leads = await prisma.quizLead.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        convertedCustomer: {
          select: {
            name: true,
          },
        },
      },
    });

    const headers = [
      "Lead Number",
      "Created At",
      "Name",
      "Email",
      "Phone",
      "Age Range",
      "Gender / Identity",
      "City",
      "Event",
      "Source",
      "Result Scent",
      "Secondary Scent",
      "Purchase Intent",
      "Marketing Consent",
      "Converted Customer",
      "Notes",
    ];

    const rows = leads.map((lead) => [
      lead.leadNumber,
      lead.createdAt.toISOString(),
      lead.name,
      lead.email,
      lead.phone,
      lead.ageRange,
      lead.genderIdentity,
      lead.city,
      lead.eventName,
      getLeadSourceLabel(lead.source),
      getScentMatchLabel(lead.resultScent),
      getScentMatchLabel(lead.secondaryScent),
      getPurchaseIntentLabel(lead.purchaseIntent),
      lead.marketingConsent ? "Yes" : "No",
      lead.convertedCustomer?.name ?? "",
      lead.notes,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tara-quiz-leads-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[quiz-leads:export]", error);

    const databaseIssue = describeDatabaseIssue(error);
    return NextResponse.json(
      { message: databaseIssue ?? "Lead export failed. Please try again." },
      { status: databaseIssue ? 503 : 500 },
    );
  }
}
