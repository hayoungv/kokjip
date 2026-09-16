/**
 * 복습 순서 규칙.
 *
 * 목차가 있으면 복습 목록은 목차 항목을 나열한 것이다. 말을 나열하지 않는다.
 * 순서는 그 항목에 붙은 말들의 강도 합계가 큰 순이고, 합계가 같으면
 * 교재의 목차 순서를 따른다.
 *
 * 어느 항목에도 붙지 않은 말은 버리지 않는다. 따로 모아 돌려준다.
 */

/** 순서를 정하는 데 필요한 것만 담은 말. */
export type OrderableHighlight = {
  strength: number;
  tocItemId: string | null;
  /** 실제 시각. 강도가 같을 때 앞뒤를 가른다. */
  occurredAt: Date;
};

/** 순서를 정하는 데 필요한 것만 담은 목차 항목. */
export type OrderableTocItem = {
  id: string;
  title: string;
  depth: number;
  order: number;
  parentId: string | null;
};

export type OrderedTopic<H> = {
  item: OrderableTocItem;
  /** 이 항목이 속한 장의 제목. 장 자체이면 `null`이다. */
  parentTitle: string | null;
  /** 붙은 말들의 강도 합계. 순서를 정하는 값이다. */
  strengthSum: number;
  highlights: H[];
};

export type OrderedReview<H> = {
  topics: Array<OrderedTopic<H>>;
  /** 어느 항목에도 붙지 않은 말. 강도 높은 순이다. */
  loose: H[];
};

/** 강도가 높은 순. 같으면 시각 순이다. */
export function byStrength(a: OrderableHighlight, b: OrderableHighlight): number {
  if (b.strength !== a.strength) return b.strength - a.strength;
  return a.occurredAt.getTime() - b.occurredAt.getTime();
}

/**
 * 말들을 목차 항목에 모아 복습 순서를 정한다.
 *
 * 말이 하나도 붙지 않은 목차 항목은 목록에 넣지 않는다.
 * 그 항목은 이 회차에서 다시 볼 것이 없다는 뜻이다.
 */
export function orderReview<H extends OrderableHighlight>(
  highlights: H[],
  tocItems: OrderableTocItem[],
): OrderedReview<H> {
  const titleById = new Map(tocItems.map((i) => [i.id, i.title]));
  const byId = new Map(tocItems.map((i) => [i.id, i]));

  const grouped = new Map<string, H[]>();
  const loose: H[] = [];

  for (const highlight of highlights) {
    const id = highlight.tocItemId;
    if (id === null || !byId.has(id)) {
      loose.push(highlight);
      continue;
    }
    const list = grouped.get(id) ?? [];
    list.push(highlight);
    grouped.set(id, list);
  }

  const topics: Array<OrderedTopic<H>> = [];

  for (const [id, list] of grouped) {
    const item = byId.get(id)!;
    topics.push({
      item,
      parentTitle: item.parentId ? (titleById.get(item.parentId) ?? null) : null,
      strengthSum: list.reduce((sum, h) => sum + h.strength, 0),
      highlights: [...list].sort(byStrength),
    });
  }

  topics.sort((a, b) => {
    if (b.strengthSum !== a.strengthSum) return b.strengthSum - a.strengthSum;
    return a.item.order - b.item.order;
  });

  return { topics, loose: [...loose].sort(byStrength) };
}
