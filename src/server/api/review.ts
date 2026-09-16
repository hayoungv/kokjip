import { elapsedInSegment } from "@/domain/time";
import type { HighlightTypeName } from "@/domain/highlight-type";
import { prisma } from "@/lib/prisma";

/**
 * 복습 목록을 읽는 처리.
 *
 * 목록은 하루에 하나이고, 강도가 높은 순으로 보여준다.
 * 강도가 같으면 시각 순이다.
 */

export type ReviewItem = {
  id: string;
  type: HighlightTypeName;
  strength: number;
  quote: string;
  /** 실제 시각 */
  occurredAt: Date;
  /** 그 대목이 담긴 조각. 담고 있는 조각이 없으면 null */
  segment: { id: string; label: string; elapsedMs: number } | null;
};

export type ReviewDay = {
  sessionId: string;
  date: Date;
  segments: Array<{
    id: string;
    label: string;
    startedAt: Date;
    endedAt: Date;
  }>;
  items: ReviewItem[];
};

/** 한 학습자가 볼 수 있는 회차 목록을 날짜 내림차순으로 읽는다. */
export async function listSessions(learnerId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { learnerId, leftOn: null },
  });
  if (!enrollment) return [];

  return prisma.session.findMany({
    where: { courseId: enrollment.courseId },
    orderBy: { date: "desc" },
    include: {
      _count: { select: { highlights: true, segments: true } },
    },
  });
}

/** 한 회차의 복습 목록을 읽는다. */
export async function readReviewDay(
  sessionId: string,
): Promise<ReviewDay | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      segments: { orderBy: { startedAt: "asc" } },
      highlights: {
        orderBy: [{ strength: "desc" }, { occurredAt: "asc" }],
      },
    },
  });

  if (!session) return null;

  const segments = session.segments.map((s) => ({
    id: s.id,
    label: s.clientKey,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    gaps: [] as { fromAt: Date; toAt: Date }[],
  }));

  const items: ReviewItem[] = session.highlights.map((h) => {
    // 그 시각을 담고 있는 조각을 찾아 경과 시각으로 바꾼다.
    let found: ReviewItem["segment"] = null;

    for (const segment of segments) {
      const elapsedMs = elapsedInSegment(h.occurredAt, segment);
      if (elapsedMs !== null) {
        found = { id: segment.id, label: segment.label, elapsedMs };
        break;
      }
    }

    return {
      id: h.id,
      type: h.type as HighlightTypeName,
      strength: h.strength,
      quote: h.quote,
      occurredAt: h.occurredAt,
      segment: found,
    };
  });

  return {
    sessionId: session.id,
    date: session.date,
    segments: segments.map(({ id, label, startedAt, endedAt }) => ({
      id,
      label,
      startedAt,
      endedAt,
    })),
    items,
  };
}

/** 한 회차의 옮긴 글 전체를 시각 순으로 읽는다. */
export async function readTranscript(sessionId: string) {
  const segments = await prisma.recordingSegment.findMany({
    where: { sessionId },
    orderBy: { startedAt: "asc" },
    include: { transcript: true },
  });

  return segments.map((segment) => ({
    id: segment.id,
    label: segment.clientKey,
    startedAt: segment.startedAt,
    blocks: ((segment.transcript?.blocks ?? []) as Array<{
      at: string;
      text: string;
    }>).map((b) => ({
      at: new Date(b.at),
      elapsedMs: new Date(b.at).getTime() - segment.startedAt.getTime(),
      text: b.text,
    })),
  }));
}

/** 복습 목록 화면이 열렸음을 기록한다. */
export async function recordListView(learnerId: string, sessionId: string) {
  await prisma.listView.create({ data: { learnerId, sessionId } });
}
