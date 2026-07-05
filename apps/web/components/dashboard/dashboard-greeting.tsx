"use client";

import { useSyncExternalStore } from "react";

interface DashboardGreetingProps {
  name: string;
  /** Pre-formatted active range to render under the headline (e.g. "Apr 1–25, 2026"). */
  rangeLabel: string;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Eyebrow greeting + page headline + active date-range label. The greeting
 * is hydrated client-side so it tracks the visitor's local time, with a safe
 * server fallback to avoid mismatch flicker.
 */
export function DashboardGreeting({ name, rangeLabel }: DashboardGreetingProps) {
  const greeting = useSyncExternalStore(
    () => () => {},
    () => greetingForHour(new Date().getHours()),
    () => "Welcome back"
  );

  return (
    <div className="leading-tight">
      <span className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-primary">
        {greeting}, {name}
      </span>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Overview
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{rangeLabel}</p>
    </div>
  );
}
