import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAmount } from "@/lib/format";

interface SummaryCardsProps {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  totalItems: number;
  currency: string;
}

const cards = [
  {
    key: "totalSpent" as const,
    title: "Total Spent",
    icon: DollarSign,
    iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    key: "totalOrders" as const,
    title: "Total Orders",
    icon: ShoppingCart,
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    key: "avgOrderValue" as const,
    title: "Avg Order Value",
    icon: TrendingUp,
    iconClass: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    key: "totalItems" as const,
    title: "Items Purchased",
    icon: Package,
    iconClass: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

export function SummaryCards({
  totalSpent,
  totalOrders,
  avgOrderValue,
  totalItems,
  currency,
}: SummaryCardsProps) {
  const values = {
    totalSpent: formatAmount(totalSpent, currency),
    totalOrders: totalOrders.toLocaleString(),
    avgOrderValue: formatAmount(avgOrderValue, currency),
    totalItems: totalItems.toLocaleString(),
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.iconClass}`}>
                  <Icon className="size-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{values[card.key]}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
