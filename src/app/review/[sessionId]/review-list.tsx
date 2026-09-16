"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  strengthName,
  typeMeaning,
  typeName,
  type HighlightTypeName,
} from "@/domain/highlight-type";
import { formatElapsed } from "@/domain/time";

type Item = {
  id: string;
  type: HighlightTypeName;
  strength: number;
  quote: string;
  occurredAtIso: string;
  segment: { id: string; label: string; elapsedMs: number } | null;
};

type Segment = { id: string; label: string };

type Props = {
  sessionId: string;
  dateLabel: string;
  segments: Segment[];
  items: Item[];
};

/** 유형별 색. 여덟 가지를 세 갈래로 묶는다. */
function typeTone(type: HighlightTypeName): string {
  if (type === "AVOID") return "bg-danger-bg text-danger";
  if (type === "MUST" || type === "EMPHASIS") return "bg-brand-soft text-brand";
  return "bg-mint-soft text-mint";
}

export function ReviewList({ sessionId, dateLabel, segments, items }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [audioBySegment, setAudioBySegment] = useState<Record<string, string>>(
    {},
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState<{
    segmentId: string;
    elapsedMs: number;
  } | null>(null);

  // 화면을 벗어나면 브라우저가 들고 있던 음성 주소를 놓아준다.
  useEffect(() => {
    return () => {
      Object.values(audioBySegment).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [audioBySegment]);

  const byStrength = useMemo(() => {
    const counts = new Map<number, number>();
    for (const item of items) {
      counts.set(item.strength, (counts.get(item.strength) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  function attachAudio(segmentId: string, file: File) {
    const url = URL.createObjectURL(file);
    setAudioBySegment((prev) => {
      const old = prev[segmentId];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [segmentId]: url };
    });
  }

  function play(item: Item) {
    if (!item.segment) return;
    const url = audioBySegment[item.segment.id];
    if (!url) return;

    setPlaying({ segmentId: item.segment.id, elapsedMs: item.segment.elapsedMs });

    const audio = audioRef.current;
    if (!audio) return;

    if (audio.src !== url) audio.src = url;
    audio.currentTime = item.segment.elapsedMs / 1000;
    void audio.play();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-muted">{dateLabel}</p>
            <p className="mt-1 text-2xl font-bold text-navy">
              오늘 먼저 볼 {items.length}개
            </p>
          </div>
          <div className="flex gap-2 text-xs text-muted">
            {[3, 2, 1].map((s) =>
              byStrength.get(s) ? (
                <span key={s} className="rounded-md bg-canvas px-2 py-1">
                  {strengthName(s)} {byStrength.get(s)}
                </span>
              ) : null,
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-4">
          <Link
            href={`/review/${sessionId}/transcript`}
            className="rounded-lg bg-canvas px-3 py-2 text-xs font-medium text-navy"
          >
            강의 기록 전체 보기
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-navy">녹음 파일 연결</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          녹음은 서버에 올라가지 않습니다. 다시 들으려면 기기에 있는 녹음 파일을
          여기서 고르세요. 고른 파일은 이 화면에서만 쓰이고 어디에도 보내지
          않습니다.
        </p>

        <ul className="mt-3 space-y-2">
          {segments.map((segment) => (
            <li
              key={segment.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-line px-3 py-2"
            >
              <span className="text-xs font-medium text-navy">
                {segment.label}
              </span>
              {audioBySegment[segment.id] && (
                <span className="rounded-md bg-mint-soft px-2 py-0.5 text-[11px] text-mint">
                  연결됨
                </span>
              )}
              <input
                type="file"
                accept="audio/*"
                className="ml-auto max-w-[200px] text-[11px] file:mr-2 file:rounded file:border-0 file:bg-canvas file:px-2 file:py-1 file:text-[11px] file:text-navy"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) attachAudio(segment.id, file);
                }}
              />
            </li>
          ))}
        </ul>
      </section>

      <audio ref={audioRef} controls className="w-full" />

      <ul className="space-y-3">
        {items.map((item) => {
          const open = openId === item.id;
          const hasAudio = item.segment
            ? Boolean(audioBySegment[item.segment.id])
            : false;
          const isPlaying =
            playing &&
            item.segment &&
            playing.segmentId === item.segment.id &&
            playing.elapsedMs === item.segment.elapsedMs;

          return (
            <li
              key={item.id}
              className={`rounded-xl border bg-surface p-4 ${
                isPlaying ? "border-brand" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${typeTone(item.type)}`}
                >
                  {typeName(item.type)}
                </span>
                <span className="text-[11px] text-muted">
                  {strengthName(item.strength)}
                </span>
                <span className="ml-auto text-[11px] text-muted">
                  {item.segment
                    ? `${item.segment.label} · ${formatElapsed(item.segment.elapsedMs)}`
                    : "이 녹음에 담기지 않음"}
                </span>
              </div>

              <p className="mt-2.5 text-[15px] font-medium leading-relaxed text-navy">
                “{item.quote}”
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!item.segment || !hasAudio}
                  onClick={() => play(item)}
                  className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white disabled:bg-canvas disabled:text-muted"
                >
                  {item.segment
                    ? hasAudio
                      ? `${formatElapsed(item.segment.elapsedMs)}부터 듣기`
                      : "녹음 파일을 먼저 고르세요"
                    : "다시 들을 수 없음"}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  className="rounded-lg px-2 py-1.5 text-xs text-muted"
                >
                  {open ? "접기" : "이 유형이 뭔가요"}
                </button>
              </div>

              {open && (
                <p className="mt-2 rounded-lg bg-canvas p-3 text-xs leading-relaxed text-muted">
                  <b className="text-navy">{typeName(item.type)}</b> —{" "}
                  {typeMeaning(item.type)}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
