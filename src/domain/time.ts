import { containsAt, segmentCoverage } from "./range";
import type { Segment } from "./types";

/**
 * 시각 변환.
 *
 * 저장하는 모든 시각은 실제 시각이다.
 * 경과 시각은 화면에서 재생 위치를 찾을 때만 계산한다.
 *
 * 실제 시각 = 기기 시각 − 시계 차이
 * 경과 시각 = 실제 시각 − 그 녹음의 시작 실제 시각
 */

/**
 * 기기가 알려 준 시각을 실제 시각으로 바꾼다.
 *
 * @param deviceTime 기기 시계가 가리킨 시각
 * @param clockOffsetMs 기기 시계가 서버보다 얼마나 앞서 있는지 (밀리초).
 *   양수면 기기가 앞서 있고, 음수면 뒤처져 있다.
 */
export function toRealTime(deviceTime: Date, clockOffsetMs: number): Date {
  return new Date(deviceTime.getTime() - clockOffsetMs);
}

/**
 * 실제 시각을 기기 시각으로 되돌린다.
 */
export function toDeviceTime(realTime: Date, clockOffsetMs: number): Date {
  return new Date(realTime.getTime() + clockOffsetMs);
}

/**
 * 어떤 실제 시각이 이 녹음의 몇 초 지점인지 돌려준다.
 *
 * 그 시각이 이 녹음에 담겨 있지 않으면 `null`을 돌려준다.
 * 녹음이 멈춰 소리가 없는 구간도 담기지 않은 것으로 본다.
 *
 * @returns 녹음 시작부터 흐른 밀리초, 또는 담고 있지 않으면 `null`
 */
export function elapsedInSegment(
  realTime: Date,
  segment: Segment,
): number | null {
  if (!containsAt(segmentCoverage(segment), realTime)) {
    return null;
  }

  return realTime.getTime() - segment.startedAt.getTime();
}

/**
 * 밀리초를 사람이 읽는 시각 표기로 바꾼다.
 *
 * 한 시간이 넘으면 `시:분:초`, 넘지 않으면 `분:초`로 쓴다.
 */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${minutes}:${pad(seconds)}`;
}
