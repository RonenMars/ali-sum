"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SellerSummary } from "@/lib/sellers";

interface SellersDirectoryProps {
  sellers: SellerSummary[];
  currency: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const AVATAR_TONES = [
  "bg-primary/15 text-primary",
  "bg-[color:var(--info)]/15 text-[color:var(--info)]",
  "bg-[color:var(--positive)]/15 text-[color:var(--positive)]",
  "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
  "bg-[color:var(--magenta)]/15 text-[color:var(--magenta)]",
] as const;

/** Pick a deterministic palette index from a seller name so the same seller
 *  always reads as the same color across the app. */
function avatarTone(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function SellersDirectory({ sellers, currency }: SellersDirectoryProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sellers;
    return sellers.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, sellers]);

  return (
    <>
      <div className="relative w-full md:w-80">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sellers directory…"
          className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/20"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            {sellers.length === 0
              ? "No seller data yet. Sync your AliExpress orders to see sellers."
              : `No sellers match “${query}”.`}
          </p>
        ) : (
          <>
            {/* Desktop: dense table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background/40">
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Seller
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Orders
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Total Spend
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Avg Order
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Last Purchase
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((seller) => (
                    <TableRow
                      key={seller.name}
                      className="border-b border-border last:border-0 hover:bg-card/60"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-md font-mono text-sm font-bold",
                              avatarTone(seller.name)
                            )}
                          >
                            {seller.name.charAt(0).toUpperCase() || "?"}
                          </span>
                          <span className="truncate text-sm font-semibold text-foreground">
                            {seller.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono tabular-nums text-foreground">
                        {seller.orderCount}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono tabular-nums text-primary">
                        {formatAmount(seller.totalSpent, currency)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono tabular-nums text-foreground">
                        {formatAmount(seller.avgOrder, currency)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                        {dateFormatter.format(seller.lastOrderDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: card list */}
            <ul className="divide-y divide-border md:hidden">
              {filtered.map((seller) => (
                <li
                  key={seller.name}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card/60"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg font-mono text-base font-bold",
                        avatarTone(seller.name)
                      )}
                    >
                      {seller.name.charAt(0).toUpperCase() || "?"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {seller.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {seller.orderCount}{" "}
                        {seller.orderCount === 1 ? "order" : "orders"} ·{" "}
                        {dateFormatter.format(seller.lastOrderDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-right leading-tight">
                    <div>
                      <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                        {formatAmount(seller.totalSpent, currency)}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                        Total spent
                      </p>
                    </div>
                    <ChevronRight
                      className="size-4 text-muted-foreground/60"
                      aria-hidden
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex items-center justify-between border-t border-border bg-background/40 px-6 py-3">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-mono text-foreground">{filtered.length}</span>{" "}
            of{" "}
            <span className="font-mono text-foreground">{sellers.length}</span>{" "}
            sellers
          </p>
        </div>
      </div>
    </>
  );
}
