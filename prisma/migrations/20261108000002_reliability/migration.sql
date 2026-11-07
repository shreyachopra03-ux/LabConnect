-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorkerLock" (
    "name" TEXT NOT NULL,
    "holder" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerLock_pkey" PRIMARY KEY ("name")
);

