import * as React from "react";

import { cn } from "@/lib/utils";

interface SellerRowProps {
  name: string;
  total: string;
  /** 0–1, fraction of the leader's total. */
  ratio: number;
  className?: string;
}

/** Single row in the Top Sellers list: letter avatar + name + violet bar + total. */
export function SellerRow({ name, total, ratio, className }: SellerRowProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const widthPct = Math.max(8, Math.min(100, Math.round(ratio * 100)));

  return (
    <div className={cn("flex items-center gap-3 py-2", className)}>
      <div
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--accent-soft)] text-xs font-semibold text-primary"
      >
        {initial}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="truncate font-medium">{name}</span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {total}
          </span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${widthPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
