import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type DeltaTone = "positive" | "negative" | "neutral";

interface MetricDeltaProps {
  label: string;
  tone?: DeltaTone;
  /** When false, renders the chip without the up/down arrow icon. */
  withArrow?: boolean;
  className?: string;
}

/**
 * Up/down delta chip used inside KPI cards and comparison tables. Positive
 * uses the violet-friendly green token, negative uses destructive red, and
 * neutral falls back to muted.
 */
export function MetricDelta({
  label,
  tone = "neutral",
  withArrow = true,
  className,
}: MetricDeltaProps) {
  const isPositive = tone === "positive";
  const isNegative = tone === "negative";
  const Icon = isNegative ? ArrowDownRight : ArrowUpRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        isPositive && "bg-[color:var(--positive)]/15 text-[color:var(--positive)]",
        isNegative && "bg-destructive/15 text-destructive",
        !isPositive && !isNegative && "bg-muted text-muted-foreground",
        className
      )}
    >
      {withArrow && <Icon className="size-3" aria-hidden />}
      {label}
    </span>
  );
}
