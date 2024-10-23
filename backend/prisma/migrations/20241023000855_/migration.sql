-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "HistoricalTransactionsBatch" (
    "id" SERIAL NOT NULL,
    "startBlock" INTEGER NOT NULL,
    "endBlock" INTEGER NOT NULL,
    "dateFrom" TEXT NOT NULL,
    "dateTo" TEXT NOT NULL,
    "totalTxns" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoricalTransactionsBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricalTransaction" (
    "id" SERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "feeInEth" TEXT NOT NULL,
    "feeInUsdt" TEXT NOT NULL,
    "batchId" INTEGER NOT NULL,

    CONSTRAINT "HistoricalTransaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HistoricalTransaction" ADD CONSTRAINT "HistoricalTransaction_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "HistoricalTransactionsBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
