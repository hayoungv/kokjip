"use client";

import { useState, useTransition } from "react";
import { inviteAction } from "./actions";

/**
 * 과정마다 강사의 녹음 허용 상태를 보여주고 안내를 보내는 자리.
 *
 * 발송 서비스가 연결되어 있지 않으면 발급한 주소를 그대로 보여준다.
 * 훈련기관이 그 주소를 강사에게 직접 전하면 된다.
 */

type Props = {
  courseId: string;
  instructorName: string;
  instructorEmail: string;
  consented: boolean;
  reminderCount: number;
  tocCount: number;
};

export function ConsentPanel({
  courseId,
  instructorName,
  instructorEmail,
  consented,
  reminderCount,
  tocCount,
}: Props) {
  const [pending, start] = useTransition();
  const [issued, setIssued] = useState<{ url: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function send() {
    setError(null);
    setIssued(null);
    setCopied(false);

    start(async () => {
      const result = await inviteAction(courseId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setIssued({ url: result.url, message: result.message });
    });
  }

  return (
    <div className="border-b border-line bg-canvas/60 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-navy">
            {instructorName} 강사
            <span className="ml-1.5 font-normal text-muted">{instructorEmail}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-muted">
            {consented
              ? tocCount > 0
                ? `녹음 허용함 · 목차 ${tocCount}개`
                : "녹음 허용함 · 학습 자료 없음"
              : reminderCount > 0
                ? `안내를 ${reminderCount}번 보냈고 아직 동의하지 않았습니다`
                : "아직 안내를 보내지 않았습니다"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {consented && (
            <span className="rounded-md bg-mint-soft px-2.5 py-1 text-xs text-mint">
              허용
            </span>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={send}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-navy transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {pending
              ? "보내는 중"
              : consented
                ? "주소 다시 발급"
                : reminderCount > 0
                  ? "다시 안내"
                  : "안내 보내기"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>
      )}

      {issued && (
        <div className="mt-3 rounded-lg border border-line bg-surface p-3">
          <p className="text-[11px] text-muted">{issued.message}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-canvas px-2 py-1.5 text-[11px] text-navy">
              {issued.url}
            </code>
            <a
              href={issued.url}
              className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white"
            >
              열기
            </a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(issued.url);
                setCopied(true);
              }}
              className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs text-muted"
            >
              {copied ? "복사함" : "복사"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted">
            이전에 발급한 주소는 더 이상 열리지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
}
