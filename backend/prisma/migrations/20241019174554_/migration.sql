-- DropIndex
DROP INDEX "EthPrice_timestamp_key";

-- AlterTable
ALTER TABLE "EthPrice" ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;
