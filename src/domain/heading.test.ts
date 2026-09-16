import { describe, expect, it } from "vitest";
import { MIN_HEADINGS, readHeading, readHeadings } from "./heading";

describe("readHeading", () => {
  it("마디 번호의 개수로 계단을 정한다", () => {
    expect(readHeading("1. 기획의 시작")).toEqual({ title: "1. 기획의 시작", depth: 0 });
    expect(readHeading("1.2 문제 정의")).toEqual({ title: "1.2 문제 정의", depth: 1 });
    expect(readHeading("1.2.3 인터뷰")).toEqual({ title: "1.2.3 인터뷰", depth: 2 });
  });

  it("장과 부와 편을 장으로 본다", () => {
    expect(readHeading("제1장 기획의 시작")?.depth).toBe(0);
    expect(readHeading("2부 조사")?.depth).toBe(0);
    expect(readHeading("제 3 편 분석")?.depth).toBe(0);
  });

  it("절과 항과 주차를 절로 본다", () => {
    expect(readHeading("1절 문제 정의")?.depth).toBe(1);
    expect(readHeading("3주차 사용자 조사")?.depth).toBe(1);
    expect(readHeading("5교시 실습")?.depth).toBe(1);
  });

  it("괄호 번호를 절로 본다", () => {
    expect(readHeading("(1) 이해관계자 정의")?.depth).toBe(1);
    expect(readHeading("2) 가설 세우기")?.depth).toBe(1);
  });

  it("가나다 번호를 그 아래 계단으로 본다", () => {
    expect(readHeading("가. 정성 조사")?.depth).toBe(2);
  });

  it("영어 표기도 읽는다", () => {
    expect(readHeading("Chapter 2 Research")?.depth).toBe(0);
    expect(readHeading("Section 3 Interview")?.depth).toBe(1);
  });

  it("글머리 기호를 절로 본다", () => {
    expect(readHeading("■ 사용자 인터뷰")?.depth).toBe(1);
  });

  it("번호가 없는 보통 줄은 목차가 아니다", () => {
    expect(readHeading("이 과정은 실무 중심으로 진행됩니다")).toBeNull();
  });

  it("너무 긴 줄은 본문으로 본다", () => {
    const long = "1. " + "가".repeat(100);
    expect(readHeading(long)).toBeNull();
  });

  it("빈 줄은 목차가 아니다", () => {
    expect(readHeading("   ")).toBeNull();
  });

  it("앞뒤 빈칸을 없앤 제목을 돌려준다", () => {
    expect(readHeading("   1. 기획   ")?.title).toBe("1. 기획");
  });
});

describe("readHeadings", () => {
  it("교안 모양의 글에서 목차만 골라낸다", () => {
    const text = [
      "2026 서비스 기획 심화 과정",
      "이 과정은 실무 중심으로 진행됩니다.",
      "",
      "1장 기획의 시작",
      "기획은 문제를 정의하는 일에서 시작합니다.",
      "1절 문제 정의",
      "2절 가설 세우기",
      "2장 사용자 조사",
      "1절 인터뷰 설계",
    ].join("\n");

    expect(readHeadings(text).map((i) => [i.title, i.depth])).toEqual([
      ["1장 기획의 시작", 0],
      ["1절 문제 정의", 1],
      ["2절 가설 세우기", 1],
      ["2장 사용자 조사", 0],
      ["1절 인터뷰 설계", 1],
    ]);
  });

  it("골라낸 것이 너무 적으면 목차로 보지 않는다", () => {
    const text = ["안내문입니다.", "1. 준비물을 챙겨 오세요", "감사합니다."].join("\n");
    expect(readHeadings(text)).toEqual([]);
  });

  it("최소 개수를 채우면 목차로 본다", () => {
    const text = ["1. 가", "2. 나", "3. 다"].join("\n");
    expect(readHeadings(text)).toHaveLength(MIN_HEADINGS);
  });

  it("아무것도 없으면 빈 목록이다", () => {
    expect(readHeadings("")).toEqual([]);
  });
});
