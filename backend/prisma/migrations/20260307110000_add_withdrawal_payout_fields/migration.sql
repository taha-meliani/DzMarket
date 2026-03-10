-- CreateEnum
CREATE TYPE "WithdrawalPayoutStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "WalletTransaction"
ADD COLUMN "ccpAccountNumber" TEXT,
ADD COLUMN "ccpSecurityKey" TEXT,
ADD COLUMN "payoutStatus" "WithdrawalPayoutStatus",
ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill existing withdrawals as pending
UPDATE "WalletTransaction"
SET "payoutStatus" = 'PENDING'
WHERE "type" = 'WITHDRAWAL' AND "payoutStatus" IS NULL;

-- CreateIndex
CREATE INDEX "WalletTransaction_type_payoutStatus_createdAt_idx"
ON "WalletTransaction"("type", "payoutStatus", "createdAt");
