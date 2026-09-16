-- CreateEnum
CREATE TYPE "JudgementKind" AS ENUM ('TOPIC', 'HIGHLIGHT');

-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('DOCUMENT', 'WEB_PAGE', 'IMAGE', 'TYPED');

-- AlterTable
ALTER TABLE "Highlight" ADD COLUMN     "tocItemId" TEXT;

-- AlterTable
ALTER TABLE "JudgementTask" ADD COLUMN     "kind" "JudgementKind" NOT NULL DEFAULT 'HIGHLIGHT';

-- CreateTable
CREATE TABLE "CourseMaterial" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "CourseMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TocItem" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "parentId" TEXT,
    "order" INTEGER NOT NULL,
    "depth" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "TocItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTopic" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tocItemId" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseMaterial_courseId_idx" ON "CourseMaterial"("courseId");

-- CreateIndex
CREATE INDEX "CourseMaterial_deletedAt_idx" ON "CourseMaterial"("deletedAt");

-- CreateIndex
CREATE INDEX "TocItem_courseId_order_idx" ON "TocItem"("courseId", "order");

-- CreateIndex
CREATE INDEX "SessionTopic_sessionId_idx" ON "SessionTopic"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionTopic_sessionId_tocItemId_key" ON "SessionTopic"("sessionId", "tocItemId");

-- CreateIndex
CREATE INDEX "Highlight_tocItemId_idx" ON "Highlight"("tocItemId");

-- CreateIndex
CREATE UNIQUE INDEX "JudgementTask_sourceSegmentId_kind_fromAt_key" ON "JudgementTask"("sourceSegmentId", "kind", "fromAt");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_tocItemId_fkey" FOREIGN KEY ("tocItemId") REFERENCES "TocItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMaterial" ADD CONSTRAINT "CourseMaterial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TocItem" ADD CONSTRAINT "TocItem_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TocItem" ADD CONSTRAINT "TocItem_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TocItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopic" ADD CONSTRAINT "SessionTopic_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTopic" ADD CONSTRAINT "SessionTopic_tocItemId_fkey" FOREIGN KEY ("tocItemId") REFERENCES "TocItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

