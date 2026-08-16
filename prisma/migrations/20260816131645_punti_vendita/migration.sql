-- CreateTable
CREATE TABLE "RetailPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "url" TEXT,
    "note" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RetailPartner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RetailPartner_isPublished_sortOrder_idx" ON "RetailPartner"("isPublished", "sortOrder");
