"use client";

import { useState } from "react";
import { parseTranscript, type ParsedRecording } from "@/domain/transcript";
import { submitSegment, type SubmitState } from "./actions";

type Learner = { id: string; name: string };

type Props = {
  courseId: string;
  courseName: string;
  learners: Learner[];
};

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
}

/** 오늘 날짜에 시각 하나를 붙여 기본값으로 쓴다. */
function defaultStart(index: number): string {
  const base = new Date();
  base.setHours(9 + index * 2, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}T${pad(base.getHours())}:${pad(base.getMinutes())}`;
}

export function UploadForm({ courseId, courseName, learners }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<ParsedRecording[]>([]);
  const [startTimes, setStartTimes] = useState<string[]>([]);
  const [learnerId, setLearnerId] = useState(learners[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<SubmitState[]>([]);

  async function handleFile(file: File) {
    const text = await file.text();
    const parsed = parseTranscript(text);

    setFileName(file.name);
    setRecordings(parsed);
    setStartTimes(parsed.map((_, i) => defaultStart(i)));
    setResults([]);
  }

  async function handleSubmit() {
    setBusy(true);
    setResults([]);

    const collected: SubmitState[] = [];

    for (const [index, recording] of recordings.entries()) {
      const startedAt = new Date(startTimes[index]);
      // 마지막 덩어리가 시작되는 지점까지가 확실히 담긴 길이다.
      // 그 뒤로 조금 더 말했을 수 있으므로 1분을 더해 끝으로 삼는다.
      const endedAt = new Date(
        startedAt.getTime() + recording.lastOffsetMs + 60_000,
      );

      const state = await submitSegment({
        courseId,
        learnerId,
        clientKey: `${fileName}#${index + 1}`,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        gaps: [],
        clockOffsetMs: 0,
        blocks: recording.blocks,
      });

      collected.push(state);
      setResults([...collected]);
    }

    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-medium text-navy">1. 옮긴 글 파일</h2>
        <p className="mt-1 text-sm text-muted">
          휴대폰 녹음 앱에서 내보낸 글 파일을 고르세요. 한 파일에 녹음이 여러 개
          들어 있어도 알아서 나눕니다.
        </p>
        <input
          type="file"
          accept=".txt,text/plain"
          className="mt-3 block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:text-white hover:file:opacity-90"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </section>

      {recordings.length > 0 && (
        <>
          <section>
            <h2 className="text-sm font-medium text-navy">
              2. 녹음을 시작한 시각
            </h2>
            <p className="mt-1 text-sm text-muted">
              {fileName}에서 녹음 {recordings.length}개를 찾았습니다. 각각 언제
              시작했는지 넣어 주세요.
            </p>

            <ul className="mt-3 space-y-3">
              {recordings.map((recording, index) => (
                <li
                  key={index}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3"
                >
                  <span className="text-sm font-medium text-navy">
                    {index + 1}번
                  </span>
                  <span className="text-sm text-muted">
                    약 {formatDuration(recording.lastOffsetMs)} · 덩어리{" "}
                    {recording.blocks.length}개
                  </span>
                  <input
                    type="datetime-local"
                    value={startTimes[index]}
                    onChange={(e) => {
                      const next = [...startTimes];
                      next[index] = e.target.value;
                      setStartTimes(next);
                    }}
                    className="ml-auto rounded-md border border-line px-2 py-1 text-sm"
                  />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-sm font-medium text-navy">3. 올리는 사람</h2>
            <select
              value={learnerId}
              onChange={(e) => setLearnerId(e.target.value)}
              className="mt-3 rounded-md border border-line px-3 py-2 text-sm"
            >
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted">
              {courseName}에 속한 학습자입니다.
            </p>
          </section>

          <section className="rounded-md bg-warning-bg p-4">
            <p className="text-sm text-warning">
              질의응답 중에 나온 다른 수강생의 목소리도 함께 글로 옮겨집니다.
              누가 말했는지는 구분하지 않으며, 복습 목록에 오르는 것은 강사의
              말뿐입니다.
            </p>
          </section>

          <button
            type="button"
            disabled={busy || !learnerId}
            onClick={() => void handleSubmit()}
            className="rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? "올리는 중" : `녹음 ${recordings.length}개 올리기`}
          </button>
        </>
      )}

      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-navy">결과</h2>
          {results.map((result, index) => (
            <div
              key={index}
              className={`rounded-md border p-3 text-sm ${
                result.ok
                  ? "border-line bg-canvas text-navy"
                  : "border-danger bg-danger-bg text-danger"
              }`}
            >
              <p className="font-medium">{index + 1}번 녹음</p>
              {result.ok ? (
                <ul className="mt-1 space-y-0.5">
                  {result.lines.map((line, i) => (
                    <li key={i} className="whitespace-pre">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1">{result.error}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
