import { planProcessing } from "@/domain/canonical";
import { toDateOnly } from "@/domain/lag";
import type { TimeRange } from "@/domain/types";
import { prisma } from "@/lib/prisma";
import type { UploadSegmentInput } from "@/validation/segment";

/**
 * 조각 올리기 처리.
 *
 * 창구가 검증한 입력을 받아 회차를 찾거나 만들고, 조각을 등록하고,
 * 도메인 규칙으로 처리 대상을 산출해 판정 대기열에 넣는다.
 *
 * 업무 규칙 자체는 도메인 계층에 있다. 여기서는 그것을 불러 쓰고
 * 저장소에 반영하는 일만 한다.
 */

export type UploadResult = {
  segmentId: string;
  sessionId: string;
  sessionDate: string;
  /** 이 조각이 회차의 정본이 되었는지 */
  isCanonical: boolean;
  /** 판정 대기열에 새로 넣은 구간 */
  queuedRanges: TimeRange[];
  /** 이미 올라온 조각이라 다시 처리하지 않은 경우 */
  alreadyUploaded: boolean;
};

export async function uploadSegment(
  input: UploadSegmentInput,
): Promise<UploadResult> {
  // 같은 조각을 두 번 보내도 한 번만 받는다.
  const existing = await prisma.recordingSegment.findUnique({
    where: {
      learnerId_clientKey: {
        learnerId: input.learnerId,
        clientKey: input.clientKey,
      },
    },
    include: { session: true },
  });

  if (existing) {
    return {
      segmentId: existing.id,
      sessionId: existing.sessionId,
      sessionDate: toDateOnly(existing.session.date),
      isCanonical: existing.isCanonical,
      queuedRanges: [],
      alreadyUploaded: true,
    };
  }

  // 회차는 미리 등록하지 않는다. 녹음이 시작된 날짜로 찾거나 만든다.
  const sessionDate = toDateOnly(input.startedAt);

  return prisma.$transaction(async (tx) => {
    const session = await tx.session.upsert({
      where: {
        courseId_date: {
          courseId: input.courseId,
          date: new Date(`${sessionDate}T00:00:00Z`),
        },
      },
      create: {
        courseId: input.courseId,
        date: new Date(`${sessionDate}T00:00:00Z`),
      },
      update: {},
    });

    const covered = await tx.coveredRange.findMany({
      where: { sessionId: session.id },
      orderBy: { fromAt: "asc" },
    });

    const plan = planProcessing(
      {
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        gaps: input.gaps,
      },
      covered.map((c) => ({ fromAt: c.fromAt, toAt: c.toAt })),
    );

    const segment = await tx.recordingSegment.create({
      data: {
        sessionId: session.id,
        learnerId: input.learnerId,
        clientKey: input.clientKey,
        startedAt: input.startedAt,
        endedAt: input.endedAt,
        gaps: input.gaps.map((g) => ({
          fromAt: g.fromAt.toISOString(),
          toAt: g.toAt.toISOString(),
        })),
        clockOffsetMs: input.clockOffsetMs,
        isCanonical: plan.isCanonical,
        transcript: {
          create: {
            blocks: input.blocks.map((b) => ({
              at: new Date(
                input.startedAt.getTime() + b.offsetMs,
              ).toISOString(),
              text: b.text,
            })),
          },
        },
      },
    });

    if (plan.rangesToProcess.length > 0) {
      await tx.judgementTask.createMany({
        data: plan.rangesToProcess.map((r) => ({
          sessionId: session.id,
          sourceSegmentId: segment.id,
          fromAt: r.fromAt,
          toAt: r.toAt,
        })),
      });

      // 대기열에 넣는 시점에 덮인 것으로 친다.
      // 그래야 곧바로 올라온 다음 조각이 같은 구간을 다시 넣지 않는다.
      await tx.coveredRange.deleteMany({ where: { sessionId: session.id } });
      await tx.coveredRange.createMany({
        data: plan.nextCoveredRanges.map((r) => ({
          sessionId: session.id,
          fromAt: r.fromAt,
          toAt: r.toAt,
        })),
      });
    }

    return {
      segmentId: segment.id,
      sessionId: session.id,
      sessionDate,
      isCanonical: plan.isCanonical,
      queuedRanges: plan.rangesToProcess,
      alreadyUploaded: false,
    };
  });
}

/** 한 회차의 현황을 읽는다. */
export async function readSessionSummary(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      segments: {
        orderBy: { startedAt: "asc" },
        include: { learner: { select: { name: true } } },
      },
      coveredRanges: { orderBy: { fromAt: "asc" } },
      tasks: { orderBy: { fromAt: "asc" } },
    },
  });

  return session;
}
