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

const CHART_BLUE = "oklch(0.55 0.19 260)";
const MUTED_TEXT = "oklch(0.556 0 0)";

interface DeliveryTimelineChartProps {
  data: { week: string; count: number }[];
}

export function DeliveryTimelineChart({ data }: DeliveryTimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No upcoming deliveries in this range.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.922 0 0)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: MUTED_TEXT, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
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
            `${value} package${value !== 1 ? "s" : ""}`,
            "Expected",
          ]}
        />
        <Bar
          dataKey="count"
          fill={CHART_BLUE}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
