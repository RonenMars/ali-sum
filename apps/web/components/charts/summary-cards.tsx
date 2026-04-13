import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardsProps {
  totalSpent: number;
  totalOrders: number;
  avgOrderValue: number;
  totalItems: number;
}

export function SummaryCards({
  totalSpent,
  totalOrders,
  avgOrderValue,
  totalItems,
}: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Spent",
      value: `$${totalSpent.toFixed(2)}`,
    },
    {
      title: "Total Orders",
      value: totalOrders.toLocaleString(),
    },
    {
      title: "Avg Order Value",
      value: `$${avgOrderValue.toFixed(2)}`,
    },
    {
      title: "Items Purchased",
      value: totalItems.toLocaleString(),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
