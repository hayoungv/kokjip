import { describe, expect, it } from "vitest";
import { parseTimestamp, parseTranscript, toTimedBlocks } from "./transcript";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

describe("parseTimestamp — 시각 표기 읽기", () => {
  it("분과 초를 읽는다", () => {
    expect(parseTimestamp("00:18")).toBe(18 * SECOND);
  });

  it("시간까지 있는 표기를 읽는다", () => {
    expect(parseTimestamp("01:38:06")).toBe(HOUR + 38 * MINUTE + 6 * SECOND);
  });

  it("앞뒤 공백을 무시한다", () => {
    expect(parseTimestamp("  02:30  ")).toBe(2 * MINUTE + 30 * SECOND);
  });

  it("시각이 아니면 null 이다", () => {
    expect(parseTimestamp("AI로 생성된 콘텐츠입니다")).toBeNull();
    expect(parseTimestamp("")).toBeNull();
    expect(parseTimestamp("1:2:3:4")).toBeNull();
  });

  it("분이나 초가 60을 넘으면 시각이 아니다", () => {
    expect(parseTimestamp("00:75")).toBeNull();
    expect(parseTimestamp("99:00")).toBeNull();
  });
});

describe("parseTranscript — 강의 기록 파일 읽기", () => {
  it("머리말을 버리고 덩어리만 읽는다", () => {
    const text = [
      "[26일] 강의 STT",
      "AI로 생성된 콘텐츠입니다",
      "",
      "00:00",
      "첫 말의 말",
      "",
      "00:18",
      "다음 말의 말",
    ].join("\n");

    const [recording] = parseTranscript(text);

    expect(recording.blocks).toEqual([
      { offsetMs: 0, text: "첫 말의 말" },
      { offsetMs: 18 * SECOND, text: "다음 말의 말" },
    ]);
  });

  it("여러 줄로 나뉜 말을 한 덩어리로 모은다", () => {
    const text = ["00:00", "앞줄", "뒷줄", "", "00:10", "다음"].join("\n");
    const [recording] = parseTranscript(text);

    expect(recording.blocks[0]).toEqual({ offsetMs: 0, text: "앞줄 뒷줄" });
  });

  it("시각이 되감기면 새 녹음으로 가른다", () => {
    const text = [
      "00:00",
      "첫 녹음 처음",
      "01:38:06",
      "첫 녹음 끝",
      "00:00",
      "둘째 녹음 처음",
      "46:14",
      "둘째 녹음 끝",
    ].join("\n");

    const recordings = parseTranscript(text);

    expect(recordings).toHaveLength(2);
    expect(recordings[0].blocks.map((b) => b.text)).toEqual([
      "첫 녹음 처음",
      "첫 녹음 끝",
    ]);
    expect(recordings[1].blocks.map((b) => b.text)).toEqual([
      "둘째 녹음 처음",
      "둘째 녹음 끝",
    ]);
  });

  it("각 녹음의 마지막 지점을 알려 준다", () => {
    const text = [
      "00:00",
      "가",
      "01:38:06",
      "나",
      "00:00",
      "다",
      "46:14",
      "라",
    ].join("\n");

    const recordings = parseTranscript(text);

    expect(recordings[0].lastOffsetMs).toBe(HOUR + 38 * MINUTE + 6 * SECOND);
    expect(recordings[1].lastOffsetMs).toBe(46 * MINUTE + 14 * SECOND);
  });

  it("되감기지 않고 같은 시각이 이어지면 한 녹음으로 본다", () => {
    const text = ["00:00", "가", "00:00", "나"].join("\n");
    const recordings = parseTranscript(text);

    expect(recordings).toHaveLength(1);
    expect(recordings[0].blocks).toHaveLength(2);
  });

  it("말이 없는 시각은 버린다", () => {
    const text = ["00:00", "", "00:10", "있는 말"].join("\n");
    const [recording] = parseTranscript(text);

    expect(recording.blocks).toEqual([
      { offsetMs: 10 * SECOND, text: "있는 말" },
    ]);
  });

  it("시각이 하나도 없으면 빈 목록이다", () => {
    expect(parseTranscript("아무 말이나 적혀 있다")).toEqual([]);
    expect(parseTranscript("")).toEqual([]);
  });

  it("윈도 줄바꿈도 읽는다", () => {
    const text = "00:00\r\n첫 말\r\n\r\n00:10\r\n둘째 말";
    const [recording] = parseTranscript(text);

    expect(recording.blocks).toHaveLength(2);
  });
});

describe("toTimedBlocks — 덩어리에 실제 시각 붙이기", () => {
  it("녹음 시작 시각을 더해 실제 시각을 만든다", () => {
    const recording = {
      blocks: [
        { offsetMs: 0, text: "가" },
        { offsetMs: 35 * MINUTE, text: "나" },
      ],
      lastOffsetMs: 35 * MINUTE,
    };

    const startedAt = new Date("2026-03-02T09:00:00+09:00");
    const timed = toTimedBlocks(recording, startedAt);

    expect(timed[0].at.toISOString()).toBe(
      new Date("2026-03-02T09:00:00+09:00").toISOString(),
    );
    expect(timed[1].at.toISOString()).toBe(
      new Date("2026-03-02T09:35:00+09:00").toISOString(),
    );
  });

  it("늦게 시작한 녹음은 전체가 그만큼 밀린다", () => {
    const recording = {
      blocks: [{ offsetMs: 25 * MINUTE, text: "가" }],
      lastOffsetMs: 25 * MINUTE,
    };

    const timed = toTimedBlocks(
      recording,
      new Date("2026-03-02T09:10:00+09:00"),
    );

    // 9시 10분에 켰고 25분 지점이므로 실제로는 9시 35분이다.
    expect(timed[0].at.toISOString()).toBe(
      new Date("2026-03-02T09:35:00+09:00").toISOString(),
    );
  });
});
