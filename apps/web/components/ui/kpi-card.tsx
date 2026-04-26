import * as React from "react";

import { cn } from "@/lib/utils";
import { Sparkline } from "@/components/ui/sparkline";
import { BarSparkline } from "@/components/ui/bar-sparkline";
import { MetricDelta, type DeltaTone } from "@/components/ui/metric-delta";

interface KpiCardProps {
  eyebrow: string;
  value: React.ReactNode;
  delta?: { label: string; tone?: DeltaTone };
  sparkline?: number[];
  /** Hero variant — bigger number with violet glow halo and bar-style sparkline. */
  variant?: "default" | "hero";
  className?: string;
}

/**
 * Editorial KPI tile.
 *
 * `default` — compact tile with eyebrow, large number, and a baseline-aligned
 * delta chip. No sparkline by default.
 *
 * `hero` — promoted tile used for the lead metric: violet text-glow, delta
 * chip pinned to the top-right, full-bleed bar sparkline at the bottom, and
 * a soft decorative gradient glow in the bottom-right corner.
 */
export function KpiCard({
  eyebrow,
  value,
  delta,
  sparkline,
  variant = "default",
  className,
}: KpiCardProps) {
  if (variant === "hero") {
    return (
      <div
        data-variant="hero"
        className={cn(
          "group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-6 transition-colors duration-200",
          className
        )}
      >
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </span>
            {delta && (
              <MetricDelta
                label={delta.label}
                tone={delta.tone}
                className="px-2 py-0.5 text-[11px] font-bold"
              />
            )}
          </div>
          <h3 className="font-display text-4xl font-bold tracking-tight text-primary text-violet-glow lg:text-5xl">
            {value}
          </h3>
        </div>

        {sparkline && sparkline.length > 1 && (
          <div className="relative z-10 mt-6">
            <BarSparkline data={sparkline} height={88} />
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-primary/10 blur-[80px]"
        />
      </div>
    );
  }

  return (
    <div
      data-variant={variant}
      className={cn(
        "relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-border/80",
        className
      )}
    >
      <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </span>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="font-display text-2xl font-bold tabular-nums tracking-tight text-foreground lg:text-[28px]">
          {value}
        </span>
        {delta ? (
          <DeltaText tone={delta.tone}>{delta.label}</DeltaText>
        ) : null}
      </div>

      {sparkline && sparkline.length > 1 && (
        <div className="-mx-1 -mb-1 mt-4 h-8 w-[calc(100%+0.5rem)]">
          <Sparkline
            data={sparkline}
            height={32}
            strokeWidth={1.5}
            stroke="var(--muted-foreground)"
            className="opacity-60"
          />
        </div>
      )}
    </div>
  );
}

function DeltaText({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: DeltaTone;
}) {
  return (
    <span
      className={cn(
        "text-xs font-bold tabular-nums",
        tone === "positive" && "text-[color:var(--positive)]",
        tone === "negative" && "text-destructive",
        tone === "neutral" && "text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}
