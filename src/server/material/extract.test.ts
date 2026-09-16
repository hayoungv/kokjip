import { describe, expect, it } from "vitest";
import { isShell, stripTags } from "./extract";

describe("stripTags", () => {
  it("태그를 걷어 내고 글자만 남긴다", () => {
    // 태그가 닫히고 열리는 자리마다 줄이 바뀐다. 빈 줄은 목차를 읽을 때 버려진다.
    expect(stripTags("<h1>1장 기획</h1><p>본문입니다</p>").split(/\n+/)).toEqual([
      "1장 기획",
      "본문입니다",
    ]);
  });

  it("스크립트와 꾸미기는 통째로 버린다", () => {
    const html = "<script>var a = '<h1>가짜</h1>';</script><h1>진짜</h1>";
    expect(stripTags(html)).toBe("진짜");
  });

  it("문자 표기를 되돌린다", () => {
    expect(stripTags("<p>1 &lt; 2 &amp;&nbsp;3</p>")).toBe("1 < 2 & 3");
  });
});

describe("isShell", () => {
  it("내용이 거의 없으면 겉 껍데기로 본다", () => {
    expect(isShell("Notion")).toBe(true);
  });

  it("스크립트를 켜라는 안내가 있으면 겉 껍데기로 본다", () => {
    const text = "Notion\n" + "가".repeat(400) + "\nJavaScript must be enabled";
    expect(isShell(text)).toBe(true);
  });

  it("내용이 충분히 오면 겉 껍데기가 아니다", () => {
    expect(isShell("1장 기획의 시작\n" + "본문 문장입니다. ".repeat(40))).toBe(false);
  });
});
