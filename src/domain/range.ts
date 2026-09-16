import type { Segment, TimeRange } from "./types";

/**
 * 시각 구간을 다루는 규칙.
 *
 * 이 파일의 함수가 틀리면 같은 구간을 두 번 처리해 판정 비용이 새거나,
 * 처리해야 할 구간을 빠뜨려 복습 목록에 구멍이 생긴다.
 * 둘 다 화면에서는 늦게 드러나므로 시험으로 촘촘히 덮는다.
 */

/** 구간의 길이를 밀리초로 돌려준다. */
export function lengthMs(range: TimeRange): number {
  return range.toAt.getTime() - range.fromAt.getTime();
}

/** 길이가 없는 구간인지 본다. */
export function isEmpty(range: TimeRange): boolean {
  return lengthMs(range) <= 0;
}

/**
 * 여러 구간을 정리한다.
 *
 * 시작 시각 순으로 늘어놓고, 겹치거나 맞닿은 것을 하나로 합치며,
 * 길이가 없는 것은 버린다.
 */
export function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  const sorted = ranges
    .filter((r) => !isEmpty(r))
    .slice()
    .sort((a, b) => a.fromAt.getTime() - b.fromAt.getTime());

  const merged: TimeRange[] = [];

  for (const range of sorted) {
    const last = merged[merged.length - 1];

    if (last && range.fromAt.getTime() <= last.toAt.getTime()) {
      // 겹치거나 맞닿았다. 끝을 더 먼 쪽으로 늘린다.
      if (range.toAt.getTime() > last.toAt.getTime()) {
        merged[merged.length - 1] = { fromAt: last.fromAt, toAt: range.toAt };
      }
      continue;
    }

    merged.push({ fromAt: range.fromAt, toAt: range.toAt });
  }

  return merged;
}

/**
 * 한 구간에서 다른 구간들을 빼고 남은 것을 돌려준다.
 *
 * 새로 올라온 녹음에서 이미 처리한 구간을 빼낼 때 쓴다.
 */
export function subtractRanges(
  target: TimeRange,
  toRemove: TimeRange[],
): TimeRange[] {
  if (isEmpty(target)) return [];

  const blockers = mergeRanges(toRemove);
  const remaining: TimeRange[] = [];

  let cursor = target.fromAt.getTime();
  const end = target.toAt.getTime();

  for (const blocker of blockers) {
    const blockFrom = blocker.fromAt.getTime();
    const blockTo = blocker.toAt.getTime();

    if (blockTo <= cursor) continue; // 이미 지나간 구간이다
    if (blockFrom >= end) break; // 남은 범위 밖이다

    if (blockFrom > cursor) {
      remaining.push({ fromAt: new Date(cursor), toAt: new Date(blockFrom) });
    }

    cursor = Math.max(cursor, blockTo);
    if (cursor >= end) break;
  }

  if (cursor < end) {
    remaining.push({ fromAt: new Date(cursor), toAt: new Date(end) });
  }

  return remaining;
}

/**
 * 녹음에서 실제로 소리가 있는 구간을 돌려준다.
 *
 * 녹음이 중간에 멈춘 구간은 빼낸다.
 */
export function segmentCoverage(segment: Segment): TimeRange[] {
  return subtractRanges(
    { fromAt: segment.startedAt, toAt: segment.endedAt },
    segment.gaps,
  );
}

/** 어떤 시각이 구간들 안에 들어 있는지 본다. */
export function containsAt(ranges: TimeRange[], at: Date): boolean {
  const t = at.getTime();
  return ranges.some((r) => t >= r.fromAt.getTime() && t < r.toAt.getTime());
}

/** 구간들의 길이를 모두 더해 밀리초로 돌려준다. */
export function totalLengthMs(ranges: TimeRange[]): number {
  return mergeRanges(ranges).reduce((sum, r) => sum + lengthMs(r), 0);
}
