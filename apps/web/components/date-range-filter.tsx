"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { format, startOfWeek, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";

const STORAGE_KEY = "ali-sum:date-filter";
const DEFAULT_PRESET = "Last 30 days";

const PRESETS = [
  { label: "This week", getRange: () => ({ from: format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 7 days", getRange: () => ({ from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "This month", getRange: () => ({ from: format(startOfMonth(new Date()), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 30 days", getRange: () => ({ from: format(subDays(new Date(), 29), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "Last 3 months", getRange: () => ({ from: format(subMonths(new Date(), 3), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
  { label: "This year", getRange: () => ({ from: format(startOfYear(new Date()), "yyyy-MM-dd"), to: format(new Date(), "yyyy-MM-dd") }) },
];

const inputClass =
  "h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyRange = useCallback(
    (newFrom: string, newTo: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newFrom) params.set("from", newFrom); else params.delete("from");
      if (newTo) params.set("to", newTo); else params.delete("to");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // On mount: if no URL params, load from storage or apply default
  useEffect(() => {
    if (from || to) {
      // URL already has params — sync active preset label and save to storage
      const matched = PRESETS.find((p) => { const r = p.getRange(); return r.from === from && r.to === to; });
      setActivePreset(matched?.label ?? null);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { from: f, to: t } = JSON.parse(stored);
        if (f || t) { applyRange(f, t); return; }
      }
    } catch {}
    // First visit — apply default
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setActivePreset(DEFAULT_PRESET);
    applyRange(r.from, r.to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync active preset label when URL params change after mount
  useEffect(() => {
    if (!from && !to) return;
    const matched = PRESETS.find((p) => { const r = p.getRange(); return r.from === from && r.to === to; });
    setActivePreset(matched?.label ?? null);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
  }, [from, to]);

  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      const r = preset.getRange();
      setActivePreset(preset.label);
      applyRange(r.from, r.to);
    },
    [applyRange]
  );

  const handleFromChange = useCallback(
    (value: string) => { setActivePreset(null); applyRange(value, to); },
    [applyRange, to]
  );

  const handleToChange = useCallback(
    (value: string) => { setActivePreset(null); applyRange(from, value); },
    [applyRange, from]
  );

  const reset = useCallback(() => {
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setActivePreset(DEFAULT_PRESET);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ from: r.from, to: r.to }));
    applyRange(r.from, r.to);
  }, [applyRange]);

  return (
    <div className="flex flex-col gap-2 items-end">
      {/* Preset pills */}
      <div className="flex flex-wrap gap-1 justify-end">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handlePreset(p)}
            className={[
              "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
              activePreset === p.label
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            className={inputClass}
          />
        </div>
        {activePreset !== DEFAULT_PRESET && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
