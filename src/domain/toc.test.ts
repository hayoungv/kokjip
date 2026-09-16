import { describe, expect, it } from "vitest";
import {
  MAX_DEPTH,
  MAX_ITEMS,
  normalizeToc,
  parseTocText,
  tocToText,
  withParents,
} from "./toc";

describe("normalizeToc", () => {
  it("제목이 빈 항목을 버린다", () => {
    const result = normalizeToc([
      { title: "1장 기획의 시작", depth: 0 },
      { title: "   ", depth: 1 },
      { title: "", depth: 1 },
      { title: "1절 문제 정의", depth: 1 },
    ]);

    expect(result.map((i) => i.title)).toEqual(["1장 기획의 시작", "1절 문제 정의"]);
  });

  it("앞뒤 빈칸을 없앤다", () => {
    const result = normalizeToc([{ title: "  1장 기획의 시작  ", depth: 0 }]);
    expect(result[0].title).toBe("1장 기획의 시작");
  });

  it("번호를 0부터 빈틈없이 다시 매긴다", () => {
    const result = normalizeToc([
      { title: "가", depth: 0 },
      { title: "", depth: 0 },
      { title: "나", depth: 0 },
      { title: "다", depth: 0 },
    ]);

    expect(result.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("첫 항목에 계단이 있으면 장으로 끌어 올린다", () => {
    const result = normalizeToc([
      { title: "1절 문제 정의", depth: 2 },
      { title: "2절 가설", depth: 2 },
    ]);

    expect(result.map((i) => i.depth)).toEqual([0, 0]);
  });

  it("계단이 두 칸 이상 뛰면 한 칸으로 줄인다", () => {
    const result = normalizeToc([
      { title: "1장", depth: 0 },
      { title: "1절의 하위", depth: 2 },
    ]);

    expect(result.map((i) => i.depth)).toEqual([0, 1]);
  });

  it("올라가는 것은 얼마든 올라간다", () => {
    const result = normalizeToc([
      { title: "1장", depth: 0 },
      { title: "1절", depth: 1 },
      { title: "가목", depth: 2 },
      { title: "2장", depth: 0 },
    ]);

    expect(result.map((i) => i.depth)).toEqual([0, 1, 2, 0]);
  });

  it("계단의 한계를 넘는 값을 한계 안으로 넣는다", () => {
    const result = normalizeToc([
      { title: "1장", depth: 0 },
      { title: "1절", depth: 1 },
      { title: "가목", depth: 2 },
      { title: "더 깊은 것", depth: 9 },
    ]);

    expect(result.every((i) => i.depth <= MAX_DEPTH)).toBe(true);
    expect(result[3].depth).toBe(MAX_DEPTH);
  });

  it("음수 계단을 장으로 본다", () => {
    const result = normalizeToc([{ title: "1장", depth: -3 }]);
    expect(result[0].depth).toBe(0);
  });

  it("항목 수 상한을 넘기지 않는다", () => {
    const many = Array.from({ length: MAX_ITEMS + 50 }, (_, i) => ({
      title: `항목 ${i}`,
      depth: 0,
    }));

    expect(normalizeToc(many)).toHaveLength(MAX_ITEMS);
  });

  it("빈 목차는 빈 목차다", () => {
    expect(normalizeToc([])).toEqual([]);
  });
});

describe("parseTocText", () => {
  it("빈칸 두 칸을 한 계단으로 읽는다", () => {
    const result = parseTocText(
      ["1장 기획의 시작", "  1절 문제 정의", "  2절 가설", "2장 조사"].join("\n"),
    );

    expect(result.map((i) => [i.title, i.depth])).toEqual([
      ["1장 기획의 시작", 0],
      ["1절 문제 정의", 1],
      ["2절 가설", 1],
      ["2장 조사", 0],
    ]);
  });

  it("탭 하나를 한 계단으로 읽는다", () => {
    const result = parseTocText("1장\n\t1절\n\t\t가목");
    expect(result.map((i) => i.depth)).toEqual([0, 1, 2]);
  });

  it("빈 줄을 버린다", () => {
    const result = parseTocText("1장\n\n\n  1절\n");
    expect(result).toHaveLength(2);
  });

  it("줄 끝의 캐리지 리턴을 남기지 않는다", () => {
    const result = parseTocText("1장\r\n  1절\r\n");
    expect(result.map((i) => i.title)).toEqual(["1장", "1절"]);
  });

  it("아무것도 적지 않으면 빈 목차다", () => {
    expect(parseTocText("   \n\n  ")).toEqual([]);
  });
});

describe("tocToText", () => {
  it("적었던 글로 되돌아간다", () => {
    const text = ["1장 기획의 시작", "  1절 문제 정의", "  2절 가설", "2장 조사"].join("\n");
    expect(tocToText(parseTocText(text))).toBe(text);
  });
});

describe("withParents", () => {
  it("바로 앞의 한 칸 위 항목을 부모로 삼는다", () => {
    const items = parseTocText(
      ["1장", "  1절", "  2절", "2장", "  1절"].join("\n"),
    );
    const result = withParents(items);

    expect(result.map((i) => i.parentIndex)).toEqual([null, 0, 0, null, 3]);
  });

  it("계단을 올라가면 아래 계단의 기억을 지운다", () => {
    const items = parseTocText(
      ["1장", "  1절", "    가목", "  2절", "    나목"].join("\n"),
    );
    const result = withParents(items);

    // 나목의 부모는 1절(1번)이 아니라 2절(3번)이다.
    expect(result[4].parentIndex).toBe(3);
  });

  it("장은 부모가 없다", () => {
    const result = withParents(parseTocText("1장\n2장"));
    expect(result.map((i) => i.parentIndex)).toEqual([null, null]);
  });
});
