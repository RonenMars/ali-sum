"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { withOrderDetailParam } from "@/lib/order-detail-href";

interface OpenOrderLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /** Internal Order.id (cuid) — *not* the AliExpress order id. */
  orderId: string;
  /** Display label for the AliExpress order id, used for the aria-label. */
  aliOrderId?: string;
  children: React.ReactNode;
}

/**
 * Anchor that opens the Order Detail drawer by pushing `?order=<id>` onto
 * the current URL while preserving every other search param (so date
 * filters, pagination, etc. survive the open/close cycle).
 *
 * Uses next/link so middle-click and right-click "Open in new tab" still
 * work the way users expect.
 */
export function OpenOrderLink({
  orderId,
  aliOrderId,
  children,
  ...rest
}: OpenOrderLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href = withOrderDetailParam(
    pathname,
    searchParams.toString(),
    orderId
  );

  return (
    <Link
      href={href}
      scroll={false}
      aria-label={
        rest["aria-label"] ??
        (aliOrderId ? `Open order ${aliOrderId}` : "Open order")
      }
      {...rest}
    >
      {children}
    </Link>
  );
}

/**
 * Imperative variant for callers that need an onClick handler instead of an
 * anchor (e.g. table rows acting as `role="link"`).
 */
export function useOpenOrder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  return React.useCallback(
    (orderId: string) => {
      router.push(
        withOrderDetailParam(pathname, searchParams.toString(), orderId),
        { scroll: false }
      );
    },
    [pathname, searchParams, router]
  );
}
