-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'SUBMITTED', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "JudgementTask" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceSegmentId" TEXT NOT NULL,
    "fromAt" TIMESTAMP(3) NOT NULL,
    "toAt" TIMESTAMP(3) NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "batchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "JudgementTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JudgementTask_status_createdAt_idx" ON "JudgementTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "JudgementTask_sessionId_idx" ON "JudgementTask"("sessionId");

-- AddForeignKey
ALTER TABLE "JudgementTask" ADD CONSTRAINT "JudgementTask_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JudgementTask" ADD CONSTRAINT "JudgementTask_sourceSegmentId_fkey" FOREIGN KEY ("sourceSegmentId") REFERENCES "RecordingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
