import * as React from "react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-side slot for filters, primary actions, etc. Consumer controls layout. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page-level header: optional uppercase eyebrow, H1 title, body
 * subtitle, and a right-aligned actions slot. Stacks on mobile and
 * baseline-aligns title with actions on desktop.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && (
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
