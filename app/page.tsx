import { LowStockList } from "@/components/dashboard/low-stock-list";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { SalesTrend } from "@/components/dashboard/sales-trend";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopProducts } from "@/components/dashboard/top-products";
import { PageIntro } from "@/components/page-intro";
import { StatusNotice } from "@/components/ui/status-notice";
import { getDashboardData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const dashboard = await getDashboardData();

  return (
    <>
      <PageIntro
        eyebrow="Daily trading"
        title="Boutique command center"
        description="Track today’s revenue, watch what is moving on the fragrance floor, and catch low-stock risks before they disrupt the selling rhythm."
        actions={
          <div className="rounded-[24px] bg-stone-950 px-5 py-4 text-sm font-medium text-stone-50">
            Premium iPad selling, protected online runtime
          </div>
        }
      />

      {dashboard.databaseIssue ? <StatusNotice message={dashboard.databaseIssue} /> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <SalesTrend points={dashboard.salesTrend} />
        <LowStockList items={dashboard.lowStockProducts} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <TopProducts items={dashboard.topProducts} />
        <RecentOrders orders={dashboard.recentOrders} />
      </section>
    </>
  );
}
