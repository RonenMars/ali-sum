"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ShippingStatusChartProps {
  data: { label: string; count: number }[];
}

const COLORS: Record<string, string> = {
  "In Transit": "hsl(239, 84%, 67%)",
  Delivered: "hsl(142, 71%, 45%)",
  "Pending / Processing": "hsl(38, 92%, 50%)",
  Other: "hsl(215, 14%, 60%)",
};

function getColor(label: string): string {
  return COLORS[label] ?? COLORS["Other"];
}

export function ShippingStatusChart({ data }: ShippingStatusChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
        No shipping data yet.
      </div>
    );
  }

  const filtered = data.filter((d) => d.count > 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={filtered}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {filtered.map((entry) => (
            <Cell key={entry.label} fill={getColor(entry.label)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value, name) => [
            `${value} order${value !== 1 ? "s" : ""}`,
            name,
          ]}
        />
        <Legend
          formatter={(value: string) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
