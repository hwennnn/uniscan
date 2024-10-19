-- CreateTable
CREATE TABLE "EthPrice" (
    "id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EthPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EthPrice_timestamp_key" ON "EthPrice"("timestamp");

-- CreateIndex
CREATE INDEX "EthPrice_timestamp_idx" ON "EthPrice"("timestamp");
