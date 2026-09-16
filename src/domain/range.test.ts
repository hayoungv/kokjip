import { describe, expect, it } from "vitest";
import {
  containsAt,
  lengthMs,
  mergeRanges,
  segmentCoverage,
  subtractRanges,
  totalLengthMs,
} from "./range";
import type { TimeRange } from "./types";

/** 읽기 쉽게 시각을 만든다. 기준 날짜는 2026년 3월 2일이다. */
function at(hhmm: string): Date {
  return new Date(`2026-03-02T${hhmm}:00+09:00`);
}

function range(from: string, to: string): TimeRange {
  return { fromAt: at(from), toAt: at(to) };
}

/** 구간을 읽기 쉬운 문자열로 바꾼다. */
function show(ranges: TimeRange[]): string[] {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);

  return ranges.map((r) => `${fmt(r.fromAt)}~${fmt(r.toAt)}`);
}

describe("mergeRanges — 구간 정리", () => {
  it("겹치는 구간을 하나로 합친다", () => {
    const merged = mergeRanges([range("09:00", "10:00"), range("09:30", "11:00")]);
    expect(show(merged)).toEqual(["09:00~11:00"]);
  });

  it("맞닿은 구간을 하나로 합친다", () => {
    const merged = mergeRanges([range("09:00", "10:00"), range("10:00", "11:00")]);
    expect(show(merged)).toEqual(["09:00~11:00"]);
  });

  it("떨어진 구간은 따로 둔다", () => {
    const merged = mergeRanges([range("09:00", "10:00"), range("10:30", "11:00")]);
    expect(show(merged)).toEqual(["09:00~10:00", "10:30~11:00"]);
  });

  it("순서가 뒤섞여 들어와도 정리한다", () => {
    const merged = mergeRanges([
      range("10:30", "11:00"),
      range("09:00", "09:30"),
      range("09:20", "10:00"),
    ]);
    expect(show(merged)).toEqual(["09:00~10:00", "10:30~11:00"]);
  });

  it("하나가 다른 하나를 완전히 품으면 큰 쪽만 남는다", () => {
    const merged = mergeRanges([range("09:00", "12:00"), range("10:00", "11:00")]);
    expect(show(merged)).toEqual(["09:00~12:00"]);
  });

  it("길이가 없는 구간은 버린다", () => {
    const merged = mergeRanges([range("09:00", "09:00"), range("10:00", "11:00")]);
    expect(show(merged)).toEqual(["10:00~11:00"]);
  });

  it("빈 목록을 넣으면 빈 목록이 나온다", () => {
    expect(mergeRanges([])).toEqual([]);
  });
});

describe("subtractRanges — 덮인 범위 차집합", () => {
  it("빼낼 것이 없으면 그대로 돌려준다", () => {
    const left = subtractRanges(range("09:00", "11:00"), []);
    expect(show(left)).toEqual(["09:00~11:00"]);
  });

  it("앞쪽이 덮여 있으면 뒤만 남는다", () => {
    const left = subtractRanges(range("09:00", "11:00"), [range("09:00", "10:00")]);
    expect(show(left)).toEqual(["10:00~11:00"]);
  });

  it("뒤쪽이 덮여 있으면 앞만 남는다", () => {
    const left = subtractRanges(range("09:00", "11:00"), [range("10:00", "11:00")]);
    expect(show(left)).toEqual(["09:00~10:00"]);
  });

  it("가운데가 덮여 있으면 두 녹음으로 갈라진다", () => {
    const left = subtractRanges(range("09:00", "12:00"), [range("10:00", "11:00")]);
    expect(show(left)).toEqual(["09:00~10:00", "11:00~12:00"]);
  });

  it("완전히 덮여 있으면 아무것도 남지 않는다", () => {
    const left = subtractRanges(range("10:00", "11:00"), [range("09:00", "12:00")]);
    expect(left).toEqual([]);
  });

  it("덮인 구간이 밖에 있으면 영향이 없다", () => {
    const left = subtractRanges(range("09:00", "10:00"), [range("11:00", "12:00")]);
    expect(show(left)).toEqual(["09:00~10:00"]);
  });

  it("덮인 구간이 여럿이면 남은 녹음도 여럿이다", () => {
    const left = subtractRanges(range("09:00", "13:00"), [
      range("10:00", "10:30"),
      range("11:00", "11:30"),
    ]);
    expect(show(left)).toEqual(["09:00~10:00", "10:30~11:00", "11:30~13:00"]);
  });

  it("덮인 구간이 겹쳐 들어와도 바르게 뺀다", () => {
    const left = subtractRanges(range("09:00", "12:00"), [
      range("10:00", "11:00"),
      range("10:30", "11:30"),
    ]);
    expect(show(left)).toEqual(["09:00~10:00", "11:30~12:00"]);
  });

  it("같은 구간을 두 번 빼도 결과가 같다", () => {
    const once = subtractRanges(range("09:00", "12:00"), [range("10:00", "11:00")]);
    const twice = subtractRanges(range("09:00", "12:00"), [
      range("10:00", "11:00"),
      range("10:00", "11:00"),
    ]);
    expect(show(once)).toEqual(show(twice));
  });

  it("길이가 없는 구간에서 빼면 아무것도 남지 않는다", () => {
    expect(subtractRanges(range("09:00", "09:00"), [])).toEqual([]);
  });
});

describe("segmentCoverage — 녹음에서 소리가 있는 구간", () => {
  it("멈춘 적이 없으면 통째로 하나다", () => {
    const coverage = segmentCoverage({
      startedAt: at("09:00"),
      endedAt: at("11:00"),
      gaps: [],
    });
    expect(show(coverage)).toEqual(["09:00~11:00"]);
  });

  it("중간에 멈춘 구간은 빠진다", () => {
    const coverage = segmentCoverage({
      startedAt: at("09:00"),
      endedAt: at("12:00"),
      gaps: [range("10:00", "10:30")],
    });
    expect(show(coverage)).toEqual(["09:00~10:00", "10:30~12:00"]);
  });

  it("멈춘 구간이 여럿이면 여러 녹음으로 갈라진다", () => {
    const coverage = segmentCoverage({
      startedAt: at("09:00"),
      endedAt: at("13:00"),
      gaps: [range("10:00", "10:30"), range("11:00", "12:00")],
    });
    expect(show(coverage)).toEqual([
      "09:00~10:00",
      "10:30~11:00",
      "12:00~13:00",
    ]);
  });
});

describe("containsAt — 어떤 시각이 구간 안에 있는지", () => {
  const ranges = [range("09:00", "10:00"), range("11:00", "12:00")];

  it("구간 안이면 참이다", () => {
    expect(containsAt(ranges, at("09:30"))).toBe(true);
  });

  it("구간 밖이면 거짓이다", () => {
    expect(containsAt(ranges, at("10:30"))).toBe(false);
  });

  it("시작 시각은 안에 든다", () => {
    expect(containsAt(ranges, at("09:00"))).toBe(true);
  });

  it("끝 시각은 안에 들지 않는다", () => {
    expect(containsAt(ranges, at("10:00"))).toBe(false);
  });
});

describe("길이 계산", () => {
  it("한 구간의 길이를 잰다", () => {
    expect(lengthMs(range("09:00", "10:00"))).toBe(60 * 60 * 1000);
  });

  it("겹치는 구간은 한 번만 센다", () => {
    const total = totalLengthMs([range("09:00", "10:00"), range("09:30", "11:00")]);
    expect(total).toBe(2 * 60 * 60 * 1000);
  });
});
