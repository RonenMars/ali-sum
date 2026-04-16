import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

const orderItemSchema = z.object({
  title: z.string(),
  price: z.number(),
  quantity: z.number().int().positive().default(1),
  imageUrl: z.string().optional(),
  productUrl: z.string().optional(),
});

const orderSchema = z.object({
  aliOrderId: z.string(),
  orderDate: z.string(),
  totalAmount: z.number(),
  currency: z.string().default("USD"),
  status: z.string(),
  sellerName: z.string().optional(),
  shippingCost: z.number().default(0),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  items: z.array(orderItemSchema),
});

const syncBodySchema = z.object({
  orders: z.array(orderSchema),
});

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const body = await req.json();
  const parsed = syncBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { orders } = parsed.data;

  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      userId,
      ordersFound: orders.length,
      status: "running",
    },
  });

  let created = 0;
  let skipped = 0;

  try {
    // Check which orders already exist in one query so we can count created vs updated.
    const existingOrders = await prisma.order.findMany({
      where: { userId, aliOrderId: { in: orders.map((o) => o.aliOrderId) } },
      select: { aliOrderId: true },
    });
    const existingIds = new Set(existingOrders.map((o) => o.aliOrderId));
    skipped = existingIds.size;

    const newOrders = orders.filter((o) => !existingIds.has(o.aliOrderId));
    const existingToUpdate = orders.filter((o) => existingIds.has(o.aliOrderId));

    await prisma.$transaction([
      // Create new orders with their items
      ...newOrders.map((order) =>
        prisma.order.create({
          data: {
            userId,
            aliOrderId: order.aliOrderId,
            orderDate: new Date(order.orderDate),
            totalAmount: order.totalAmount,
            currency: order.currency,
            status: order.status,
            sellerName: order.sellerName,
            shippingCost: order.shippingCost,
            trackingNumber: order.trackingNumber,
            carrier: order.carrier,
            estimatedDelivery: order.estimatedDelivery ? new Date(order.estimatedDelivery) : undefined,
            items: {
              create: order.items.map((item) => ({
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl,
                productUrl: item.productUrl,
              })),
            },
          },
        })
      ),
      // Update shipping-mutable fields on existing orders (status and tracking can
      // change after initial sync, e.g. when a tracking number becomes available).
      ...existingToUpdate.map((order) =>
        prisma.order.updateMany({
          where: { userId, aliOrderId: order.aliOrderId },
          data: {
            status: order.status,
            ...(order.trackingNumber !== undefined && { trackingNumber: order.trackingNumber }),
            ...(order.carrier !== undefined && { carrier: order.carrier }),
            ...(order.estimatedDelivery !== undefined && {
              estimatedDelivery: new Date(order.estimatedDelivery),
            }),
          },
        })
      ),
    ]);

    created = newOrders.length;

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        ordersNew: created,
      },
    });

    return NextResponse.json({ created, skipped, syncLogId: syncLog.id }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("[sync] Error during sync:", error);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "failed",
        completedAt: new Date(),
        ordersNew: created,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { error: "Sync failed", created, skipped },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
