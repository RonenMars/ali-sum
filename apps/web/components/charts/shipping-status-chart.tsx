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
  "In Transit": "var(--primary)",
  "Delivered": "var(--positive)",
  "Pending / Processing": "var(--warning)",
  "Other": "var(--info)",
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
            backgroundColor: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            color: "var(--popover-foreground)",
            fontSize: "13px",
          }}
          labelStyle={{ color: "var(--muted-foreground)" }}
          itemStyle={{ color: "var(--foreground)" }}
          formatter={(value, name) => [
            `${value} order${value !== 1 ? "s" : ""}`,
            name,
          ]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
