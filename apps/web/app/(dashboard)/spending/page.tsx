"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedFilter } from "@/components/ui/segmented-filter";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricDelta } from "@/components/ui/metric-delta";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SpendingChart } from "@/components/charts/spending-chart";
import {
  DATE_FILTER_STORAGE_KEY,
  DEFAULT_DATE_PRESET,
  DATE_PRESETS,
} from "@/lib/date-filter";

type Period = "week" | "month" | "year";
type SeriesItem = { period: string; amount: number; orderCount: number };

const STORAGE_KEY = DATE_FILTER_STORAGE_KEY;
const DEFAULT_PRESET = DEFAULT_DATE_PRESET;
const PRESETS = DATE_PRESETS;
const PRESET_OPTIONS = PRESETS.map((p) => ({ value: p.label, label: p.label }));

const inputClass =
  "h-8 rounded-lg border border-border bg-background px-2 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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
        const matched = PRESETS.find((p) => {
          const r = p.getRange();
          return r.from === f && r.to === t;
        });
        setFrom(f || "");
        setTo(t || "");
        setActivePreset(matched?.label ?? null);
        return;
      }
    } catch {}
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    const r = preset.getRange();
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(DEFAULT_PRESET);
  }, []);

  useEffect(() => {
    if (from || to) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ from, to }));
    }
  }, [from, to]);

  useEffect(() => {
    if (!from && !to) return;
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

  const handlePresetChange = (label: string) => {
    const preset = PRESETS.find((p) => p.label === label);
    if (preset) applyPreset(preset);
  };

  const handleFromChange = (value: string) => {
    setActivePreset(null);
    setFrom(value);
  };
  const handleToChange = (value: string) => {
    setActivePreset(null);
    setTo(value);
  };

  const reset = () => {
    const preset = PRESETS.find((p) => p.label === DEFAULT_PRESET)!;
    applyPreset(preset);
  };

  const formatMoney = useMemo(() => {
    const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency });
    return (n: number) => fmt.format(n);
  }, [currency]);

  const totalForPeriod = data.reduce((sum, d) => sum + d.amount, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0);

  const avgMonthly = useMemo(() => {
    if (period !== "month" || data.length < 2) return null;
    return totalForPeriod / data.length;
  }, [period, data.length, totalForPeriod]);

  const comparison = useMemo(() => buildComparison(data, period), [data, period]);

  const groupingLabel =
    period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Yearly";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Spending"
        subtitle="Track your spending patterns over time"
        actions={
          <div className="flex flex-col items-stretch gap-2 md:items-end">
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <SegmentedFilter
                options={PRESET_OPTIONS}
                value={activePreset ?? ""}
                onChange={handlePresetChange}
                className="whitespace-nowrap"
              />
            </div>
            <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => handleFromChange(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => handleToChange(e.target.value)}
                  className={inputClass}
                />
              </label>
              {activePreset !== DEFAULT_PRESET && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        }
      />

      <section className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-12 left-6 size-44 rounded-full bg-[color:var(--accent-soft)] opacity-80 blur-3xl"
        />
        <div className="relative flex flex-col gap-6 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Total Period Spend
              </span>
              <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-primary md:text-[44px] md:leading-[1.05]">
                {formatMoney(totalForPeriod)}
              </span>
              <span className="text-sm text-muted-foreground">
                <span className="tabular-nums text-foreground/80">
                  {totalOrders.toLocaleString()}
                </span>{" "}
                {totalOrders === 1 ? "order" : "orders"}
              </span>
            </div>

            {avgMonthly !== null && (
              <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
                <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Avg Monthly
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(avgMonthly)}
                </span>
              </div>
            )}
          </div>

          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as Period)}
            className="self-start"
          >
            <TabsList>
              <TabsTrigger value="week">Weekly</TabsTrigger>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <SpendingChart data={data} currency={currency} />
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
            {groupingLabel} Comparison
          </h2>
        </header>
        {comparison.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No spending data for the selected range.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-6">
                  Period
                </TableHead>
                <TableHead className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-6">
                  Spend
                </TableHead>
                <TableHead className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-6">
                  Delta
                </TableHead>
                <TableHead className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-6">
                  Orders
                </TableHead>
                <TableHead className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground md:px-6">
                  Avg Order
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow
                  key={row.period}
                  className="border-border transition-colors hover:bg-[color:var(--accent-soft)]/40"
                >
                  <TableCell className="px-5 py-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-md bg-[color:var(--accent-soft)] font-mono text-[11px] font-semibold tabular-nums text-primary">
                        {row.badge}
                      </span>
                      <span className="font-medium text-foreground">
                        {row.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 font-mono text-foreground tabular-nums md:px-6">
                    {formatMoney(row.amount)}
                  </TableCell>
                  <TableCell className="px-5 py-4 md:px-6">
                    {row.deltaPct === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <MetricDelta
                        label={`${row.deltaPct > 0 ? "+" : ""}${row.deltaPct.toFixed(1)}%`}
                        tone={
                          row.deltaPct > 0
                            ? "positive"
                            : row.deltaPct < 0
                              ? "negative"
                              : "neutral"
                        }
                        withArrow={false}
                      />
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground tabular-nums md:px-6">
                    {row.orderCount}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right font-mono text-muted-foreground tabular-nums md:px-6">
                    {formatMoney(row.avgOrder)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}

type ComparisonRow = {
  period: string;
  amount: number;
  orderCount: number;
  avgOrder: number;
  deltaPct: number | null;
  badge: string;
  label: string;
};

function buildComparison(
  series: SeriesItem[],
  period: Period
): ComparisonRow[] {
  const rows = [...series].reverse();
  return rows.map((row, idx) => {
    const prev = rows[idx + 1];
    const deltaPct =
      prev && prev.amount > 0
        ? ((row.amount - prev.amount) / prev.amount) * 100
        : null;
    const avgOrder = row.orderCount > 0 ? row.amount / row.orderCount : 0;
    return {
      period: row.period,
      amount: row.amount,
      orderCount: row.orderCount,
      avgOrder,
      deltaPct,
      ...formatPeriod(row.period, period),
    };
  });
}

function formatPeriod(
  key: string,
  period: Period
): { badge: string; label: string } {
  if (period === "year") {
    return { badge: key.slice(-2), label: key };
  }
  if (period === "week") {
    const date = new Date(key);
    return {
      badge: String(date.getDate()).padStart(2, "0"),
      label: `Week of ${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
    };
  }
  const [y, m] = key.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return {
    badge: m,
    label: date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  };
}
