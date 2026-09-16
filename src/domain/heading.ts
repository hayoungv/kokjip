/**
 * 글에서 목차로 볼 만한 줄을 골라내는 규칙.
 *
 * 교안이나 커리큘럼의 목차는 번호 매김이 규칙적이다. 이 규칙만으로도
 * 글로 된 자료에서 목차를 뽑아낼 수 있다. 계단은 번호의 마디 수로 본다.
 *
 * 이것은 **글로 된 자료**에만 쓴다. 사진이나 PDF처럼 글자를 뽑을 수 없는
 * 자료는 강사가 직접 적는 길로 넘어간다.
 */

import type { DraftTocItem } from "./toc";

/** 목차 한 줄로 볼 수 있는 길이의 상한. 이보다 길면 본문 문장이다. */
export const MAX_HEADING_LENGTH = 80;

/** 번호를 매기는 방식과 그 방식이 뜻하는 계단. */
const PATTERNS: Array<{ test: RegExp; depthOf: (m: RegExpMatchArray) => number }> = [
  // 1.2 / 1.2.3 — 마디가 여럿이면 번호가 확실하다
  { test: /^(\d{1,3}(?:\.\d{1,3})+)\.?\s+\S/, depthOf: (m) => m[1].split(".").length - 1 },
  // 1. — 마디가 하나면 점이 있어야 한다. 점이 없으면 연도나 수량과 구별되지 않는다
  { test: /^\d{1,3}\.\s+\S/, depthOf: () => 0 },
  // 제1장 / 제 1 장 / 1장 / 2부 / 3편
  { test: /^제?\s*\d+\s*(장|부|편)/, depthOf: () => 0 },
  // 1절 / 2항 / 3강 / 4주차 / 5교시
  { test: /^제?\s*\d+\s*(절|항|강|주차|교시|차시)/, depthOf: () => 1 },
  // 1) / (1) / 1] 
  { test: /^[([]?\d+[).\]]\s+\S/, depthOf: () => 1 },
  // 가. 나. 다. / 가) 
  { test: /^[가-힣][).]\s+\S/, depthOf: () => 2 },
  // Chapter 1 / Part 2 / Section 3
  { test: /^(chapter|part)\s+\d+/i, depthOf: () => 0 },
  { test: /^(section|lesson|unit)\s+\d+/i, depthOf: () => 1 },
  // 글머리 기호
  { test: /^[■▶●◆·※-]\s+\S/, depthOf: () => 1 },
];

/** 이 줄이 목차 항목으로 보이는지와, 보인다면 몇 번째 계단인지. */
export function readHeading(line: string): DraftTocItem | null {
  const title = line.trim();
  if (title === "") return null;
  if (title.length > MAX_HEADING_LENGTH) return null;

  // 문장으로 끝나면 본문이다.
  if (/[.!?][")]?$/.test(title) && !/^\d+(\.\d+)*\.$/.test(title)) {
    if (!/^\d/.test(title)) return null;
  }

  for (const pattern of PATTERNS) {
    const matched = title.match(pattern.test);
    if (matched) return { title, depth: pattern.depthOf(matched) };
  }

  return null;
}

/**
 * 글 전체에서 목차로 볼 만한 줄만 골라낸다.
 *
 * 골라낸 것이 너무 적으면 목차가 아니라 우연히 걸린 줄이다.
 * 그럴 때는 빈 목록을 돌려주고 강사가 직접 적는 길로 넘어간다.
 */
export const MIN_HEADINGS = 3;

export function readHeadings(text: string): DraftTocItem[] {
  const found: DraftTocItem[] = [];

  for (const line of text.split(/\r?\n/)) {
    const heading = readHeading(line);
    if (heading) found.push(heading);
  }

  return found.length >= MIN_HEADINGS ? found : [];
}
