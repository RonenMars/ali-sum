"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Truck, PackageCheck, Clock, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardData {
  label: string;
  count: number;
  icon: React.ElementType;
  iconClass: string;
  valueClass: string;
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
      icon: Truck,
      iconClass: "bg-[color:var(--accent-soft)] text-primary",
      valueClass: "text-primary",
      filterValue: "In Transit",
    },
    {
      label: "Delivered",
      count: deliveredCount,
      icon: PackageCheck,
      iconClass: "bg-[color:var(--positive)]/15 text-[color:var(--positive)]",
      valueClass: "text-[color:var(--positive)]",
      filterValue: "Delivered",
    },
    {
      label: "Pending / Processing",
      count: pendingCount,
      icon: Clock,
      iconClass: "bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
      valueClass: "text-[color:var(--warning)]",
      filterValue: "Processing",
    },
    {
      label: "Total Orders",
      count: totalCount,
      icon: Package,
      iconClass: "bg-muted text-muted-foreground",
      valueClass: "text-foreground",
      filterValue: "",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive =
          card.filterValue !== "" && currentStatus === card.filterValue;
        return (
          <Card
            key={card.label}
            className={`cursor-pointer transition-all hover:shadow-sm hover:-translate-y-px ${
              isActive ? "ring-2 ring-primary shadow-sm" : ""
            }`}
            onClick={() => handleClick(card.filterValue)}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-medium text-muted-foreground leading-tight">
                  {card.label}
                </p>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
                >
                  <Icon className="size-3.5" />
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${card.valueClass}`}>
                {card.count}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
