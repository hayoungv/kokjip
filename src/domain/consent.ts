/**
 * 강사 녹음 허용에 관한 규칙.
 *
 * 강사는 계정이 없다. 주소 하나가 신원이자 권한이므로, 그 주소가
 * 언제까지 열려 있는지와 언제 다시 안내할지를 여기서 정한다.
 */

/** 동의하지 않은 강사에게 다시 안내하는 간격. */
export const REMINDER_INTERVAL_DAYS = 3;

/** 다시 안내하는 횟수의 상한. 이 뒤로는 훈련기관이 직접 챙긴다. */
export const MAX_REMINDERS = 3;

export type ConsentState = {
  consentedAt: Date | null;
  tokenExpiresAt: Date;
  /** 마지막으로 안내한 시각. 한 번도 없으면 `null`이다. */
  lastNotifiedAt: Date | null;
  /** 지금까지 안내한 횟수. */
  reminderCount: number;
};

/** 이 주소가 지금 열려 있는지. */
export function isOpen(consent: ConsentState, now: Date = new Date()): boolean {
  return consent.tokenExpiresAt.getTime() > now.getTime();
}

/**
 * 지금 다시 안내할 때인지.
 *
 * 이미 동의했거나, 주소의 기간이 지났거나, 안내 횟수를 다 썼거나,
 * 마지막 안내로부터 간격이 차지 않았으면 보내지 않는다.
 */
export function needsReminder(
  consent: ConsentState,
  now: Date = new Date(),
): boolean {
  if (consent.consentedAt !== null) return false;
  if (!isOpen(consent, now)) return false;
  if (consent.reminderCount >= MAX_REMINDERS) return false;
  if (consent.lastNotifiedAt === null) return true;

  const elapsed = now.getTime() - consent.lastNotifiedAt.getTime();
  return elapsed >= REMINDER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
}
