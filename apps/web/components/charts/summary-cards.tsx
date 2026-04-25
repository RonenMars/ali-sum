import { KpiCard } from "@/components/ui/kpi-card";
import { formatAmount } from "@/lib/format";

interface SummaryCardsProps {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  totalItems: number;
  currency: string;
  spendingTrend?: number[];
}

const FALLBACK_TREND = [12, 18, 14, 22, 20, 28, 26, 34];

export function SummaryCards({
  totalSpent,
  totalOrders,
  avgOrderValue,
  totalItems,
  currency,
  spendingTrend,
}: SummaryCardsProps) {
  const trend = spendingTrend && spendingTrend.length > 1 ? spendingTrend : FALLBACK_TREND;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        eyebrow="Total Spent"
        value={formatAmount(totalSpent, currency)}
        sparkline={trend}
        variant="hero"
        className="lg:col-span-1"
      />
      <KpiCard
        eyebrow="Total Orders"
        value={totalOrders.toLocaleString()}
        sparkline={trend}
      />
      <KpiCard
        eyebrow="Avg Order Value"
        value={formatAmount(avgOrderValue, currency)}
        sparkline={trend}
      />
      <KpiCard
        eyebrow="Items Purchased"
        value={totalItems.toLocaleString()}
        sparkline={trend}
      />
    </div>
  );
}
