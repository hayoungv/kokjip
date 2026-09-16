/**
 * 목차 도메인 규칙.
 *
 * 목차는 제목과 순서와 계층이 전부다. 본문을 갖지 않는다.
 *
 * 자료 읽는 층이 어떤 형식에서 읽어 왔든, 강사가 직접 적었든,
 * 여기를 거쳐 같은 모양이 된다. 읽어 온 것은 계단이 건너뛰거나
 * 빈 줄이 섞여 있기 마련이라 그대로 두면 화면이 어긋난다.
 */

/** 아직 다듬지 않은 목차 항목. */
export type DraftTocItem = {
  title: string;
  /** 0이 장, 1이 절이다. */
  depth: number;
};

/** 다듬은 목차 항목. */
export type TocItem = DraftTocItem & {
  /** 0부터 빈틈없이 이어지는 번호. 목차 순서를 뜻한다. */
  order: number;
};

/** 계단은 세 칸까지만 둔다. 장과 절과 그 아래 하나다. */
export const MAX_DEPTH = 2;

/** 목차에 둘 수 있는 항목 수의 상한. */
export const MAX_ITEMS = 500;

/** 제목 한 줄의 길이 상한. */
export const MAX_TITLE_LENGTH = 200;

/**
 * 읽어 온 목차를 화면과 저장소가 쓸 수 있는 모양으로 다듬는다.
 *
 * 읽어 온 계단의 값 자체가 아니라 **값들 사이의 관계**를 본다.
 * 전체가 두 칸씩 밀려 들어와도 맨 위가 장이 되고, 형제는 형제로 남는다.
 *
 * - 제목이 비어 있는 항목은 버린다.
 * - 첫 항목은 반드시 장이다.
 * - 같은 값으로 들어온 항목끼리는 형제다.
 * - 계단은 한 번에 한 칸만 내려간다. 두 칸 이상 뛰어도 한 칸이다.
 * - 올라가는 것은 얼마든 올라갈 수 있다.
 * - 번호는 0부터 다시 매긴다.
 */
export function normalizeToc(items: DraftTocItem[]): TocItem[] {
  const result: TocItem[] = [];

  // 지금 열려 있는 조상들이 들어올 때 지녔던 값. 값 자체는 쓰지 않고
  // 몇 겹이 열려 있는지만 센다.
  const open: number[] = [];

  for (const item of items) {
    const title = item.title.trim().slice(0, MAX_TITLE_LENGTH);
    if (title === "") continue;
    if (result.length >= MAX_ITEMS) break;

    const asked = Number.isFinite(item.depth) ? Math.trunc(item.depth) : 0;

    // 나와 같거나 나보다 깊은 조상은 조상이 아니다. 닫는다.
    while (open.length > 0 && open[open.length - 1] >= asked) open.pop();

    const depth = Math.min(open.length, MAX_DEPTH);
    open.push(asked);

    result.push({ title, depth, order: result.length });
  }

  return result;
}

/**
 * 강사가 적은 글을 목차로 읽는다.
 *
 * 줄 앞의 빈칸이 계단이다. 두 칸이 한 계단이고, 탭 하나도 한 계단이다.
 * 빈 줄은 버린다.
 */
export function parseTocText(text: string): TocItem[] {
  const drafts: DraftTocItem[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") continue;

    const indent = line.length - line.trimStart().length;
    const tabs = (line.match(/^\t+/)?.[0].length ?? 0);
    const depth = tabs > 0 ? tabs : Math.floor(indent / 2);

    drafts.push({ title: line.trim(), depth });
  }

  return normalizeToc(drafts);
}

/** 목차를 강사가 고칠 수 있는 글로 되돌린다. 계단은 빈칸 두 칸이다. */
export function tocToText(items: TocItem[]): string {
  return items.map((i) => "  ".repeat(i.depth) + i.title).join("\n");
}

/**
 * 목차 항목에 부모를 이어 준다.
 *
 * 바로 앞에 있는, 자기보다 한 칸 위인 항목이 부모다.
 * 장은 부모가 없다.
 */
export function withParents<T extends TocItem>(
  items: T[],
): Array<T & { parentIndex: number | null }> {
  const lastByDepth = new Map<number, number>();

  return items.map((item, index) => {
    const parentIndex = item.depth === 0 ? null : (lastByDepth.get(item.depth - 1) ?? null);
    lastByDepth.set(item.depth, index);

    // 자기보다 깊은 계단의 기억은 지운다. 형제가 바뀌었기 때문이다.
    for (const depth of lastByDepth.keys()) {
      if (depth > item.depth) lastByDepth.delete(depth);
    }

    return { ...item, parentIndex };
  });
}

/** 목차에 항목이 하나라도 있는지. */
export function hasToc(items: TocItem[]): boolean {
  return items.length > 0;
}
