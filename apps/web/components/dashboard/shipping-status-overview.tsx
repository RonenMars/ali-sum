import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ShippingSegment {
  key: string;
  label: string;
  count: number;
  /** Tailwind background utility, e.g. "bg-primary" or "bg-[color:var(--positive)]". */
  colorClass: string;
}

interface ShippingStatusOverviewProps {
  total: number;
  totalLabel?: string;
  segments: ShippingSegment[];
  /** When provided, renders a footer link button to the detailed view. */
  detailHref?: string;
  className?: string;
}

/**
 * Card body for the Overview "Shipping Status" tile: hairline segmented bar +
 * 2-column legend grid with counts + optional footer link button.
 */
export function ShippingStatusOverview({
  total,
  totalLabel = "active orders tracked",
  segments,
  detailHref,
  className,
}: ShippingStatusOverviewProps) {
  const visible = segments.filter((s) => s.count > 0);
  const safeTotal = visible.reduce((sum, s) => sum + s.count, 0) || 1;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono tabular-nums text-foreground">{total}</span>{" "}
        {totalLabel}
      </p>

      <div className="flex h-6 w-full overflow-hidden rounded-full bg-background ring-1 ring-inset ring-border/60">
        {visible.map((s) => {
          const pct = (s.count / safeTotal) * 100;
          return (
            <div
              key={s.key}
              className={cn("h-full", s.colorClass)}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${s.count}`}
            />
          );
        })}
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-4">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn("size-2 shrink-0 rounded-full", s.colorClass)}
            />
            <div className="min-w-0 leading-tight">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {s.label}
              </p>
              <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                {s.count} {s.count === 1 ? "order" : "orders"}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {detailHref && (
        <Link
          href={detailHref}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
        >
          View detailed log
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}
