import { formatCurrency } from "@/lib/format";
import type { AssistantReply } from "@/lib/types";
import { getDashboardData } from "@/lib/queries";

function buildRestockLine(name: string, stock: number, recommended: number) {
  return `- ${name}: ${stock} left, add ${recommended} units to get back to a comfortable floor level.`;
}

export async function buildAssistantReply(prompt: string): Promise<AssistantReply> {
  const dashboard = await getDashboardData();
  const normalizedPrompt = prompt.trim().toLowerCase();
  const heroProduct = dashboard.topProducts[0];
  const restocks = dashboard.lowStockProducts.slice(0, 4);

  const overview = [
    `Today the boutique is sitting at ${dashboard.stats[0]?.value ?? formatCurrency(0)} in sales, with ${dashboard.stats[0]?.detail ?? "no completed orders yet"}.`,
    heroProduct
      ? `${heroProduct.name} is leading the floor with ${heroProduct.quantitySold} units sold in the last 30 days.`
      : "There is not enough sales history yet to identify a hero fragrance.",
    restocks.length
      ? `${restocks.length} fragrances are sitting at or below their floor threshold.`
      : "No fragrances are currently below their reorder threshold.",
  ];

  if (normalizedPrompt.includes("restock") || normalizedPrompt.includes("stock")) {
    return {
      prompt,
      reply: [
        "Restock recommendation",
        ...overview,
        "",
        "Priority queue",
        ...restocks.map((item) =>
          buildRestockLine(item.name, item.stock, item.recommendedRestock),
        ),
      ].join("\n"),
      restocks,
    };
  }

  if (
    normalizedPrompt.includes("top") ||
    normalizedPrompt.includes("best") ||
    normalizedPrompt.includes("hero")
  ) {
    return {
      prompt,
      reply: [
        "Sales leaders",
        ...overview,
        "",
        "Top products",
        ...dashboard.topProducts
          .slice(0, 3)
          .map(
            (item) =>
              `- ${item.name}: ${item.quantitySold} units sold, ${formatCurrency(item.revenueCents)} in revenue.`,
          ),
      ].join("\n"),
      restocks,
    };
  }

  return {
    prompt,
    reply: [
      "TARA sales brief",
      ...overview,
      "",
      "Suggested next move",
      restocks.length
        ? buildRestockLine(restocks[0].name, restocks[0].stock, restocks[0].recommendedRestock)
        : "- Inventory looks healthy enough to keep the focus on conversion and customer capture.",
    ].join("\n"),
    restocks,
  };
}
