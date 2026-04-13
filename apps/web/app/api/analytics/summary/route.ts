import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [orderAgg, itemCount, dateRange] = await Promise.all([
    prisma.order.aggregate({
      where: { userId },
      _sum: { totalAmount: true },
      _avg: { totalAmount: true },
      _count: true,
    }),
    prisma.orderItem.count({
      where: { order: { userId } },
    }),
    prisma.order.aggregate({
      where: { userId },
      _min: { orderDate: true },
      _max: { orderDate: true },
    }),
  ]);

  return NextResponse.json({
    totalSpent: orderAgg._sum.totalAmount || 0,
    totalOrders: orderAgg._count,
    avgOrderValue: orderAgg._avg.totalAmount || 0,
    totalItems: itemCount,
    firstOrderDate: dateRange._min.orderDate,
    lastOrderDate: dateRange._max.orderDate,
  });
}
