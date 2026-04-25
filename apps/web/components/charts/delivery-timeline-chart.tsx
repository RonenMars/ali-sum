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
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--popover-foreground)",
            fontSize: "13px",
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
          itemStyle={{ color: "var(--foreground)" }}
          cursor={{ fill: "var(--accent)", opacity: 0.4 }}
          formatter={(value) => [
            `${value} package${value !== 1 ? "s" : ""}`,
            "Expected",
          ]}
        />
        <Bar
          dataKey="count"
          fill="var(--primary)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
