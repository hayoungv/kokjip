import type { DateOnly } from "./types";

/**
 * 뒤처짐 판정.
 *
 * 복습 목록을 연 날이 사흘 연속 없으면 뒤처지는 것으로 본다.
 * 연속된 날을 셀 때는 강의가 올라온 날만 센다.
 * 강의가 없는 주말과 휴일은 연속을 끊지도 올리지도 않는다.
 */

/** 뒤처짐으로 판정하는 연속 일수. */
export const LAG_THRESHOLD_DAYS = 3;

/**
 * 복습 목록을 연 날이 며칠 연속 없는지 센다.
 *
 * 가장 최근 강의일부터 거꾸로 세다가 연 날을 만나면 멈춘다.
 *
 * @param lectureDates 강의가 올라온 날. 순서는 상관없다
 * @param viewedDates 그 학습자가 복습 목록을 연 날
 */
export function consecutiveMissedDays(
  lectureDates: DateOnly[],
  viewedDates: DateOnly[],
): number {
  const viewed = new Set(viewedDates);

  const descending = Array.from(new Set(lectureDates)).sort((a, b) =>
    b.localeCompare(a),
  );

  let missed = 0;

  for (const date of descending) {
    if (viewed.has(date)) break;
    missed += 1;
  }

  return missed;
}

/**
 * 이 학습자가 뒤처지는지 판정한다.
 */
export function isLagging(
  lectureDates: DateOnly[],
  viewedDates: DateOnly[],
  threshold: number = LAG_THRESHOLD_DAYS,
): boolean {
  return consecutiveMissedDays(lectureDates, viewedDates) >= threshold;
}

/**
 * `Date`를 날짜 문자열로 바꾼다.
 *
 * 나라마다 날짜가 바뀌는 시점이 달라 어긋나지 않도록
 * 기준 시간대를 정해 그 시간대의 날짜를 쓴다.
 */
export function toDateOnly(
  at: Date,
  timeZone: string = "Asia/Seoul",
): DateOnly {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(at);
}
