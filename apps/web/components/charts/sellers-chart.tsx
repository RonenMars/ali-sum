"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BRAND_ORANGE = "oklch(0.62 0.21 28)";
const MUTED_TEXT = "oklch(0.556 0 0)";

interface SellersChartProps {
  data: { name: string; totalSpent: number; orderCount: number }[];
  currency?: string;
}

export function SellersChart({ data, currency = "USD" }: SellersChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No seller data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" horizontal={false} />
        <XAxis
          type="number"
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
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            color: "var(--color-popover-foreground)",
            fontSize: "13px",
          }}
          cursor={{ fill: "oklch(0.97 0 0)" }}
          formatter={(value) => [
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency,
            }).format(Number(value)),
            "Total Spent",
          ]}
        />
        <Bar
          dataKey="totalSpent"
          fill={BRAND_ORANGE}
          radius={[0, 6, 6, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
