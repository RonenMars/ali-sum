import { KpiCard } from "@/components/ui/kpi-card";
import { formatAmount } from "@/lib/format";
import type { DeltaTone } from "@/components/ui/metric-delta";

interface SummaryCardsProps {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  totalItems: number;
  uniqueSellers: number;
  currency: string;
  /** Per-period values backing the hero bar sparkline (oldest → newest). */
  spendingTrend?: number[];
  /** Optional period-over-period delta chips for each KPI. */
  deltas?: {
    totalSpent?: { label: string; tone?: DeltaTone };
    totalOrders?: { label: string; tone?: DeltaTone };
    avgOrderValue?: { label: string; tone?: DeltaTone };
    totalItems?: { label: string; tone?: DeltaTone };
  };
}

const FALLBACK_TREND = [12, 18, 14, 22, 20, 28, 26, 34];

/**
 * Top-of-dashboard KPI strip: a hero "Total Spent" tile (left, 5/12 cols) +
 * a 2×2 grid of compact mini-KPIs (right, 7/12 cols).
 */
export function SummaryCards({
  totalSpent,
  totalOrders,
  avgOrderValue,
  totalItems,
  uniqueSellers,
  currency,
  spendingTrend,
  deltas,
}: SummaryCardsProps) {
  const trend =
    spendingTrend && spendingTrend.length > 1 ? spendingTrend : FALLBACK_TREND;

  return (
    <div className="grid grid-cols-12 gap-4 lg:gap-6">
      <div className="col-span-12 lg:col-span-5">
        <KpiCard
          eyebrow="Total Spent"
          value={formatAmount(totalSpent, currency)}
          sparkline={trend}
          delta={deltas?.totalSpent}
          variant="hero"
          className="h-full min-h-[260px]"
        />
      </div>
      <div className="col-span-12 grid grid-cols-2 gap-4 lg:col-span-7 lg:gap-6">
        <KpiCard
          eyebrow="Orders"
          value={totalOrders.toLocaleString()}
          delta={deltas?.totalOrders}
        />
        <KpiCard
          eyebrow="Avg Order"
          value={formatAmount(avgOrderValue, currency)}
          delta={deltas?.avgOrderValue}
        />
        <KpiCard
          eyebrow="Items"
          value={totalItems.toLocaleString()}
          delta={deltas?.totalItems}
        />
        <KpiCard
          eyebrow="Sellers"
          value={uniqueSellers.toLocaleString()}
        />
      </div>
    </div>
  );
}
