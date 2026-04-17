"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SHIPPING_STATUS_FILTERS } from "@/lib/shipping-status";

const inputClass =
  "h-8 rounded-lg border border-border bg-background px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20";

export function ShippingStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("status", value);
      else params.delete("status");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <select
      value={currentStatus}
      onChange={(e) => handleChange(e.target.value)}
      className={inputClass}
      aria-label="Filter by shipping status"
    >
      <option value="">All statuses</option>
      {SHIPPING_STATUS_FILTERS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
