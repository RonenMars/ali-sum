"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardData {
  label: string;
  count: number;
  className: string;
  filterValue: string;
}

interface ShippingStatusCardsProps {
  inTransitCount: number;
  deliveredCount: number;
  pendingCount: number;
  totalCount: number;
}

export function ShippingStatusCards({
  inTransitCount,
  deliveredCount,
  pendingCount,
  totalCount,
}: ShippingStatusCardsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "";

  const handleClick = useCallback(
    (filterValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (currentStatus === filterValue) {
        // Toggle off — clear filter
        params.delete("status");
      } else {
        params.set("status", filterValue);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams, currentStatus],
  );

  const cards: StatusCardData[] = [
    {
      label: "In Transit",
      count: inTransitCount,
      className: "text-indigo-600",
      filterValue: "In Transit",
    },
    {
      label: "Delivered",
      count: deliveredCount,
      className: "text-green-600",
      filterValue: "Delivered",
    },
    {
      label: "Pending / Processing",
      count: pendingCount,
      className: "text-amber-600",
      filterValue: "Processing",
    },
    {
      label: "Total Orders",
      count: totalCount,
      className: "text-foreground",
      filterValue: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isActive =
          card.filterValue !== "" && currentStatus === card.filterValue;
        return (
          <Card
            key={card.label}
            className={`cursor-pointer transition-colors hover:bg-accent/50 ${
              isActive ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleClick(card.filterValue)}
          >
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${card.className}`}>
                {card.count}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
