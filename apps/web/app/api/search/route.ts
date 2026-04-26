import { NextRequest, NextResponse } from "next/server";

import { getAuthUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const PER_GROUP_LIMIT = 5;

export interface SearchOrderHit {
  id: string;
  aliOrderId: string;
  sellerName: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  orderDate: string;
}

export interface SearchSellerHit {
  name: string;
  orderCount: number;
  totalSpent: number;
  currency: string;
}

export interface SearchTrackingHit {
  trackingNumber: string;
  carrier: string | null;
  orderId: string;
  aliOrderId: string;
  status: string;
}

export interface SearchResponse {
  orders: SearchOrderHit[];
  sellers: SearchSellerHit[];
  tracking: SearchTrackingHit[];
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json<SearchResponse>({
      orders: [],
      sellers: [],
      tracking: [],
    });
  }

  // Run all three lookups in parallel. We keep each query narrow so the
  // popover stays responsive even on large data sets.
  const [orderRows, trackingRows, sellerGroups, primaryOrder] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          userId,
          OR: [
            { aliOrderId: { contains: q, mode: "insensitive" } },
            { sellerName: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          aliOrderId: true,
          sellerName: true,
          totalAmount: true,
          currency: true,
          status: true,
          orderDate: true,
        },
        orderBy: { orderDate: "desc" },
        take: PER_GROUP_LIMIT,
      }),
      prisma.order.findMany({
        where: {
          userId,
          trackingNumber: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          aliOrderId: true,
          trackingNumber: true,
          carrier: true,
          status: true,
        },
        orderBy: { orderDate: "desc" },
        take: PER_GROUP_LIMIT,
      }),
      prisma.order.groupBy({
        by: ["sellerName"],
        where: {
          userId,
          sellerName: { contains: q, mode: "insensitive", not: null },
        },
        _sum: { totalAmount: true },
        _count: true,
        orderBy: { _sum: { totalAmount: "desc" } },
        take: PER_GROUP_LIMIT,
      }),
      prisma.order.findFirst({
        where: { userId },
        select: { currency: true },
        orderBy: { orderDate: "desc" },
      }),
    ]);

  const primaryCurrency = primaryOrder?.currency ?? "USD";

  return NextResponse.json<SearchResponse>({
    orders: orderRows.map((o) => ({
      id: o.id,
      aliOrderId: o.aliOrderId,
      sellerName: o.sellerName,
      totalAmount: o.totalAmount,
      currency: o.currency,
      status: o.status,
      orderDate: o.orderDate.toISOString(),
    })),
    sellers: sellerGroups
      .filter((g) => g.sellerName)
      .map((g) => ({
        name: g.sellerName!,
        orderCount: g._count,
        totalSpent: Math.round((g._sum.totalAmount ?? 0) * 100) / 100,
        currency: primaryCurrency,
      })),
    tracking: trackingRows
      .filter((t) => t.trackingNumber)
      .map((t) => ({
        trackingNumber: t.trackingNumber!,
        carrier: t.carrier,
        orderId: t.id,
        aliOrderId: t.aliOrderId,
        status: t.status,
      })),
  });
}
