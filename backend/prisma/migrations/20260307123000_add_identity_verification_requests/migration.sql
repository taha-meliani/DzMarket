-- CreateTable
CREATE TABLE "IdentityVerificationRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "documentImage" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "IdentityVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- One active/latest request per user
CREATE UNIQUE INDEX "IdentityVerificationRequest_userId_key" ON "IdentityVerificationRequest"("userId");
CREATE INDEX "IdentityVerificationRequest_status_createdAt_idx" ON "IdentityVerificationRequest"("status", "createdAt");

-- FKs
ALTER TABLE "IdentityVerificationRequest"
  ADD CONSTRAINT "IdentityVerificationRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IdentityVerificationRequest"
  ADD CONSTRAINT "IdentityVerificationRequest_reviewedBy_fkey"
  FOREIGN KEY ("reviewedBy") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
