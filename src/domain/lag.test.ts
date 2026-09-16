import { describe, expect, it } from "vitest";
import { consecutiveMissedDays, isLagging, toDateOnly } from "./lag";

describe("consecutiveMissedDays — 연속 미열람 일수", () => {
  it("모든 강의일에 열었으면 0이다", () => {
    const lectures = ["2026-03-02", "2026-03-03", "2026-03-04"];
    const viewed = ["2026-03-02", "2026-03-03", "2026-03-04"];
    expect(consecutiveMissedDays(lectures, viewed)).toBe(0);
  });

  it("마지막 하루만 안 열었으면 1이다", () => {
    const lectures = ["2026-03-02", "2026-03-03", "2026-03-04"];
    const viewed = ["2026-03-02", "2026-03-03"];
    expect(consecutiveMissedDays(lectures, viewed)).toBe(1);
  });

  it("사흘 연속 안 열었으면 3이다", () => {
    const lectures = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"];
    const viewed = ["2026-03-02"];
    expect(consecutiveMissedDays(lectures, viewed)).toBe(3);
  });

  it("한 번도 안 열었으면 강의일 수만큼이다", () => {
    const lectures = ["2026-03-02", "2026-03-03", "2026-03-04"];
    expect(consecutiveMissedDays(lectures, [])).toBe(3);
  });

  it("강의가 없으면 0이다", () => {
    expect(consecutiveMissedDays([], [])).toBe(0);
  });

  it("중간에 열었으면 그 지점에서 멈춘다", () => {
    const lectures = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"];
    const viewed = ["2026-03-03"];
    // 05, 04 를 안 열었고 03 에서 멈춘다.
    expect(consecutiveMissedDays(lectures, viewed)).toBe(2);
  });

  it("강의가 없는 날은 세지 않는다", () => {
    // 목·금 강의, 토·일은 강의가 없고, 월 강의.
    // 목요일에 열었고 금요일과 월요일은 안 열었다.
    const lectures = ["2026-03-05", "2026-03-06", "2026-03-09"];
    const viewed = ["2026-03-05"];

    // 주말이 사이에 있어도 미열람은 금요일과 월요일 둘뿐이다.
    expect(consecutiveMissedDays(lectures, viewed)).toBe(2);
  });

  it("강의가 없는 날에 열어도 연속이 끊기지 않는다", () => {
    const lectures = ["2026-03-05", "2026-03-06", "2026-03-09"];
    // 강의가 없는 토요일에만 열었다.
    const viewed = ["2026-03-07"];

    expect(consecutiveMissedDays(lectures, viewed)).toBe(3);
  });

  it("강의일이 뒤섞여 들어와도 바르게 센다", () => {
    const lectures = ["2026-03-04", "2026-03-02", "2026-03-05", "2026-03-03"];
    const viewed = ["2026-03-03"];
    expect(consecutiveMissedDays(lectures, viewed)).toBe(2);
  });

  it("같은 강의일이 두 번 들어와도 한 번만 센다", () => {
    const lectures = ["2026-03-04", "2026-03-04", "2026-03-05"];
    expect(consecutiveMissedDays(lectures, [])).toBe(2);
  });
});

describe("isLagging — 뒤처짐 판정", () => {
  const lectures = ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"];

  it("이틀 연속이면 아직 아니다", () => {
    expect(isLagging(lectures, ["2026-03-03"])).toBe(false);
  });

  it("사흘 연속이면 뒤처지는 것으로 본다", () => {
    expect(isLagging(lectures, ["2026-03-02"])).toBe(true);
  });

  it("기준을 바꿔 쓸 수 있다", () => {
    expect(isLagging(lectures, ["2026-03-03"], 2)).toBe(true);
  });
});

describe("toDateOnly — 시각을 날짜로", () => {
  it("한국 시간대 기준으로 날짜를 뽑는다", () => {
    const at = new Date("2026-03-02T14:30:00+09:00");
    expect(toDateOnly(at)).toBe("2026-03-02");
  });

  it("한국 시간 자정 직전은 그날로 본다", () => {
    const at = new Date("2026-03-02T23:59:00+09:00");
    expect(toDateOnly(at)).toBe("2026-03-02");
  });

  it("한국 시간 자정 직후는 다음 날로 본다", () => {
    const at = new Date("2026-03-03T00:01:00+09:00");
    expect(toDateOnly(at)).toBe("2026-03-03");
  });

  it("세계 표준시로는 전날인 시각도 한국 날짜로 뽑는다", () => {
    // 세계 표준시로 3월 2일 오후 3시는 한국에서 3월 3일 자정이다.
    const at = new Date("2026-03-02T15:00:00Z");
    expect(toDateOnly(at)).toBe("2026-03-03");
  });
});
