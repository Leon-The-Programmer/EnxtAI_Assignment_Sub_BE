-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "public"."Transaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Watchlist_userId_createdAt_idx" ON "public"."Watchlist"("userId", "createdAt");
