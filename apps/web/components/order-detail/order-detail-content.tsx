"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Truck } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format";
import { getShippingStatus } from "@/lib/shipping-status";
import { aliOrderDetailUrl, ALI_ORDER_LINK_PROPS } from "@/lib/order-url";
import { TrackingStepper } from "./tracking-stepper";

export interface OrderDetail {
  id: string;
  aliOrderId: string;
  orderDate: string;
  totalAmount: number;
  currency: string;
  status: string;
  sellerName: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  items: {
    id: string;
    title: string;
    imageUrl: string | null;
    price: number;
    quantity: number;
  }[];
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface OrderDetailContentProps {
  order: OrderDetail;
  /** "horizontal" stepper for the desktop drawer, "vertical" for the mobile page. */
  stepperOrientation?: "horizontal" | "vertical";
}

export function OrderDetailContent({
  order,
  stepperOrientation = "horizontal",
}: OrderDetailContentProps) {
  const status = getShippingStatus(order.status);
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const sellerInitial =
    order.sellerName?.trim().charAt(0).toUpperCase() ?? "?";
  const aliHref = aliOrderDetailUrl(order.aliOrderId);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="rounded-xl border border-border bg-background/40 p-6 text-center">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Paid on {dateFormatter.format(new Date(order.orderDate))}
        </p>
        <p className="font-display mt-2 text-5xl font-bold tracking-tight text-primary text-violet-glow">
          {formatAmount(order.totalAmount, order.currency)}
        </p>
        {order.estimatedDelivery && (
          <p className="mt-3 text-xs text-muted-foreground">
            Est. delivery{" "}
            <span className="text-foreground">
              {dateFormatter.format(new Date(order.estimatedDelivery))}
            </span>
          </p>
        )}
      </section>

      {/* Tracking */}
      <section>
        <header className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="text-muted-foreground">Status Tracking</span>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
              status.className
            )}
          >
            {status.label}
          </span>
        </header>
        <TrackingStepper status={order.status} orientation={stepperOrientation} />
      </section>

      {/* Items */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Items ({order.items.length})
        </h4>
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-background/40 p-3"
            >
              {item.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.imageUrl}
                  alt=""
                  className="size-14 shrink-0 rounded border border-border object-cover"
                />
              ) : (
                <div className="size-14 shrink-0 rounded border border-border bg-card" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground line-clamp-2">
                  {item.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Qty {item.quantity}
                </p>
              </div>
              <p className="font-mono text-sm font-semibold tabular-nums text-primary">
                {formatAmount(item.price * item.quantity, order.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Totals */}
      {order.items.length > 0 && (
        <section className="rounded-xl border border-border bg-background/40 p-5">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Items subtotal</dt>
              <dd className="font-mono tabular-nums text-foreground">
                {formatAmount(subtotal, order.currency)}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <dt className="text-base font-semibold">Order total</dt>
              <dd className="font-mono text-lg font-bold tabular-nums text-primary">
                {formatAmount(order.totalAmount, order.currency)}
              </dd>
            </div>
          </dl>
        </section>
      )}

      {/* Logistics */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Logistics &amp; Shipping
        </h4>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Carrier
              </p>
              <p className="text-sm font-semibold text-foreground">
                {order.carrier ?? "Not assigned yet"}
              </p>
            </div>
            <Truck className="size-4 text-muted-foreground" />
          </div>
          {order.trackingNumber && (
            <div className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Tracking ID
                </p>
                <p className="truncate font-mono text-sm font-semibold text-primary">
                  {order.trackingNumber}
                </p>
              </div>
              <CopyButton text={order.trackingNumber} />
            </div>
          )}
          <div className="p-4">
            <a
              href={aliHref}
              {...ALI_ORDER_LINK_PROPS}
              className="group inline-flex w-full items-center justify-center gap-2 text-xs font-bold text-primary"
            >
              Open on AliExpress
              <ExternalLink className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Seller */}
      {order.sellerName && (
        <section className="space-y-3 pb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Sold by
          </h4>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-base font-bold text-primary ring-1 ring-primary/30">
              {sellerInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {order.sellerName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Order ID{" "}
                <span className="font-mono text-foreground">
                  {order.aliOrderId}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard not available — silently ignore
        }
      }}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-primary"
      aria-label="Copy tracking number"
    >
      {copied ? (
        <Check className="size-4 text-[color:var(--positive)]" />
      ) : (
        <Copy className="size-4" />
      )}
    </button>
  );
}
