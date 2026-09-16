/**
 * 강의 기록 파일을 읽어 들이는 규칙.
 *
 * 휴대폰 녹음 앱이 내보낸 글 파일은 이런 모양이다.
 *
 * ```
 * [26일] 강의 STT
 * AI로 생성된 콘텐츠입니다
 *
 * 00:00
 * 첫 말의 말
 *
 * 01:38
 * 다음 말의 말
 * ```
 *
 * 한 파일에 녹음이 여러 개 이어 붙어 있을 수 있다.
 * 시각이 앞으로 되감기는 지점이 녹음의 경계다.
 */

/** 강의 기록의 한 덩어리. */
export type TranscriptBlock = {
  /** 녹음 시작부터 흐른 밀리초 */
  offsetMs: number;
  /** 그 지점의 말 */
  text: string;
};

/** 파일에서 읽어 낸 녹음 하나. */
export type ParsedRecording = {
  blocks: TranscriptBlock[];
  /** 마지막 덩어리가 시작되는 지점. 실제 길이는 이보다 조금 더 길다 */
  lastOffsetMs: number;
};

const TIMESTAMP = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})$/;

/** 시각 표기를 밀리초로 바꾼다. 형식이 아니면 `null`을 돌려준다. */
export function parseTimestamp(line: string): number | null {
  const matched = TIMESTAMP.exec(line.trim());
  if (!matched) return null;

  const hours = matched[1] ? Number(matched[1]) : 0;
  const minutes = Number(matched[2]);
  const seconds = Number(matched[3]);

  if (minutes > 59 || seconds > 59) return null;

  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

/**
 * 강의 기록 파일을 녹음 단위로 나눠 읽는다.
 *
 * 머리말은 버리고, 시각이 되감기는 지점에서 녹음을 가른다.
 */
export function parseTranscript(text: string): ParsedRecording[] {
  const lines = text.split(/\r?\n/);

  const recordings: ParsedRecording[] = [];
  let blocks: TranscriptBlock[] = [];
  let pendingOffset: number | null = null;
  let pendingText: string[] = [];

  const flushBlock = () => {
    if (pendingOffset === null) return;
    const body = pendingText.join(" ").trim();
    if (body.length > 0) {
      blocks.push({ offsetMs: pendingOffset, text: body });
    }
    pendingOffset = null;
    pendingText = [];
  };

  const flushRecording = () => {
    flushBlock();
    if (blocks.length === 0) return;
    recordings.push({
      blocks,
      lastOffsetMs: blocks[blocks.length - 1].offsetMs,
    });
    blocks = [];
  };

  for (const line of lines) {
    const offset = parseTimestamp(line);

    if (offset === null) {
      // 시각이 아닌 줄이다. 시각을 아직 못 만났으면 머리말이므로 버린다.
      if (pendingOffset !== null) {
        const body = line.trim();
        if (body.length > 0) pendingText.push(body);
      }
      continue;
    }

    // 직전 시각은 아직 확정되지 않은 덩어리의 것이다.
    // 그것이 없을 때만 마지막으로 확정된 덩어리를 본다.
    const previousOffset =
      pendingOffset ?? blocks[blocks.length - 1]?.offsetMs ?? null;

    // 시각이 앞으로 되감겼으면 새 녹음이 시작된 것이다.
    if (previousOffset !== null && offset < previousOffset) {
      flushRecording();
    } else {
      flushBlock();
    }

    pendingOffset = offset;
  }

  flushRecording();

  return recordings;
}

/**
 * 녹음의 각 덩어리에 실제 시각을 붙인다.
 *
 * @param recording 파일에서 읽어 낸 녹음
 * @param startedAt 그 녹음이 시작된 실제 시각
 */
export function toTimedBlocks(
  recording: ParsedRecording,
  startedAt: Date,
): Array<{ at: Date; text: string }> {
  return recording.blocks.map((block) => ({
    at: new Date(startedAt.getTime() + block.offsetMs),
    text: block.text,
  }));
}
