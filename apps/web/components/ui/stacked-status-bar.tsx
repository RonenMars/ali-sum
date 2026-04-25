import * as React from "react";

import { cn } from "@/lib/utils";

export interface StackedSegment {
  key: string;
  label: string;
  count: number;
  /** Tailwind background class — e.g. "bg-[color:var(--positive)]". */
  colorClass: string;
}

interface StackedStatusBarProps {
  total: number;
  totalLabel?: string;
  segments: StackedSegment[];
  className?: string;
}

/**
 * Big-number header + 28px horizontal stacked progress bar + 2-col legend
 * of color-coded counts. Surfaces shipping status at a glance.
 */
export function StackedStatusBar({
  total,
  totalLabel = "active orders",
  segments,
  className,
}: StackedStatusBarProps) {
  const visible = segments.filter((s) => s.count > 0);
  const safeTotal = visible.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-3xl font-semibold tabular-nums">{total}</span>
        <span className="text-sm text-muted-foreground">{totalLabel}</span>
      </div>

      <div className="flex h-7 w-full overflow-hidden rounded-full bg-muted">
        {visible.map((segment) => {
          const pct = (segment.count / safeTotal) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={segment.key}
              className={cn("h-full", segment.colorClass)}
              style={{ width: `${pct}%` }}
              title={`${segment.label}: ${segment.count}`}
            />
          );
        })}
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2">
            <span
              className={cn("size-2 shrink-0 rounded-full", segment.colorClass)}
              aria-hidden
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-medium tabular-nums">{segment.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
