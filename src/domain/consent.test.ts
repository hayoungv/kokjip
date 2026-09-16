import { describe, expect, it } from "vitest";
import {
  MAX_REMINDERS,
  REMINDER_INTERVAL_DAYS,
  isOpen,
  needsReminder,
  type ConsentState,
} from "./consent";

const NOW = new Date("2026-09-16T09:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function state(overrides: Partial<ConsentState> = {}): ConsentState {
  return {
    consentedAt: null,
    tokenExpiresAt: new Date(NOW.getTime() + 7 * DAY),
    lastNotifiedAt: null,
    reminderCount: 0,
    ...overrides,
  };
}

describe("isOpen", () => {
  it("기간이 남아 있으면 열려 있다", () => {
    expect(isOpen(state(), NOW)).toBe(true);
  });

  it("기간이 지나면 닫힌다", () => {
    expect(isOpen(state({ tokenExpiresAt: new Date(NOW.getTime() - 1) }), NOW)).toBe(false);
  });

  it("끝나는 그 순간은 닫힌 것으로 본다", () => {
    expect(isOpen(state({ tokenExpiresAt: NOW }), NOW)).toBe(false);
  });
});

describe("needsReminder", () => {
  it("한 번도 안내하지 않았으면 보낸다", () => {
    expect(needsReminder(state(), NOW)).toBe(true);
  });

  it("이미 동의했으면 보내지 않는다", () => {
    expect(needsReminder(state({ consentedAt: new Date(NOW.getTime() - DAY) }), NOW)).toBe(false);
  });

  it("주소의 기간이 지났으면 보내지 않는다", () => {
    const expired = state({ tokenExpiresAt: new Date(NOW.getTime() - DAY) });
    expect(needsReminder(expired, NOW)).toBe(false);
  });

  it("간격이 차지 않았으면 보내지 않는다", () => {
    const recent = state({
      lastNotifiedAt: new Date(NOW.getTime() - (REMINDER_INTERVAL_DAYS - 1) * DAY),
      reminderCount: 1,
    });
    expect(needsReminder(recent, NOW)).toBe(false);
  });

  it("간격이 차면 보낸다", () => {
    const due = state({
      lastNotifiedAt: new Date(NOW.getTime() - REMINDER_INTERVAL_DAYS * DAY),
      reminderCount: 1,
    });
    expect(needsReminder(due, NOW)).toBe(true);
  });

  it("안내 횟수를 다 쓰면 보내지 않는다", () => {
    const done = state({
      lastNotifiedAt: new Date(NOW.getTime() - 30 * DAY),
      reminderCount: MAX_REMINDERS,
    });
    expect(needsReminder(done, NOW)).toBe(false);
  });

  it("마지막 한 번은 아직 남아 있다", () => {
    const last = state({
      lastNotifiedAt: new Date(NOW.getTime() - 30 * DAY),
      reminderCount: MAX_REMINDERS - 1,
    });
    expect(needsReminder(last, NOW)).toBe(true);
  });
});
