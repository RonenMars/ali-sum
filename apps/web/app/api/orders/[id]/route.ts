import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    aliOrderId: order.aliOrderId,
    orderDate: order.orderDate.toISOString(),
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    sellerName: order.sellerName,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    estimatedDelivery: order.estimatedDelivery
      ? order.estimatedDelivery.toISOString()
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      title: item.title,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: item.quantity,
    })),
  });
}
