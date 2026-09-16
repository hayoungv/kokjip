-- CreateEnum
CREATE TYPE "HighlightType" AS ENUM ('AVOID', 'PRACTICAL', 'CORE', 'EMPHASIS', 'MUST', 'RATIONALE', 'INSIGHT', 'REVIEW');

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionAdmin" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "capacity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingConsent" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "consentedAt" TIMESTAMP(3),
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Learner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleSubject" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Learner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "joinedOn" DATE NOT NULL,
    "leftOn" DATE,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "blockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingSegment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "gaps" JSONB NOT NULL DEFAULT '[]',
    "clockOffsetMs" INTEGER NOT NULL DEFAULT 0,
    "isCanonical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecordingSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoveredRange" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fromAt" TIMESTAMP(3) NOT NULL,
    "toAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoveredRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceSegmentId" TEXT NOT NULL,
    "type" "HighlightType" NOT NULL,
    "quote" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListView" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioIntake" (
    "id" TEXT NOT NULL,
    "segmentId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AudioIntake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JudgementBatch" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costKrw" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JudgementBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionAdmin_email_key" ON "InstitutionAdmin"("email");

-- CreateIndex
CREATE INDEX "InstitutionAdmin_institutionId_idx" ON "InstitutionAdmin"("institutionId");

-- CreateIndex
CREATE INDEX "Course_institutionId_idx" ON "Course"("institutionId");

-- CreateIndex
CREATE INDEX "Course_instructorId_idx" ON "Course"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingConsent_tokenHash_key" ON "RecordingConsent"("tokenHash");

-- CreateIndex
CREATE INDEX "RecordingConsent_courseId_idx" ON "RecordingConsent"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingConsent_instructorId_courseId_key" ON "RecordingConsent"("instructorId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Learner_email_key" ON "Learner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Learner_googleSubject_key" ON "Learner"("googleSubject");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_courseId_email_key" ON "Invite"("courseId", "email");

-- CreateIndex
CREATE INDEX "Enrollment_learnerId_idx" ON "Enrollment"("learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_courseId_learnerId_key" ON "Enrollment"("courseId", "learnerId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_courseId_date_key" ON "Session"("courseId", "date");

-- CreateIndex
CREATE INDEX "RecordingSegment_sessionId_idx" ON "RecordingSegment"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingSegment_learnerId_clientKey_key" ON "RecordingSegment"("learnerId", "clientKey");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_segmentId_key" ON "Transcript"("segmentId");

-- CreateIndex
CREATE INDEX "CoveredRange_sessionId_fromAt_idx" ON "CoveredRange"("sessionId", "fromAt");

-- CreateIndex
CREATE INDEX "Highlight_sessionId_idx" ON "Highlight"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Highlight_sessionId_occurredAt_type_key" ON "Highlight"("sessionId", "occurredAt", "type");

-- CreateIndex
CREATE INDEX "ListView_learnerId_sessionId_idx" ON "ListView"("learnerId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioIntake_segmentId_key" ON "AudioIntake"("segmentId");

-- CreateIndex
CREATE INDEX "AudioIntake_deletedAt_idx" ON "AudioIntake"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JudgementBatch_externalId_key" ON "JudgementBatch"("externalId");

-- CreateIndex
CREATE INDEX "JudgementBatch_submittedAt_idx" ON "JudgementBatch"("submittedAt");

-- AddForeignKey
ALTER TABLE "InstitutionAdmin" ADD CONSTRAINT "InstitutionAdmin_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingConsent" ADD CONSTRAINT "RecordingConsent_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingConsent" ADD CONSTRAINT "RecordingConsent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingSegment" ADD CONSTRAINT "RecordingSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingSegment" ADD CONSTRAINT "RecordingSegment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "RecordingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoveredRange" ADD CONSTRAINT "CoveredRange_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_sourceSegmentId_fkey" FOREIGN KEY ("sourceSegmentId") REFERENCES "RecordingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListView" ADD CONSTRAINT "ListView_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "Learner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListView" ADD CONSTRAINT "ListView_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioIntake" ADD CONSTRAINT "AudioIntake_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "RecordingSegment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
