/**
 * 도메인 계층이 쓰는 타입.
 *
 * 이 계층은 데이터베이스나 화면을 알지 않는다.
 * 저장소에서 읽어 온 값을 여기 정의한 모양으로 바꿔 넘긴다.
 */

/** 시각 구간. 실제 시각으로 다룬다. */
export type TimeRange = {
  /** 시작 실제 시각 (포함) */
  fromAt: Date;
  /** 끝 실제 시각 (포함하지 않음) */
  toAt: Date;
};

/** 녹음. 판정에 필요한 것만 담는다. */
export type Segment = {
  /** 녹음이 시작된 실제 시각 */
  startedAt: Date;
  /** 녹음이 끝난 실제 시각 */
  endedAt: Date;
  /** 녹음이 중간에 멈춰 소리가 없는 구간 */
  gaps: TimeRange[];
};

/** 날짜만 나타내는 문자열. `YYYY-MM-DD` 형식이다. */
export type DateOnly = string;
