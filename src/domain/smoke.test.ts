import { describe, expect, it } from "vitest";

// W1 단계에서는 시험 도구가 도는지만 확인한다.
// 실제 규칙 시험은 W2에서 작성한다.
describe("시험 도구", () => {
  it("돈다", () => {
    expect(1 + 1).toBe(2);
  });
});
