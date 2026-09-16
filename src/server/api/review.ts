import type { HighlightTypeName } from "@/domain/highlight-type";
import { orderReview, type OrderedTopic } from "@/domain/review-order";
import { elapsedInSegment } from "@/domain/time";
import { prisma } from "@/lib/prisma";

/**
 * 복습 순서를 읽는 처리.
 *
 * 목록은 하루에 하나다. 목차가 있으면 목차 항목을 나열하고,
 * 없으면 강조한 말을 강도 높은 순으로 나열한다.
 * 순서를 정하는 규칙 자체는 도메인 계층에 있다.
 */

export type ReviewItem = {
  id: string;
  type: HighlightTypeName;
  strength: number;
  quote: string;
  /** 실제 시각 */
  occurredAt: Date;
  /** 붙은 목차 항목. 없으면 null */
  tocItemId: string | null;
  /** 그 말이 담긴 녹음. 담고 있는 녹음이 없으면 null */
  segment: { id: string; label: string; elapsedMs: number } | null;
};

export type ReviewTopic = OrderedTopic<ReviewItem>;

export type ReviewDay = {
  sessionId: string;
  date: Date;
  segments: Array<{
    id: string;
    label: string;
    startedAt: Date;
    endedAt: Date;
  }>;
  /** 이 과정에 확정된 목차가 있는지 */
  hasToc: boolean;
  /** 목차가 있을 때 나열하는 것. 우선 학습할 순이다 */
  topics: ReviewTopic[];
  /** 어느 항목에도 붙지 않은 말. 버리지 않고 따로 모은다 */
  loose: ReviewItem[];
  /** 목차가 없을 때 나열하는 것. 강도 높은 순이다 */
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

  const tocItems = await prisma.tocItem.findMany({
    where: { courseId: session.courseId },
    orderBy: { order: "asc" },
    select: { id: true, title: true, depth: true, order: true, parentId: true },
  });

  const segments = session.segments.map((s) => ({
    id: s.id,
    label: s.clientKey,
    startedAt: s.startedAt,
    endedAt: s.endedAt,
    gaps: [] as { fromAt: Date; toAt: Date }[],
  }));

  const items: ReviewItem[] = session.highlights.map((h) => {
    // 그 시각을 담고 있는 녹음을 찾아 경과 시각으로 바꾼다.
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
      tocItemId: h.tocItemId,
      segment: found,
    };
  });

  const { topics, loose } = orderReview(items, tocItems);

  return {
    sessionId: session.id,
    date: session.date,
    segments: segments.map(({ id, label, startedAt, endedAt }) => ({
      id,
      label,
      startedAt,
      endedAt,
    })),
    hasToc: tocItems.length > 0,
    topics,
    loose,
    items,
  };
}

/** 한 회차의 강의 기록 전체를 시각 순으로 읽는다. */
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
