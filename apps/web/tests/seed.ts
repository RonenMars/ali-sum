/**
 * Standalone seeding script — run via `tsx tests/seed.ts` or via global-setup.ts.
 * Creates the test user and 10 mock orders in the SQLite test database.
 *
 * Requires TEST_DATABASE_URL env var pointing to the SQLite file.
 */
import path from "path";
import { PrismaClient } from "../lib/generated/prisma-test/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { TEST_USER, SEED_ORDERS } from "./fixtures/data";

async function main() {
  const dbUrl =
    process.env.TEST_DATABASE_URL ??
    `file:${path.resolve(__dirname, "../test.db")}`;

  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  const db = new PrismaClient({ adapter });

  try {
    // Wipe in FK-safe order
    await db.orderItem.deleteMany();
    await db.order.deleteMany();
    await db.syncLog.deleteMany();
    await db.session.deleteMany();
    await db.account.deleteMany();
    await db.user.deleteMany();

    // Create test user
    const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
    const user = await db.user.create({
      data: {
        email: TEST_USER.email,
        name: TEST_USER.name,
        passwordHash,
      },
    });

    // Seed orders with items
    for (const order of SEED_ORDERS) {
      await db.order.create({
        data: {
          userId: user.id,
          aliOrderId: order.aliOrderId,
          orderDate: order.orderDate,
          totalAmount: order.totalAmount,
          currency: order.currency,
          status: order.status,
          sellerName: order.sellerName,
          shippingCost: order.shippingCost,
          items: { create: order.items },
        },
      });
    }

    console.log(`✓ Seeded ${SEED_ORDERS.length} orders for ${TEST_USER.email}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
