"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpendingChart } from "@/components/charts/spending-chart";

type Period = "week" | "month" | "year";
type SeriesItem = { period: string; amount: number; orderCount: number };

export default function SpendingPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [data, setData] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/spending?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.series || []);
        setLoading(false);
      });
  }, [period]);

  const totalForPeriod = data.reduce((sum, d) => sum + d.amount, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orderCount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Spending</h1>
        <p className="text-muted-foreground text-sm">
          Track your spending patterns over time
        </p>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="week">Weekly</TabsTrigger>
          <TabsTrigger value="month">Monthly</TabsTrigger>
          <TabsTrigger value="year">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${totalForPeriod.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Spending by {period === "week" ? "Week" : period === "month" ? "Month" : "Year"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : (
            <SpendingChart data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
