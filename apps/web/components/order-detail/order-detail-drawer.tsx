"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { ORDER_DETAIL_PARAM, withOrderDetailParam } from "@/lib/order-detail-href";
import {
  OrderDetailContent,
  type OrderDetail,
} from "./order-detail-content";

/**
 * Mounted in the dashboard layout. Watches `?order=<id>` and renders a
 * right-side drawer (≥md) or a full-screen sheet (<md). Closing clears the
 * URL param so the back button restores the open state.
 */
export function OrderDetailDrawer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const orderId = searchParams.get(ORDER_DETAIL_PARAM);

  const [orderState, setOrderState] = useState<{
    orderId: string;
    order: OrderDetail | null;
    error: string | null;
  } | null>(null);
  const isOpen = Boolean(orderId);
  const currentOrderState = orderState?.orderId === orderId ? orderState : null;
  const order = currentOrderState?.order ?? null;
  const error = currentOrderState?.error ?? null;
  const loading = Boolean(orderId) && currentOrderState === null;

  // Fetch the order whenever the id changes.
  useEffect(() => {
    if (!orderId) {
      return;
    }

    let cancelled = false;
    fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(
            res.status === 404 ? "Order not found." : "Failed to load order."
          );
        }
        return (await res.json()) as OrderDetail;
      })
      .then((data) => {
        if (!cancelled) {
          setOrderState({ orderId, order: data, error: null });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setOrderState({ orderId, order: null, error: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const close = useCallback(() => {
    router.push(withOrderDetailParam(pathname, searchParams.toString(), null), {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Body scroll lock while open
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={close}
        aria-hidden
      />

      <aside
        className={cn(
          "absolute inset-x-0 bottom-0 top-0 flex flex-col bg-card shadow-2xl",
          "pt-[env(safe-area-inset-top)]",
          "md:left-auto md:right-0 md:w-full md:max-w-lg md:border-l md:border-border md:pt-0",
          "animate-in slide-in-from-right duration-200"
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label="Close order detail"
          >
            <X className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Order
            </p>
            <p className="truncate font-mono text-sm font-semibold text-foreground">
              {order ? `#${order.aliOrderId}` : loading ? "Loading…" : "—"}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:p-6 md:pb-6">
          {loading && <DrawerSkeleton />}
          {error && !loading && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {!loading && !error && order && (
            <OrderDetailContent
              order={order}
              stepperOrientation="horizontal"
            />
          )}
        </div>
      </aside>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-xl bg-background/40" />
      <div className="h-16 rounded-xl bg-background/40" />
      <div className="space-y-2">
        <div className="h-20 rounded-xl bg-background/40" />
        <div className="h-20 rounded-xl bg-background/40" />
      </div>
      <div className="h-32 rounded-xl bg-background/40" />
    </div>
  );
}
