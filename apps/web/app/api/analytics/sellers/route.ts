import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

  const sellers = await prisma.order.groupBy({
    by: ["sellerName"],
    where: { userId, sellerName: { not: null } },
    _sum: { totalAmount: true },
    _count: true,
    orderBy: { _sum: { totalAmount: "desc" } },
    take: limit,
  });

  return NextResponse.json({
    sellers: sellers.map((s) => ({
      name: s.sellerName,
      totalSpent: Math.round((s._sum.totalAmount || 0) * 100) / 100,
      orderCount: s._count,
    })),
  });
}
