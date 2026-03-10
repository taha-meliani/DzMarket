CREATE TYPE "UserReportType" AS ENUM ('FAKE', 'FRAUD', 'ABUSE', 'SPAM');
CREATE TYPE "ProductReportType" AS ENUM ('FRAUD', 'COUNTERFEIT', 'WRONG_INFO', 'ABUSE', 'OTHER');

CREATE TABLE "UserReport" (
  "id" TEXT NOT NULL,
  "reportedUserId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "type" "UserReportType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductReport" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "type" "ProductReportType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserReport_reportedUserId_createdAt_idx" ON "UserReport"("reportedUserId", "createdAt");
CREATE INDEX "UserReport_reporterId_createdAt_idx" ON "UserReport"("reporterId", "createdAt");
CREATE INDEX "ProductReport_productId_createdAt_idx" ON "ProductReport"("productId", "createdAt");
CREATE INDEX "ProductReport_reporterId_createdAt_idx" ON "ProductReport"("reporterId", "createdAt");

ALTER TABLE "UserReport"
ADD CONSTRAINT "UserReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserReport"
ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductReport"
ADD CONSTRAINT "ProductReport_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductReport"
ADD CONSTRAINT "ProductReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
