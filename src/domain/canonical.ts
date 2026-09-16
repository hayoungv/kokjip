import { mergeRanges, segmentCoverage, subtractRanges } from "./range";
import type { Segment, TimeRange } from "./types";

/**
 * 정본 선정과 처리 대상 산출.
 *
 * 회차의 첫 조각을 기다리지 않고 바로 정본으로 삼는다.
 * 이후 조각은 이미 덮인 구간을 빼고 남은 것만 처리한다.
 * 한 회차에서 처리하는 총량은 그 회차에 존재하는 구간의 합집합을 넘지 않는다.
 */

export type ProcessingPlan = {
  /** 이 조각을 정본으로 삼는지 */
  isCanonical: boolean;
  /** 판정에 넘길 구간 */
  rangesToProcess: TimeRange[];
  /** 처리 후 덮인 범위가 어떻게 되는지 */
  nextCoveredRanges: TimeRange[];
};

/**
 * 새로 올라온 조각을 어떻게 처리할지 정한다.
 *
 * @param segment 새로 올라온 조각
 * @param coveredRanges 이 회차에서 이미 옮기고 판정까지 마친 구간
 */
export function planProcessing(
  segment: Segment,
  coveredRanges: TimeRange[],
): ProcessingPlan {
  const covered = mergeRanges(coveredRanges);
  const coverage = segmentCoverage(segment);

  // 덮인 범위가 하나도 없으면 이 조각이 이 회차의 첫 조각이다.
  const isCanonical = covered.length === 0;

  const rangesToProcess = coverage.flatMap((range) =>
    subtractRanges(range, covered),
  );

  return {
    isCanonical,
    rangesToProcess,
    nextCoveredRanges: mergeRanges([...covered, ...rangesToProcess]),
  };
}
