import {
  LAG_THRESHOLD_DAYS,
  consecutiveMissedDays,
  toDateOnly,
} from "@/domain/lag";
import { prisma } from "@/lib/prisma";

/**
 * 훈련기관 담당자가 보는 것.
 *
 * 볼 수 있는 것은 누가 며칠째 복습 목록을 열지 않았는지뿐이다.
 * 강의 기록과 복습 목록의 내용에는 접근할 수 없다.
 *
 * 기관으로 거르는 일은 여기서 한다. 화면에서 거르지 않는다.
 */

export type LaggingLearner = {
  learnerId: string;
  name: string;
  missedDays: number;
  lagging: boolean;
  /** 마지막으로 복습 목록을 연 회차의 날짜. 없으면 null */
  lastViewedDate: string | null;
};

/** 한 과정의 강사 녹음 허용 상태. */
export type ConsentStatus = {
  instructorName: string;
  instructorEmail: string;
  consentedAt: Date | null;
  /** 안내를 보낸 횟수. 한 번도 안 보냈으면 0이다. */
  reminderCount: number;
  /** 확정된 목차 항목 수. */
  tocCount: number;
};

export type InstitutionView = {
  institutionName: string;
  courses: Array<{
    id: string;
    name: string;
    lectureDays: number;
    consent: ConsentStatus;
    learners: LaggingLearner[];
  }>;
};

/**
 * 담당자가 속한 기관의 과정과 수강생 현황을 읽는다.
 *
 * 담당자 식별자로 기관을 찾고 그 기관의 과정만 읽는다.
 * 다른 기관의 과정은 조회 자체가 일어나지 않는다.
 */
export async function readInstitutionView(
  adminId: string,
): Promise<InstitutionView | null> {
  const admin = await prisma.institutionAdmin.findUnique({
    where: { id: adminId },
    include: { institution: true },
  });

  if (!admin) return null;

  const courses = await prisma.course.findMany({
    where: { institutionId: admin.institutionId },
    orderBy: { startDate: "asc" },
    include: {
      instructor: true,
      consents: true,
      sessions: { select: { id: true, date: true } },
      enrollments: {
        where: { leftOn: null },
        include: { learner: { select: { id: true, name: true } } },
      },
      _count: { select: { tocItems: true } },
    },
  });

  return {
    institutionName: admin.institution.name,
    courses: await Promise.all(
      courses.map(async (course) => {
        // 강의가 올라온 날. 이 날들만 센다.
        const lectureDates = course.sessions.map((s) => toDateOnly(s.date));
        const dateBySessionId = new Map(
          course.sessions.map((s) => [s.id, toDateOnly(s.date)]),
        );

        const views = await prisma.listView.findMany({
          where: {
            learnerId: { in: course.enrollments.map((e) => e.learnerId) },
            sessionId: { in: course.sessions.map((s) => s.id) },
          },
          select: { learnerId: true, sessionId: true },
        });

        const viewedByLearner = new Map<string, string[]>();
        for (const view of views) {
          const date = dateBySessionId.get(view.sessionId);
          if (!date) continue;
          const list = viewedByLearner.get(view.learnerId) ?? [];
          list.push(date);
          viewedByLearner.set(view.learnerId, list);
        }

        const learners: LaggingLearner[] = course.enrollments
          .map((enrollment) => {
            const viewed = viewedByLearner.get(enrollment.learnerId) ?? [];
            const missedDays = consecutiveMissedDays(lectureDates, viewed);
            const sorted = [...new Set(viewed)].sort();

            return {
              learnerId: enrollment.learnerId,
              name: enrollment.learner.name,
              missedDays,
              lagging: missedDays >= LAG_THRESHOLD_DAYS,
              lastViewedDate: sorted[sorted.length - 1] ?? null,
            };
          })
          .sort((a, b) => b.missedDays - a.missedDays);

        const consent = course.consents[0] ?? null;

        return {
          id: course.id,
          name: course.name,
          lectureDays: new Set(lectureDates).size,
          consent: {
            instructorName: course.instructor.name,
            instructorEmail: course.instructor.email,
            consentedAt: consent?.consentedAt ?? null,
            reminderCount: consent?.reminderCount ?? 0,
            tocCount: course._count.tocItems,
          },
          learners,
        };
      }),
    ),
  };
}
