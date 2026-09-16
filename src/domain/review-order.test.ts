import { describe, expect, it } from "vitest";
import { orderReview, type OrderableTocItem } from "./review-order";

const TOC: OrderableTocItem[] = [
  { id: "ch1", title: "1장", depth: 0, order: 0, parentId: null },
  { id: "s11", title: "1절", depth: 1, order: 1, parentId: "ch1" },
  { id: "s12", title: "2절", depth: 1, order: 2, parentId: "ch1" },
  { id: "ch2", title: "2장", depth: 0, order: 3, parentId: null },
  { id: "s21", title: "3절", depth: 1, order: 4, parentId: "ch2" },
];

let clock = 0;
function say(tocItemId: string | null, strength: number) {
  clock += 1000;
  return { tocItemId, strength, occurredAt: new Date(clock) };
}

describe("orderReview", () => {
  it("강도 합계가 큰 항목이 먼저 온다", () => {
    const result = orderReview(
      [say("s11", 1), say("s12", 3), say("s12", 2), say("s21", 2)],
      TOC,
    );

    expect(result.topics.map((t) => [t.item.id, t.strengthSum])).toEqual([
      ["s12", 5],
      ["s21", 2],
      ["s11", 1],
    ]);
  });

  it("합계가 같으면 목차 순서를 따른다", () => {
    const result = orderReview([say("s21", 2), say("s11", 2)], TOC);
    expect(result.topics.map((t) => t.item.id)).toEqual(["s11", "s21"]);
  });

  it("항목 안에서는 강도 높은 순이다", () => {
    const result = orderReview(
      [say("s11", 1), say("s11", 3), say("s11", 2)],
      TOC,
    );
    expect(result.topics[0].highlights.map((h) => h.strength)).toEqual([3, 2, 1]);
  });

  it("강도가 같으면 시각 순이다", () => {
    const first = say("s11", 2);
    const second = say("s11", 2);
    const result = orderReview([second, first], TOC);

    expect(result.topics[0].highlights[0].occurredAt).toEqual(first.occurredAt);
  });

  it("어느 항목에도 붙지 않은 말을 따로 모은다", () => {
    const result = orderReview([say("s11", 1), say(null, 3), say(null, 1)], TOC);

    expect(result.topics).toHaveLength(1);
    expect(result.loose.map((h) => h.strength)).toEqual([3, 1]);
  });

  it("목차에 없는 항목을 가리키는 말도 따로 모은다", () => {
    const result = orderReview([say("사라진항목", 2)], TOC);
    expect(result.topics).toHaveLength(0);
    expect(result.loose).toHaveLength(1);
  });

  it("말이 붙지 않은 목차 항목은 목록에 넣지 않는다", () => {
    const result = orderReview([say("s11", 1)], TOC);
    expect(result.topics.map((t) => t.item.id)).toEqual(["s11"]);
  });

  it("장의 제목을 함께 알려준다", () => {
    const result = orderReview([say("s21", 1)], TOC);
    expect(result.topics[0].parentTitle).toBe("2장");
  });

  it("목차가 없으면 모든 말이 따로 모인다", () => {
    const result = orderReview([say("s11", 3), say(null, 1)], []);
    expect(result.topics).toHaveLength(0);
    expect(result.loose).toHaveLength(2);
  });

  it("말이 없으면 비어 있다", () => {
    expect(orderReview([], TOC)).toEqual({ topics: [], loose: [] });
  });
});
