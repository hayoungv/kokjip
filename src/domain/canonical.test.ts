import { describe, expect, it } from "vitest";
import { planProcessing } from "./canonical";
import type { Segment, TimeRange } from "./types";

function at(hhmm: string): Date {
  return new Date(`2026-03-02T${hhmm}:00+09:00`);
}

function range(from: string, to: string): TimeRange {
  return { fromAt: at(from), toAt: at(to) };
}

function segment(from: string, to: string, gaps: TimeRange[] = []): Segment {
  return { startedAt: at(from), endedAt: at(to), gaps };
}

function show(ranges: TimeRange[]): string[] {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

  return ranges.map((r) => `${fmt(r.fromAt)}~${fmt(r.toAt)}`);
}

describe("planProcessing — 정본 선정과 처리 대상 산출", () => {
  it("첫 조각은 정본이 되고 전체가 처리 대상이다", () => {
    const plan = planProcessing(segment("09:00", "11:00"), []);

    expect(plan.isCanonical).toBe(true);
    expect(show(plan.rangesToProcess)).toEqual(["09:00~11:00"]);
    expect(show(plan.nextCoveredRanges)).toEqual(["09:00~11:00"]);
  });

  it("두 번째 조각은 정본이 아니다", () => {
    const plan = planProcessing(segment("09:00", "11:00"), [
      range("09:00", "11:00"),
    ]);

    expect(plan.isCanonical).toBe(false);
  });

  it("정본과 똑같은 구간이면 처리할 것이 없다", () => {
    const plan = planProcessing(segment("09:00", "11:00"), [
      range("09:00", "11:00"),
    ]);

    expect(plan.rangesToProcess).toEqual([]);
    expect(show(plan.nextCoveredRanges)).toEqual(["09:00~11:00"]);
  });

  it("정본보다 늦게 시작한 조각은 처리할 것이 없다", () => {
    const plan = planProcessing(segment("09:30", "10:30"), [
      range("09:00", "11:00"),
    ]);

    expect(plan.rangesToProcess).toEqual([]);
  });

  it("정본보다 일찍 시작하면 앞부분만 처리한다", () => {
    const plan = planProcessing(segment("08:30", "11:00"), [
      range("09:00", "11:00"),
    ]);

    expect(show(plan.rangesToProcess)).toEqual(["08:30~09:00"]);
    expect(show(plan.nextCoveredRanges)).toEqual(["08:30~11:00"]);
  });

  it("정본보다 늦게 끝나면 뒷부분만 처리한다", () => {
    const plan = planProcessing(segment("09:00", "12:00"), [
      range("09:00", "11:00"),
    ]);

    expect(show(plan.rangesToProcess)).toEqual(["11:00~12:00"]);
    expect(show(plan.nextCoveredRanges)).toEqual(["09:00~12:00"]);
  });

  it("앞뒤로 모두 더 길면 양쪽을 처리한다", () => {
    const plan = planProcessing(segment("08:30", "12:00"), [
      range("09:00", "11:00"),
    ]);

    expect(show(plan.rangesToProcess)).toEqual(["08:30~09:00", "11:00~12:00"]);
    expect(show(plan.nextCoveredRanges)).toEqual(["08:30~12:00"]);
  });

  it("정본이 중간에 끊겼으면 그 구멍을 메운다", () => {
    const plan = planProcessing(segment("09:00", "12:00"), [
      range("09:00", "10:00"),
      range("11:00", "12:00"),
    ]);

    expect(show(plan.rangesToProcess)).toEqual(["10:00~11:00"]);
    expect(show(plan.nextCoveredRanges)).toEqual(["09:00~12:00"]);
  });

  it("이 조각이 멈춘 구간은 처리 대상에서 빠진다", () => {
    const plan = planProcessing(
      segment("09:00", "12:00", [range("10:00", "10:30")]),
      [],
    );

    expect(show(plan.rangesToProcess)).toEqual(["09:00~10:00", "10:30~12:00"]);
  });

  it("같은 조각을 두 번 넣어도 처리 대상이 늘지 않는다", () => {
    const first = planProcessing(segment("09:00", "11:00"), []);
    const second = planProcessing(
      segment("09:00", "11:00"),
      first.nextCoveredRanges,
    );

    expect(second.rangesToProcess).toEqual([]);
    expect(show(second.nextCoveredRanges)).toEqual(
      show(first.nextCoveredRanges),
    );
  });

  it("조각 세 개를 차례로 넣어도 총량이 합집합을 넘지 않는다", () => {
    let covered: TimeRange[] = [];
    const processed: TimeRange[] = [];

    for (const seg of [
      segment("09:00", "11:00"),
      segment("10:00", "12:00"),
      segment("08:00", "13:00"),
    ]) {
      const plan = planProcessing(seg, covered);
      processed.push(...plan.rangesToProcess);
      covered = plan.nextCoveredRanges;
    }

    // 세 조각의 합집합은 08:00~13:00 이고, 처리한 총량도 그것과 같아야 한다.
    expect(show(covered)).toEqual(["08:00~13:00"]);

    const processedMs = processed.reduce(
      (sum, r) => sum + (r.toAt.getTime() - r.fromAt.getTime()),
      0,
    );
    expect(processedMs).toBe(5 * 60 * 60 * 1000);
  });
});
