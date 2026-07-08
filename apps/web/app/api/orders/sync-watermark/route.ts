import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-auth";
import { isTerminal } from "@/lib/order-status";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const userId = await getAuthUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  const allUserOrders = await prisma.order.findMany({
    where: { userId },
    select: {
      aliOrderId: true,
      orderDate: true,
      status: true,
      trackingNumber: true,
      carrier: true,
      estimatedDelivery: true,
    },
    orderBy: { orderDate: "asc" },
  });

  if (allUserOrders.length === 0) {
    return NextResponse.json(
      { aliOrderId: null, orderDate: null, terminalAliOrderIds: [], orderStates: [] },
      { headers: CORS_HEADERS },
    );
  }

  const oldestNonTerminal = allUserOrders.find((o) => !isTerminal(o.status));
  const candidates = oldestNonTerminal
    ? allUserOrders.filter(
        (o) => o.orderDate < oldestNonTerminal.orderDate && isTerminal(o.status),
      )
    : allUserOrders.filter((o) => isTerminal(o.status));

  const watermark = candidates.at(-1) ?? null;
  const terminalAliOrderIds = allUserOrders.filter((o) => isTerminal(o.status)).map((o) => o.aliOrderId);
  const orderStates = allUserOrders.map((o) => ({
    aliOrderId: o.aliOrderId,
    status: o.status,
    trackingNumber: o.trackingNumber,
    carrier: o.carrier,
    estimatedDelivery: o.estimatedDelivery?.toISOString() ?? null,
  }));

  return NextResponse.json(
    {
      aliOrderId: watermark?.aliOrderId ?? null,
      orderDate: watermark?.orderDate.toISOString() ?? null,
      terminalAliOrderIds,
      orderStates,
    },
    { headers: CORS_HEADERS },
  );
}
