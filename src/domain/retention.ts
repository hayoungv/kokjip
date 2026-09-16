/**
 * 보관 기간 규칙.
 *
 * 무엇을 언제 지울지는 여기서만 정한다. 예약 작업은 이 규칙을 불러 쓴다.
 * 지우는 일은 되돌릴 수 없으므로 판정을 한곳에 모아 둔다.
 */

/** 강의 기록과 목차를 과정이 끝난 뒤 이만큼 두고 지운다. */
export const RETENTION_MONTHS = 6;

/** 예외 경로로 들어온 음성과 학습 자료 원본을 이 안에 지운다. */
export const TRANSIENT_HOURS = 24;

const HOUR = 60 * 60 * 1000;

/** 과정 종료일에서 보관 기간이 끝나는 날. */
export function retentionDeadline(courseEndDate: Date): Date {
  const deadline = new Date(courseEndDate);
  deadline.setMonth(deadline.getMonth() + RETENTION_MONTHS);
  return deadline;
}

/** 이 과정의 보관 기간이 지났는지. */
export function isExpired(courseEndDate: Date, now: Date = new Date()): boolean {
  return now.getTime() >= retentionDeadline(courseEndDate).getTime();
}

/**
 * 잠시만 두기로 한 것이 너무 오래 남아 있는지.
 *
 * 이미 지운 것은 대상이 아니다. 지우지 못한 채 24시간을 넘긴 것만
 * 찾아내 지우고 경보를 남긴다.
 */
export function isOverdue(
  receivedAt: Date,
  deletedAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (deletedAt !== null) return false;
  return now.getTime() - receivedAt.getTime() >= TRANSIENT_HOURS * HOUR;
}

/** 지금 기준으로 잠시 두기의 기한이 되는 시각. */
export function transientCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - TRANSIENT_HOURS * HOUR);
}
