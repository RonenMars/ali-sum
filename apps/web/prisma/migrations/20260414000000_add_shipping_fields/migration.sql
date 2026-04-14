-- AlterTable
ALTER TABLE "orders" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "orders" ADD COLUMN "carrier" TEXT;
ALTER TABLE "orders" ADD COLUMN "estimatedDelivery" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");
