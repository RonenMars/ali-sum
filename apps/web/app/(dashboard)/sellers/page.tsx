import { auth } from "@/lib/auth";
import { formatAmount } from "@/lib/format";
import { getSellersOverview } from "@/lib/sellers";
import { SellersDirectory } from "@/components/sellers/sellers-directory";

export default async function SellersPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const { sellers, totalSellers, topSeller, repeatRate, primaryCurrency } =
    await getSellersOverview(userId);

  const repeatPct = Math.round(repeatRate * 100);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Sellers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track which AliExpress sellers you spend the most with.
          </p>
        </div>
      </header>

      {/* KPI strip */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        <article className="rounded-xl border border-border bg-card p-5">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Total Sellers
          </p>
          <p className="font-display mt-2 text-4xl font-bold tabular-nums text-primary">
            {totalSellers.toLocaleString()}
          </p>
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Top Seller
          </p>
          {topSeller ? (
            <div className="mt-3 flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-mono text-base font-bold text-primary"
              >
                {topSeller.name.charAt(0).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-foreground">
                  {topSeller.name}
                </p>
                <p className="font-mono text-xs tabular-nums text-muted-foreground">
                  {formatAmount(topSeller.totalSpent, primaryCurrency)} ·{" "}
                  {topSeller.orderCount}{" "}
                  {topSeller.orderCount === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No data yet</p>
          )}
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Repeat Rate
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-4xl font-bold tabular-nums text-foreground">
              {repeatPct}%
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${repeatPct}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Sellers you've ordered from more than once.
          </p>
        </article>
      </section>

      <SellersDirectory sellers={sellers} currency={primaryCurrency} />
    </div>
  );
}
