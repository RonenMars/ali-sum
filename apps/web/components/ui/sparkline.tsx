import * as React from "react";

import { cn } from "@/lib/utils";

interface SparklineProps extends React.SVGAttributes<SVGSVGElement> {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  /** Gradient stops applied to the fill area. When omitted, no fill is rendered. */
  gradient?: { from: string; to: string };
  /** Stroke color (CSS color or var()). Defaults to currentColor. */
  stroke?: string;
}

/**
 * Lightweight SVG sparkline. Renders a single trend line with an optional
 * gradient fill that bleeds to the bottom edge — designed to sit at the
 * very bottom of a KPI card.
 */
export function Sparkline({
  data,
  width = 200,
  height = 48,
  strokeWidth = 1.75,
  gradient,
  stroke = "currentColor",
  className,
  ...props
}: SparklineProps) {
  if (data.length < 2) {
    return null;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const padY = strokeWidth;

  const points = data.map((value, index) => {
    const x = index * stepX;
    const y = padY + (height - padY * 2) * (1 - (value - min) / range);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const gradientId = React.useId();

  return (
    <svg
      role="img"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("block h-full w-full", className)}
      {...props}
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gradient.from} stopOpacity="0.8" />
            <stop offset="100%" stopColor={gradient.to} stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id={`${gradientId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradient.from} stopOpacity="0.35" />
            <stop offset="100%" stopColor={gradient.from} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {gradient && <path d={areaPath} fill={`url(#${gradientId}-fill)`} />}
      <path
        d={linePath}
        fill="none"
        stroke={gradient ? `url(#${gradientId})` : stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
