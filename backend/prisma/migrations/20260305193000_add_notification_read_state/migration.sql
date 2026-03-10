-- CreateTable
CREATE TABLE "NotificationReadState" (
    "userId" TEXT NOT NULL,
    "notificationKey" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationReadState_pkey" PRIMARY KEY ("userId","notificationKey")
);

-- CreateIndex
CREATE INDEX "NotificationReadState_userId_readAt_idx" ON "NotificationReadState"("userId", "readAt");

-- AddForeignKey
ALTER TABLE "NotificationReadState" ADD CONSTRAINT "NotificationReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
