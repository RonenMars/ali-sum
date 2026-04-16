"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpendingChart } from "@/components/charts/spending-chart";
import { DATE_FILTER_STORAGE_KEY, DEFAULT_DATE_PRESET, DATE_PRESETS } from "@/lib/date-filter";

type Period = "week" | "month" | "year";
type SeriesItem = { period: string; amount: number; orderCount: number };

const STORAGE_KEY = DATE_FILTER_STORAGE_KEY;
const DEFAULT_PRESET = DEFAULT_DATE_PRESET;
const PRESETS = DATE_PRESETS;

const inputClass =
  "h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function SpendingPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [data, setData] = useState<SeriesItem[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  // On mount: load from storage or apply default
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { from: f, to: t } = JSON.parse(stored);
        const matched = PRESETS.find((p) => { const r = p.getRange(); return r.from === f && r.to === t; });
        setFrom(f || "");
        setTo(t || "");
        setActivePreset(matched?.label ?? null);
        return;
      }
    } catch {}
    // First visit — apply default
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(DEFAULT_PRESET);
  }, []);

  // Save to storage when filter changes
  useEffect(() => {
    if (from || to) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
    }
  }, [from, to]);

  // Fetch data when filter or period changes
  useEffect(() => {
    if (!from && !to) return; // wait for mount effect to set defaults
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/analytics/spending?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.series || []);
        if (d.currency) setCurrency(d.currency);
        setLoading(false);
      });
  }, [period, from, to]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    const r = preset.getRange();
    setActivePreset(preset.label);
    setFrom(r.from);
    setTo(r.to);
  };

  const handleFromChange = (value: string) => { setActivePreset(null); setFrom(value); };
  const handleToChange = (value: string) => { setActivePreset(null); setTo(value); };

  const reset = () => {
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setActivePreset(DEFAULT_PRESET);
    setFrom(r.from);
    setTo(r.to);
  };

  const totalForPeriod = data.reduce((sum, d) => sum + d.amount, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Spending</h1>
          <p className="text-muted-foreground text-sm">
            Track your spending patterns over time
          </p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          {/* Preset pills */}
          <div className="flex flex-wrap gap-1 justify-end">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
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
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="week">Weekly</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
          <TabsTrigger value="year">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalForPeriod)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Spending by {period === "week" ? "Week" : period === "month" ? "Month" : "Year"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : (
            <SpendingChart data={data} currency={currency} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
