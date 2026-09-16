import { isExpired, transientCutoff } from "@/domain/retention";
import { prisma } from "@/lib/prisma";

/**
 * 보관 기간이 지난 것을 지우는 예약 작업.
 *
 * 무엇을 언제 지울지는 도메인 규칙이 정한다. 여기서는 그것을 불러
 * 저장소에 반영하는 일만 한다.
 *
 * 배포한 뒤에는 `pg_cron`이 하루에 한 번 부른다.
 */

export type CleanupReport = {
  /** 지운 강의 기록 수 */
  transcripts: number;
  /** 지운 목차 항목 수 */
  tocItems: number;
  /** 지운 예외 경로 음성 수 */
  audio: number;
  /** 기한을 넘겨 지운 학습 자료 원본 수 */
  materials: number;
  /** 기한을 넘긴 채 남아 있던 것. 경보로 남긴다 */
  overdue: string[];
};

export async function runCleanup(now: Date = new Date()): Promise<CleanupReport> {
  const report: CleanupReport = {
    transcripts: 0,
    tocItems: 0,
    audio: 0,
    materials: 0,
    overdue: [],
  };

  // 보관 기간이 지난 과정의 강의 기록과 목차를 지운다.
  const courses = await prisma.course.findMany({
    select: { id: true, name: true, endDate: true },
  });

  for (const course of courses) {
    if (!isExpired(course.endDate, now)) continue;

    const transcripts = await prisma.transcript.deleteMany({
      where: { segment: { session: { courseId: course.id } } },
    });
    report.transcripts += transcripts.count;

    // 목차를 지우면 붙어 있던 말은 남고 붙은 항목만 비워진다.
    const tocItems = await prisma.tocItem.deleteMany({
      where: { courseId: course.id },
    });
    report.tocItems += tocItems.count;
  }

  // 잠시만 두기로 한 것 가운데 기한을 넘긴 것을 지운다.
  const cutoff = transientCutoff(now);

  const staleAudio = await prisma.audioIntake.findMany({
    where: { deletedAt: null, receivedAt: { lte: cutoff } },
    select: { id: true, receivedAt: true },
  });

  for (const intake of staleAudio) {
    await prisma.audioIntake.update({
      where: { id: intake.id },
      data: { deletedAt: now },
    });
    report.audio += 1;
    report.overdue.push(
      `예외 경로 음성 ${intake.id} — ${intake.receivedAt.toISOString()}에 들어와 기한을 넘겼습니다.`,
    );
  }

  const staleMaterials = await prisma.courseMaterial.findMany({
    where: { deletedAt: null, receivedAt: { lte: cutoff } },
    select: { id: true, receivedAt: true, sourceName: true },
  });

  for (const material of staleMaterials) {
    await prisma.courseMaterial.update({
      where: { id: material.id },
      data: { deletedAt: now },
    });
    report.materials += 1;
    report.overdue.push(
      `학습 자료 ${material.sourceName} — ${material.receivedAt.toISOString()}에 들어와 기한을 넘겼습니다.`,
    );
  }

  return report;
}
