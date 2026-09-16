import { describe, expect, it } from "vitest";
import {
  RETENTION_MONTHS,
  TRANSIENT_HOURS,
  isExpired,
  isOverdue,
  retentionDeadline,
  transientCutoff,
} from "./retention";

const HOUR = 60 * 60 * 1000;

describe("retentionDeadline", () => {
  it("과정 종료일에서 보관 기간만큼 뒤가 기한이다", () => {
    expect(retentionDeadline(new Date("2026-08-28T00:00:00Z"))).toEqual(
      new Date("2027-02-28T00:00:00Z"),
    );
  });

  it("보관 기간은 6개월이다", () => {
    expect(RETENTION_MONTHS).toBe(6);
  });
});

describe("isExpired", () => {
  const end = new Date("2026-08-28T00:00:00Z");

  it("기한 전이면 지우지 않는다", () => {
    expect(isExpired(end, new Date("2027-02-27T00:00:00Z"))).toBe(false);
  });

  it("기한이 되면 지운다", () => {
    expect(isExpired(end, new Date("2027-02-28T00:00:00Z"))).toBe(true);
  });

  it("기한을 한참 넘겨도 지운다", () => {
    expect(isExpired(end, new Date("2028-01-01T00:00:00Z"))).toBe(true);
  });
});

describe("isOverdue", () => {
  const now = new Date("2026-09-16T12:00:00Z");

  it("이미 지운 것은 대상이 아니다", () => {
    const received = new Date(now.getTime() - 100 * HOUR);
    expect(isOverdue(received, new Date(), now)).toBe(false);
  });

  it("아직 기한 안이면 대상이 아니다", () => {
    const received = new Date(now.getTime() - (TRANSIENT_HOURS - 1) * HOUR);
    expect(isOverdue(received, null, now)).toBe(false);
  });

  it("기한을 넘겼는데 지우지 않았으면 대상이다", () => {
    const received = new Date(now.getTime() - TRANSIENT_HOURS * HOUR);
    expect(isOverdue(received, null, now)).toBe(true);
  });
});

describe("transientCutoff", () => {
  it("지금에서 기한만큼 앞선 시각이다", () => {
    const now = new Date("2026-09-16T12:00:00Z");
    expect(transientCutoff(now)).toEqual(new Date("2026-09-15T12:00:00Z"));
  });

  it("이 시각보다 앞서 들어온 것이 곧 기한을 넘긴 것이다", () => {
    const now = new Date("2026-09-16T12:00:00Z");
    const cutoff = transientCutoff(now);
    const received = new Date(cutoff.getTime() - 1);

    expect(isOverdue(received, null, now)).toBe(true);
  });
});
