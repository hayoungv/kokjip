/**
 * 강조한 대목의 여덟 가지 유형.
 *
 * 화면과 문서에는 한국어 표기만 쓴다.
 * 코드 식별자는 이 파일에서만 한국어 표기와 짝지어 정의한다.
 */

export const HIGHLIGHT_TYPES = [
  "AVOID",
  "PRACTICAL",
  "CORE",
  "EMPHASIS",
  "MUST",
  "RATIONALE",
  "INSIGHT",
  "REVIEW",
] as const;

export type HighlightTypeName = (typeof HIGHLIGHT_TYPES)[number];

type TypeLabel = {
  /** 화면에 쓰는 이름 */
  name: string;
  /** 무엇을 가리키는지 한 줄 설명 */
  meaning: string;
};

const LABELS: Record<HighlightTypeName, TypeLabel> = {
  AVOID: {
    name: "주의",
    meaning: "하지 말아야 할 행동이나 잘못된 전제를 짚은 말",
  },
  PRACTICAL: {
    name: "실무 적용",
    meaning: "어떤 상황일 때 어떻게 하라고 조건을 붙인 말",
  },
  CORE: {
    name: "핵심 원칙",
    meaning: "다른 곳에도 그대로 적용되는 정의나 판단 기준",
  },
  EMPHASIS: {
    name: "요건",
    meaning: "결과물이 갖춰야 할 상태를 힘주어 말한 것",
  },
  MUST: {
    name: "필수 행동",
    meaning: "조건 없이 하라고 지정한 행동",
  },
  RATIONALE: {
    name: "근거",
    meaning: "앞의 말과 떼어놓아도 이유로서 남는 설명",
  },
  INSIGHT: {
    name: "견해",
    meaning: "교과서에 없는, 강사 본인의 판단",
  },
  REVIEW: {
    name: "복습 대상",
    meaning: "다시 보라고 지목한 내용",
  },
};

/** 화면에 쓸 한국어 이름을 돌려준다. */
export function typeName(type: HighlightTypeName): string {
  return LABELS[type].name;
}

/** 그 유형이 무엇을 가리키는지 한 줄로 돌려준다. */
export function typeMeaning(type: HighlightTypeName): string {
  return LABELS[type].meaning;
}

/** 강도를 사람이 읽는 말로 바꾼다. */
export function strengthName(strength: number): string {
  if (strength >= 3) return "강함";
  if (strength === 2) return "보통";
  return "약함";
}
