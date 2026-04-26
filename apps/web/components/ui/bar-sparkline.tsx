import * as React from "react";

import { cn } from "@/lib/utils";

interface BarSparklineProps {
  data: number[];
  /** Height of the bar group in px. Defaults to 96. */
  height?: number;
  /** Min visible bar height as a fraction of `height` (0–1). */
  minHeight?: number;
  /** Tailwind color class for the bars. Defaults to violet primary. */
  colorClass?: string;
  className?: string;
}

/**
 * Vertical-bar trend chart used in the hero KPI tile. Bars share the same hue
 * but ramp opacity with value so the most recent peaks read as "hottest".
 */
export function BarSparkline({
  data,
  height = 96,
  minHeight = 0.18,
  colorClass = "bg-primary",
  className,
}: BarSparklineProps) {
  if (data.length === 0) {
    return null;
  }
  const max = Math.max(...data, 1);

  return (
    <div
      className={cn("flex items-end gap-1", className)}
      style={{ height }}
      role="img"
      aria-label="Trend over time"
    >
      {data.map((value, i) => {
        const ratio = value / max;
        const heightPct = (minHeight + (1 - minHeight) * ratio) * 100;
        const opacity = 0.25 + 0.65 * ratio;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t-sm transition-all duration-200 ease-out",
              colorClass
            )}
            style={{ height: `${heightPct}%`, opacity }}
          />
        );
      })}
    </div>
  );
}
