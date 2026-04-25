import * as React from "react";

import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { MetricDelta, type DeltaTone } from "@/components/ui/metric-delta";

interface KpiCardProps {
  eyebrow: string;
  value: React.ReactNode;
  delta?: { label: string; tone?: DeltaTone };
  sparkline?: number[];
  /** Hero variant — bigger number, violet glow halo behind it, gradient sparkline. */
  variant?: "default" | "hero";
  className?: string;
}

/**
 * Editorial-style KPI tile: eyebrow label, giant tabular-nums number,
 * optional delta chip, and a full-bleed sparkline at the bottom edge.
 * The `hero` variant adds a soft violet halo behind the number and uses
 * a violet→magenta gradient sparkline for the primary metric.
 */
export function KpiCard({
  eyebrow,
  value,
  delta,
  sparkline,
  variant = "default",
  className,
}: KpiCardProps) {
  const isHero = variant === "hero";

  return (
    <div
      data-variant={variant}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        "transition-colors hover:bg-card/80",
        className
      )}
    >
      {isHero && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-6 size-44 rounded-full bg-[color:var(--accent-soft)] blur-3xl opacity-80"
        />
      )}

      <div className={cn("relative flex flex-col gap-3", isHero ? "p-5" : "p-4")}>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {eyebrow}
        </span>
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "font-heading font-semibold tabular-nums tracking-tight",
              isHero
                ? "text-4xl text-primary lg:text-[44px] lg:leading-[1.05]"
                : "text-2xl lg:text-3xl"
            )}
          >
            {value}
          </span>
          {delta && <MetricDelta label={delta.label} tone={delta.tone} />}
        </div>
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="-mt-1 h-10 w-full px-1 pb-1">
          <Sparkline
            data={sparkline}
            height={40}
            strokeWidth={isHero ? 2 : 1.5}
            gradient={
              isHero
                ? { from: "var(--primary)", to: "var(--magenta)" }
                : undefined
            }
            stroke={isHero ? undefined : "var(--muted-foreground)"}
            className={isHero ? "" : "opacity-70"}
          />
        </div>
      )}
    </div>
  );
}
