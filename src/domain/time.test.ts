import { describe, expect, it } from "vitest";
import {
  elapsedInSegment,
  formatElapsed,
  toDeviceTime,
  toRealTime,
} from "./time";
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

const MINUTE = 60 * 1000;

describe("toRealTime — 기기 시각을 실제 시각으로", () => {
  it("시계가 맞으면 그대로다", () => {
    expect(toRealTime(at("09:00"), 0).getTime()).toBe(at("09:00").getTime());
  });

  it("기기가 5분 앞서 있으면 5분을 뺀다", () => {
    const real = toRealTime(at("09:05"), 5 * MINUTE);
    expect(real.getTime()).toBe(at("09:00").getTime());
  });

  it("기기가 5분 뒤처져 있으면 5분을 더한다", () => {
    const real = toRealTime(at("08:55"), -5 * MINUTE);
    expect(real.getTime()).toBe(at("09:00").getTime());
  });

  it("되돌리면 원래 값으로 돌아온다", () => {
    const offset = 7 * MINUTE;
    const device = at("09:13");
    const back = toDeviceTime(toRealTime(device, offset), offset);
    expect(back.getTime()).toBe(device.getTime());
  });
});

describe("elapsedInSegment — 실제 시각을 그 조각의 경과 시각으로", () => {
  it("조각 시작 시각은 0이다", () => {
    expect(elapsedInSegment(at("09:00"), segment("09:00", "11:00"))).toBe(0);
  });

  it("조각 중간 지점을 바르게 잰다", () => {
    const elapsed = elapsedInSegment(at("09:35"), segment("09:00", "11:00"));
    expect(elapsed).toBe(35 * MINUTE);
  });

  it("늦게 시작한 조각에서는 그만큼 앞당겨진다", () => {
    const elapsed = elapsedInSegment(at("09:35"), segment("09:10", "11:00"));
    expect(elapsed).toBe(25 * MINUTE);
  });

  it("조각이 시작하기 전 시각이면 담고 있지 않다", () => {
    expect(elapsedInSegment(at("08:50"), segment("09:00", "11:00"))).toBeNull();
  });

  it("조각이 끝난 뒤 시각이면 담고 있지 않다", () => {
    expect(elapsedInSegment(at("11:30"), segment("09:00", "11:00"))).toBeNull();
  });

  it("녹음이 멈춰 있던 구간이면 담고 있지 않다", () => {
    const seg = segment("09:00", "12:00", [range("10:00", "10:30")]);
    expect(elapsedInSegment(at("10:15"), seg)).toBeNull();
  });

  it("멈춘 구간을 지난 뒤에는 조각 시작부터 센 값이 나온다", () => {
    const seg = segment("09:00", "12:00", [range("10:00", "10:30")]);
    expect(elapsedInSegment(at("11:00"), seg)).toBe(2 * 60 * MINUTE);
  });

  it("같은 대목이 세 학습자의 녹음에서 각자의 위치로 나온다", () => {
    const spokenAt = at("09:35");

    // 정본. 9시에 시작했다.
    expect(elapsedInSegment(spokenAt, segment("09:00", "10:50"))).toBe(
      35 * MINUTE,
    );

    // 10분 늦게 켠 학습자.
    expect(elapsedInSegment(spokenAt, segment("09:10", "10:50"))).toBe(
      25 * MINUTE,
    );

    // 그 대목이 지난 뒤에 켠 학습자. 담고 있지 않다.
    expect(elapsedInSegment(spokenAt, segment("09:40", "10:50"))).toBeNull();
  });
});

describe("formatElapsed — 사람이 읽는 시각 표기", () => {
  it("한 시간이 넘지 않으면 분과 초로 쓴다", () => {
    expect(formatElapsed(35 * MINUTE)).toBe("35:00");
  });

  it("한 시간이 넘으면 시간까지 쓴다", () => {
    expect(formatElapsed(95 * MINUTE)).toBe("1:35:00");
  });

  it("초를 두 자리로 맞춘다", () => {
    expect(formatElapsed(5 * 1000)).toBe("0:05");
  });

  it("음수는 0으로 본다", () => {
    expect(formatElapsed(-1000)).toBe("0:00");
  });
});
