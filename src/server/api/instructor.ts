import { needsReminder } from "@/domain/consent";
import { toDateOnly } from "@/domain/lag";
import { normalizeToc, parseTocText, withParents, type TocItem } from "@/domain/toc";
import { createToken, expiresAt, hashToken } from "@/lib/instructor-token";
import { sendConsentInvite } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { readMaterial, type MaterialInput } from "@/server/material/read-material";

/**
 * 강사 전용 주소에서 일어나는 일.
 *
 * 강사는 계정이 없다. 주소에 담긴 값 하나가 신원이자 권한이다.
 * 모든 처리가 그 값으로 시작하고, 값이 맞지 않거나 기간이 지났으면
 * 아무 일도 일어나지 않는다.
 */

export type InstructorView = {
  instructorName: string;
  course: { id: string; name: string; startDate: Date; endDate: Date };
  consentedAt: Date | null;
  material: {
    kind: string;
    sourceName: string;
    receivedAt: Date;
    confirmedAt: Date | null;
    deletedAt: Date | null;
  } | null;
  toc: TocItem[];
  sessions: Array<{
    id: string;
    date: Date;
    blockedAt: Date | null;
    segmentCount: number;
  }>;
};

/** 주소의 값으로 강사가 보는 것 전부를 읽는다. 열리지 않으면 `null`이다. */
export async function readInstructorView(token: string): Promise<InstructorView | null> {
  const consent = await prisma.recordingConsent.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      instructor: true,
      course: {
        include: {
          materials: { orderBy: { receivedAt: "desc" }, take: 1 },
          tocItems: { orderBy: { order: "asc" } },
          sessions: {
            orderBy: { date: "desc" },
            include: { _count: { select: { segments: true } } },
          },
        },
      },
    },
  });

  if (!consent) return null;
  if (consent.tokenExpiresAt.getTime() < Date.now()) return null;

  const material = consent.course.materials[0] ?? null;

  return {
    instructorName: consent.instructor.name,
    course: {
      id: consent.course.id,
      name: consent.course.name,
      startDate: consent.course.startDate,
      endDate: consent.course.endDate,
    },
    consentedAt: consent.consentedAt,
    material: material
      ? {
          kind: material.kind,
          sourceName: material.sourceName,
          receivedAt: material.receivedAt,
          confirmedAt: material.confirmedAt,
          deletedAt: material.deletedAt,
        }
      : null,
    toc: consent.course.tocItems.map((i) => ({
      title: i.title,
      depth: i.depth,
      order: i.order,
    })),
    sessions: consent.course.sessions.map((s) => ({
      id: s.id,
      date: s.date,
      blockedAt: s.blockedAt,
      segmentCount: s._count.segments,
    })),
  };
}

/** 주소가 가리키는 녹음 허용을 찾는다. 열리지 않으면 `null`이다. */
async function findConsent(token: string) {
  const consent = await prisma.recordingConsent.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!consent) return null;
  if (consent.tokenExpiresAt.getTime() < Date.now()) return null;
  return consent;
}

/** 강사가 녹음 허용에 동의한다. 이미 동의했으면 그대로 둔다. */
export async function giveConsent(token: string): Promise<boolean> {
  const consent = await findConsent(token);
  if (!consent) return false;
  if (consent.consentedAt) return true;

  await prisma.recordingConsent.update({
    where: { id: consent.id },
    data: { consentedAt: new Date() },
  });
  return true;
}

/** 강사가 한 회차를 닫거나 다시 연다. */
export async function setSessionBlocked(
  token: string,
  sessionId: string,
  blocked: boolean,
): Promise<boolean> {
  const consent = await findConsent(token);
  if (!consent) return false;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.courseId !== consent.courseId) return false;

  await prisma.session.update({
    where: { id: sessionId },
    data: { blockedAt: blocked ? new Date() : null },
  });
  return true;
}

export type MaterialOutcome =
  | { ok: true; items: TocItem[] }
  | { ok: false; message: string };

/**
 * 학습 자료를 받아 목차를 읽는다.
 *
 * 목차를 읽고 나면 원본은 서버에 남지 않는다. 데이터베이스에 넣지 않고
 * 읽는 동안만 메모리에 두기 때문이다. 여기 남는 것은 어디서 왔는지와
 * 언제 들어왔는지뿐이다.
 *
 * 읽어 낸 목차를 아직 저장하지 않는다. 강사가 보고 고쳐 확인해야
 * 목차가 된다.
 */
export async function submitMaterial(
  token: string,
  input: MaterialInput,
): Promise<MaterialOutcome> {
  const consent = await findConsent(token);
  if (!consent) return { ok: false, message: "이 주소는 열리지 않습니다." };

  const outcome = await readMaterial(input);

  await prisma.courseMaterial.create({
    data: {
      courseId: consent.courseId,
      kind: input.kind,
      sourceName: outcome.sourceName.slice(0, 500),
      // 원본을 담은 적이 없으므로 이 자리에서 지워진 것으로 친다.
      deletedAt: new Date(),
      failedAt: outcome.ok ? null : new Date(),
    },
  });

  if (!outcome.ok) return { ok: false, message: outcome.message };
  return { ok: true, items: outcome.items };
}

/**
 * 강사가 확인한 목차를 확정한다.
 *
 * 이전 목차를 지우고 새 목차를 넣는다. 이전 목차를 가리키던 것들은
 * 데이터베이스가 함께 정리한다. 다룬 구간은 지워지고,
 * 강조한 말에 붙어 있던 항목은 비워진다.
 */
export async function confirmToc(token: string, text: string): Promise<MaterialOutcome> {
  const consent = await findConsent(token);
  if (!consent) return { ok: false, message: "이 주소는 열리지 않습니다." };

  const items = parseTocText(text);
  if (items.length === 0) return { ok: false, message: "목차가 비어 있습니다." };

  await prisma.$transaction(async (tx) => {
    await tx.tocItem.deleteMany({ where: { courseId: consent.courseId } });

    // 부모를 먼저 만들어야 자식이 부모를 가리킬 수 있다.
    const ids: string[] = [];
    for (const item of withParents(items)) {
      const created = await tx.tocItem.create({
        data: {
          courseId: consent.courseId,
          parentId: item.parentIndex === null ? null : ids[item.parentIndex],
          order: item.order,
          depth: item.depth,
          title: item.title,
        },
      });
      ids.push(created.id);
    }

    await tx.courseMaterial.updateMany({
      where: { courseId: consent.courseId, confirmedAt: null },
      data: { confirmedAt: new Date() },
    });
  });

  return { ok: true, items: normalizeToc(items) };
}

/** 이 과정의 목차를 모두 지운다. */
export async function clearToc(token: string): Promise<boolean> {
  const consent = await findConsent(token);
  if (!consent) return false;

  await prisma.tocItem.deleteMany({ where: { courseId: consent.courseId } });
  return true;
}

/** 회차 목록에 붙일 날짜 표기. */
export function sessionLabel(date: Date): string {
  return toDateOnly(date);
}

/* ------------------------------------------------------------------ *
 * 안내 보내기
 * ------------------------------------------------------------------ */

export type InviteResult = {
  /** 발급한 주소. 이 자리에서만 볼 수 있다. */
  url: string;
  sent: boolean;
  message: string;
};

/**
 * 강사에게 전용 주소가 담긴 안내를 보낸다.
 *
 * 주소는 부를 때마다 새로 만든다. 이전 주소는 그 순간 열리지 않는다.
 * 발송 서비스가 연결되어 있지 않으면 주소를 그대로 돌려주어
 * 훈련기관이 직접 전할 수 있게 한다.
 */
export async function inviteInstructor(
  courseId: string,
  baseUrl: string,
): Promise<InviteResult | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { instructor: true },
  });
  if (!course) return null;

  const token = createToken();

  await prisma.recordingConsent.upsert({
    where: {
      instructorId_courseId: {
        instructorId: course.instructorId,
        courseId: course.id,
      },
    },
    create: {
      instructorId: course.instructorId,
      courseId: course.id,
      tokenHash: hashToken(token),
      tokenExpiresAt: expiresAt(),
      lastNotifiedAt: new Date(),
      reminderCount: 1,
    },
    update: {
      tokenHash: hashToken(token),
      tokenExpiresAt: expiresAt(),
      lastNotifiedAt: new Date(),
      reminderCount: { increment: 1 },
    },
  });

  const url = `${baseUrl.replace(/\/$/, "")}/instructor/${token}`;
  const result = await sendConsentInvite(course.instructor.email, course.instructor.name, url);

  return {
    url,
    sent: result.sent,
    message: result.sent
      ? `${course.instructor.email}로 안내를 보냈습니다.`
      : result.message,
  };
}

/**
 * 동의하지 않은 강사에게 정해진 간격으로 다시 안내한다.
 *
 * 예약 작업이 부른다. 보낼 때가 되었는지는 도메인 규칙이 정한다.
 */
export async function runConsentReminders(baseUrl: string): Promise<number> {
  const pending = await prisma.recordingConsent.findMany({
    where: { consentedAt: null },
    include: { instructor: true },
  });

  const now = new Date();
  let sent = 0;

  for (const consent of pending) {
    const due = needsReminder(
      {
        consentedAt: consent.consentedAt,
        tokenExpiresAt: consent.tokenExpiresAt,
        lastNotifiedAt: consent.lastNotifiedAt,
        reminderCount: consent.reminderCount,
      },
      now,
    );
    if (!due) continue;

    // 이전 주소가 아직 열려 있으므로 새로 만들지 않는다. 같은 주소로 다시 안내한다.
    // 주소 자체는 요약본만 두므로 되살릴 수 없다. 새 주소를 발급해 보낸다.
    const token = createToken();
    await prisma.recordingConsent.update({
      where: { id: consent.id },
      data: {
        tokenHash: hashToken(token),
        tokenExpiresAt: expiresAt(now),
        lastNotifiedAt: now,
        reminderCount: { increment: 1 },
      },
    });

    await sendConsentInvite(
      consent.instructor.email,
      consent.instructor.name,
      `${baseUrl.replace(/\/$/, "")}/instructor/${token}`,
    );
    sent += 1;
  }

  return sent;
}

/* ------------------------------------------------------------------ *
 * 학습자 쪽에서 묻는 것
 * ------------------------------------------------------------------ */

export type RecordingPermission = {
  allowed: boolean;
  reason: "ok" | "no-enrollment" | "no-consent" | "blocked";
  message: string;
};

/**
 * 오늘 이 학습자가 녹음할 수 있는지.
 *
 * 강사가 동의하지 않았거나 그날 회차를 막았으면 녹음 버튼이 열리지 않는다.
 */
export async function canRecordOn(
  learnerId: string,
  date: Date,
): Promise<RecordingPermission> {
  const enrollment = await prisma.enrollment.findFirst({
    where: { learnerId, leftOn: null },
  });
  if (!enrollment) {
    return { allowed: false, reason: "no-enrollment", message: "속한 과정이 없습니다." };
  }

  const consent = await prisma.recordingConsent.findFirst({
    where: { courseId: enrollment.courseId, consentedAt: { not: null } },
  });
  if (!consent) {
    return {
      allowed: false,
      reason: "no-consent",
      message: "강사가 아직 녹음을 허용하지 않았습니다.",
    };
  }

  const day = new Date(`${toDateOnly(date)}T00:00:00Z`);
  const session = await prisma.session.findUnique({
    where: { courseId_date: { courseId: enrollment.courseId, date: day } },
  });

  if (session?.blockedAt) {
    return {
      allowed: false,
      reason: "blocked",
      message: "강사가 이 회차의 녹음을 막았습니다.",
    };
  }

  return { allowed: true, reason: "ok", message: "녹음할 수 있습니다." };
}
