"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Package, Search, ShoppingBag, Store, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import { withOrderDetailParam } from "@/lib/order-detail-href";
import type {
  SearchOrderHit,
  SearchResponse,
  SearchSellerHit,
  SearchTrackingHit,
} from "@/app/api/search/route";

interface GlobalSearchProps {
  /** Visual variant. `topbar` is a full-width input; `icon` is a button that
   *  expands into the same popover (used in the mobile header). */
  variant?: "topbar" | "icon";
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function GlobalSearch({ variant = "topbar", className }: GlobalSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const trimmedQuery = query.trim();

  // Debounced fetch.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    const handle = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error("Search failed");
          return (await res.json()) as SearchResponse;
        })
        .then((data) => setResults(data))
        .catch(() => setResults({ orders: [], sellers: [], tracking: [] }))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(handle);
  }, [query]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const reset = useCallback(() => {
    setQuery("");
    setResults(null);
    setOpen(false);
  }, []);

  const openOrder = useCallback(
    (orderId: string) => {
      router.push(
        withOrderDetailParam(pathname, searchParams.toString(), orderId),
        { scroll: false }
      );
      reset();
    },
    [pathname, searchParams, router, reset]
  );

  const goToSellers = useCallback(() => {
    router.push("/sellers");
    reset();
  }, [router, reset]);

  const displayedResults = trimmedQuery.length >= 2 ? results : null;
  const loadingForQuery = trimmedQuery.length >= 2 && loading;
  const hasResults =
    displayedResults !== null &&
    (displayedResults.orders.length > 0 ||
      displayedResults.sellers.length > 0 ||
      displayedResults.tracking.length > 0);
  const showEmpty =
    displayedResults !== null && !hasResults && trimmedQuery.length >= 2 && !loadingForQuery;

  // The popover only renders when `open`, but the icon variant also needs
  // to render its own input field inside the popover.
  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      {variant === "topbar" ? (
        <TopbarInput
          query={query}
          inputRef={inputRef}
          onChange={(v) => {
            setQuery(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClear={reset}
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>
      )}

      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-2xl",
            variant === "topbar" ? "left-0 top-full" : "right-0 top-full"
          )}
        >
          {variant === "icon" && (
            <div className="border-b border-border p-2">
              <TopbarInput
                query={query}
                inputRef={inputRef}
                onChange={(v) => setQuery(v)}
                onClear={reset}
                autoFocus
              />
            </div>
          )}

          {trimmedQuery.length < 2 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search orders, sellers, or tracking.
            </div>
          ) : loadingForQuery || !displayedResults ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              Searching…
            </div>
          ) : showEmpty ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No matches for &ldquo;{trimmedQuery}&rdquo;.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto py-1">
              {displayedResults.orders.length > 0 && (
                <ResultGroup label="Orders">
                  {displayedResults.orders.map((o) => (
                    <OrderResultRow
                      key={o.id}
                      hit={o}
                      onSelect={() => openOrder(o.id)}
                    />
                  ))}
                </ResultGroup>
              )}
              {displayedResults.sellers.length > 0 && (
                <ResultGroup label="Sellers">
                  {displayedResults.sellers.map((s) => (
                    <SellerResultRow
                      key={s.name}
                      hit={s}
                      onSelect={goToSellers}
                    />
                  ))}
                </ResultGroup>
              )}
              {displayedResults.tracking.length > 0 && (
                <ResultGroup label="Tracking">
                  {displayedResults.tracking.map((t) => (
                    <TrackingResultRow
                      key={`${t.trackingNumber}-${t.orderId}`}
                      hit={t}
                      onSelect={() => openOrder(t.orderId)}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TopbarInput({
  query,
  inputRef,
  onChange,
  onFocus,
  onClear,
  autoFocus,
}: {
  query: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onClear: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        autoFocus={autoFocus}
        value={query}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search orders, sellers, tracking…"
        className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
      />
      {query && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

function ResultGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-1 py-1">
      <p className="px-3 pb-1 pt-2 font-display text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <ul>{children}</ul>
    </section>
  );
}

function OrderResultRow({
  hit,
  onSelect,
}: {
  hit: SearchOrderHit;
  onSelect: () => void;
}) {
  const status = getShippingStatus(hit.status);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
      >
        <ShoppingBag className="size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs font-bold text-foreground">
            {hit.aliOrderId}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {hit.sellerName ?? "Unknown seller"} ·{" "}
            {dateFormatter.format(new Date(hit.orderDate))}
          </p>
        </div>
        <div className="shrink-0 text-right leading-tight">
          <p className="font-mono text-xs font-semibold tabular-nums text-foreground">
            {formatAmount(hit.totalAmount, hit.currency)}
          </p>
          <p
            className={cn(
              "mt-0.5 inline-block rounded px-1.5 text-[9px] font-bold uppercase tracking-wider",
              status.className
            )}
          >
            {status.label}
          </p>
        </div>
      </button>
    </li>
  );
}

function SellerResultRow({
  hit,
  onSelect,
}: {
  hit: SearchSellerHit;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
      >
        <Store className="size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {hit.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {hit.orderCount} {hit.orderCount === 1 ? "order" : "orders"}
          </p>
        </div>
        <span className="font-mono text-xs font-semibold tabular-nums text-primary">
          {formatAmount(hit.totalSpent, hit.currency)}
        </span>
      </button>
    </li>
  );
}

function TrackingResultRow({
  hit,
  onSelect,
}: {
  hit: SearchTrackingHit;
  onSelect: () => void;
}) {
  const status = getShippingStatus(hit.status);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
      >
        <Package className="size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-xs font-bold text-foreground">
            {hit.trackingNumber}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {hit.carrier ?? "Unknown carrier"} · order {hit.aliOrderId}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            status.className
          )}
        >
          {status.label}
        </span>
      </button>
    </li>
  );
}
