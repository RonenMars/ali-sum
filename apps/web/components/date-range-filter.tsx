"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarDays, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DATE_FILTER_STORAGE_KEY,
  DEFAULT_DATE_PRESET,
  DATE_PRESETS,
} from "@/lib/date-filter";

const STORAGE_KEY = DATE_FILTER_STORAGE_KEY;
const DEFAULT_PRESET = DEFAULT_DATE_PRESET;
const PRESETS = DATE_PRESETS;

const dateInputClass =
  "h-9 rounded-lg border border-border bg-background px-2.5 text-sm tabular-nums outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20";

const pillClass =
  "shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all";

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const [customOpen, setCustomOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const activePreset = useMemo(() => {
    if (!from && !to) return null;
    const matched = PRESETS.find((p) => {
      const r = p.getRange();
      return r.from === from && r.to === to;
    });
    return matched?.label ?? null;
  }, [from, to]);

  const applyRange = useCallback(
    (newFrom: string, newTo: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newFrom) params.set("from", newFrom);
      else params.delete("from");
      if (newTo) params.set("to", newTo);
      else params.delete("to");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Initialize: read URL → storage → fall back to default preset.
  useEffect(() => {
    if (from || to) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { from: f, to: t } = JSON.parse(stored);
        if (f || t) {
          applyRange(f, t);
          return;
        }
      }
    } catch {}
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    applyRange(r.from, r.to);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep activePreset in sync if URL changes from elsewhere.
  useEffect(() => {
    if (!from && !to) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
  }, [from, to]);

  // Close the Custom popover on outside click / Escape.
  useEffect(() => {
    if (!customOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setCustomOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [customOpen]);

  const handlePreset = useCallback(
    (preset: (typeof PRESETS)[number]) => {
      const r = preset.getRange();
      setCustomOpen(false);
      applyRange(r.from, r.to);
    },
    [applyRange]
  );

  const reset = useCallback(() => {
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setCustomOpen(false);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ from: r.from, to: r.to }));
    applyRange(r.from, r.to);
  }, [applyRange]);

  const customActive = activePreset === null && Boolean(from || to);
  const showReset = activePreset !== DEFAULT_PRESET;

  return (
    <div className="relative w-full min-w-0 md:w-auto" ref={popoverRef}>
      <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PRESETS.map((p) => {
          const active = activePreset === p.label;
          return (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={cn(
                pillClass,
                active
                  ? "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(167,139,250,0.25)]"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          );
        })}

        <button
          onClick={() => setCustomOpen((v) => !v)}
          aria-expanded={customOpen}
          className={cn(
            pillClass,
            "inline-flex items-center gap-1",
            customActive
              ? "bg-primary text-primary-foreground shadow-[0_0_18px_rgba(167,139,250,0.25)]"
              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          Custom
          <CalendarDays className="size-3.5" aria-hidden />
        </button>

        {showReset && (
          <button
            onClick={reset}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
            aria-label="Reset to default range"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
        )}
      </div>

      {customOpen && (
        <div className="absolute right-0 z-30 mt-2 w-[min(320px,calc(100vw-2rem))] origin-top-right rounded-xl border border-border bg-card p-4 shadow-2xl">
          <p className="mb-3 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Custom range
          </p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">From</span>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  applyRange(e.target.value, to);
                }}
                className={dateInputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] text-muted-foreground">To</span>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  applyRange(from, e.target.value);
                }}
                className={dateInputClass}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
