import { AssistantConsole } from "@/components/assistant/assistant-console";
import { PageIntro } from "@/components/page-intro";
import { Surface } from "@/components/ui/surface";
import { buildAssistantReply } from "@/lib/assistant";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const [dashboard, initialReply] = await Promise.all([
    getDashboardData(),
    buildAssistantReply("Summarize sales and suggest restocks."),
  ]);

  return (
    <>
      <PageIntro
        eyebrow="Local AI"
        title="Sales brief assistant"
        description="A store-side assistant that runs entirely on local sales and inventory data, helping staff summarize performance and spot restock moves without a cloud dependency."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Daily sales</p>
          <p className="mt-4 font-display text-5xl text-stone-950">{dashboard.stats[0]?.value}</p>
          <p className="mt-2 text-sm text-stone-600">{dashboard.stats[0]?.detail}</p>
        </Surface>
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Hero fragrance</p>
          <p className="mt-4 font-display text-4xl text-stone-950">
            {dashboard.topProducts[0]?.name ?? "No data yet"}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {dashboard.topProducts[0]
              ? `${dashboard.topProducts[0].quantitySold} units sold in the last 30 days`
              : "Make a few sales and the assistant will surface a leader."}
          </p>
        </Surface>
        <Surface>
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Restock exposure</p>
          <p className="mt-4 font-display text-5xl text-stone-950">
            {dashboard.lowStockProducts.length}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {dashboard.lowStockProducts.length
              ? `${dashboard.lowStockProducts[0].name} is the most urgent refill.`
              : "No current low-stock pressure across the assortment."}
          </p>
        </Surface>
      </section>

      <AssistantConsole
        initialReply={initialReply}
        quickPrompts={[
          "Summarize today's sales",
          "What should we restock next?",
          "Which perfumes are leading this month?",
          "Which scents are at risk of selling out?",
        ]}
      />
    </>
  );
}
