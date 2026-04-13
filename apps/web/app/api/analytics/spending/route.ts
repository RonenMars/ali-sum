import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const dateFilter: { gte?: Date; lt?: Date } = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) {
    const toDate = new Date(to);
    toDate.setDate(toDate.getDate() + 1);
    dateFilter.lt = toDate;
  }

  const [orders, primaryOrder] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length && { orderDate: dateFilter }),
      },
      select: { orderDate: true, totalAmount: true },
      orderBy: { orderDate: "asc" },
    }),
    prisma.order.findFirst({ where: { userId }, select: { currency: true }, orderBy: { orderDate: "desc" } }),
  ]);
  const currency = primaryOrder?.currency ?? "USD";

  const grouped = new Map<string, { amount: number; orderCount: number }>();

  for (const order of orders) {
    const date = new Date(order.orderDate);
    let key: string;

    switch (period) {
      case "week": {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().slice(0, 10);
        break;
      }
      case "year":
        key = String(date.getFullYear());
        break;
      case "month":
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
    }

    const existing = grouped.get(key) || { amount: 0, orderCount: 0 };
    existing.amount += order.totalAmount;
    existing.orderCount += 1;
    grouped.set(key, existing);
  }

  const series = Array.from(grouped.entries()).map(([period, data]) => ({
    period,
    amount: Math.round(data.amount * 100) / 100,
    orderCount: data.orderCount,
  }));

  return NextResponse.json({ series, currency });
}
