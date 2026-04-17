"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Hardcoded oklch-equivalent colors for SVG attribute compatibility
const BRAND_ORANGE = "oklch(0.62 0.21 28)";
const MUTED_TEXT = "oklch(0.556 0 0)";

interface SpendingChartProps {
  data: { period: string; amount: number; orderCount: number }[];
  currency?: string;
}

export function SpendingChart({ data, currency = "USD" }: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No spending data yet. Sync your orders to see analytics.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BRAND_ORANGE} stopOpacity={0.25} />
            <stop offset="95%" stopColor={BRAND_ORANGE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" />
        <XAxis
          dataKey="period"
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
              maximumFractionDigits: 0,
            }).format(Number(v))
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            color: "var(--color-popover-foreground)",
            fontSize: "13px",
          }}
          formatter={(value) => [
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(Number(value)),
            "Spent",
          ]}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={BRAND_ORANGE}
          fill="url(#spendingGradient)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: BRAND_ORANGE }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
