"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { DATE_FILTER_STORAGE_KEY, DEFAULT_DATE_PRESET, DATE_PRESETS } from "@/lib/date-filter";

const STORAGE_KEY = DATE_FILTER_STORAGE_KEY;
const DEFAULT_PRESET = DEFAULT_DATE_PRESET;
const PRESETS = DATE_PRESETS;

const dateInputClass =
  "h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

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

  useEffect(() => {
    if (from || to) {
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
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setActivePreset(DEFAULT_PRESET);
    applyRange(r.from, r.to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
              "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
              activePreset === p.label
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50",
            ].join(" ")}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Date inputs */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">From</span>
          <input
            type="date"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            className={dateInputClass}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <input
            type="date"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            className={dateInputClass}
          />
        </div>
        {activePreset !== DEFAULT_PRESET && (
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
