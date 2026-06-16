import { LowStockList } from "@/components/dashboard/low-stock-list";
import { PromotionWatch } from "@/components/dashboard/promotion-watch";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { SalesTrend } from "@/components/dashboard/sales-trend";
import { StatCard } from "@/components/dashboard/stat-card";
import { Stop04Progress } from "@/components/dashboard/stop04-progress";
import { TopProducts } from "@/components/dashboard/top-products";
import { PageIntro } from "@/components/page-intro";
import { StatusNotice } from "@/components/ui/status-notice";
import { formatTimeOnly } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function Home() {
  const dashboard = await getDashboardData();
  const refreshedAt = formatTimeOnly(new Date());

  return (
    <>
      <PageIntro
        eyebrow="Daily trading"
        title="Boutique command center"
        description="Track today’s revenue, watch what is moving on the fragrance floor, and catch low-stock risks before they disrupt the selling rhythm."
        actions={
          <div className="tara-card-soft rounded-[22px] border border-[var(--line)] px-4 py-3 text-sm">
            <p className="font-semibold text-[var(--brand-midnight)]">System online</p>
            <p className="mt-1 text-[var(--muted)]">Last refresh {refreshedAt} GMT+8</p>
          </div>
        }
      />

      {dashboard.databaseIssue ? <StatusNotice message={dashboard.databaseIssue} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </section>

      <Stop04Progress progress={dashboard.stop04Progress} />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SalesTrend points={dashboard.salesTrend} />
        <div className="grid gap-4">
          <LowStockList items={dashboard.lowStockProducts} />
          <PromotionWatch items={dashboard.promotionInsights} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TopProducts items={dashboard.topProducts} />
        <RecentOrders orders={dashboard.recentOrders} />
      </section>
    </>
  );
}
