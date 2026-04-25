import * as React from "react";

import { cn } from "@/lib/utils";

export type StatusTone = "in-transit" | "delivered" | "pending" | "info" | "muted";

const TONE_STYLES: Record<StatusTone, { dot: string; chip: string }> = {
  "in-transit": {
    dot: "bg-[color:var(--warning)]",
    chip: "bg-[color:var(--warning)]/12 text-[color:var(--warning)]",
  },
  delivered: {
    dot: "bg-[color:var(--positive)]",
    chip: "bg-[color:var(--positive)]/12 text-[color:var(--positive)]",
  },
  pending: {
    dot: "bg-muted-foreground",
    chip: "bg-muted text-muted-foreground",
  },
  info: {
    dot: "bg-[color:var(--info)]",
    chip: "bg-[color:var(--info)]/12 text-[color:var(--info)]",
  },
  muted: {
    dot: "bg-muted-foreground/60",
    chip: "bg-muted text-muted-foreground",
  },
};

interface StatusPillProps {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
}

/** Pill with a colored dot — used for shipping status across the dashboard. */
export function StatusPill({ tone, children, className }: StatusPillProps) {
  const styles = TONE_STYLES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        styles.chip,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} />
      {children}
    </span>
  );
}
