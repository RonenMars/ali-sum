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

const STATUS_COLORS: Record<string, string> = {
  "In Transit": "oklch(0.55 0.19 260)",
  "Delivered": "oklch(0.60 0.18 145)",
  "Pending / Processing": "oklch(0.75 0.17 75)",
  "Other": "oklch(0.65 0 0)",
};

function getColor(label: string): string {
  return STATUS_COLORS[label] ?? STATUS_COLORS["Other"];
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
          innerRadius={65}
          outerRadius={105}
          paddingAngle={3}
          strokeWidth={0}
        >
          {filtered.map((entry) => (
            <Cell key={entry.label} fill={getColor(entry.label)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            color: "var(--color-popover-foreground)",
            fontSize: "13px",
          }}
          formatter={(value, name) => [
            `${value} order${value !== 1 ? "s" : ""}`,
            name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ fontSize: "13px", color: "oklch(0.145 0 0)" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
