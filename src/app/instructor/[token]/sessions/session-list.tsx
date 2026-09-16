"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { blockAction } from "../actions";

/**
 * 회차별 녹음 허용 화면.
 *
 * 강사는 회차 단위로 녹음을 막을 수 있다. 막은 회차에서는 학습자의
 * 녹음 버튼이 열리지 않는다. 회차는 미리 등록하지 않고 녹음이 올라온
 * 날짜로 만들어지므로, 아직 아무것도 올라오지 않았으면 목록이 비어 있다.
 */

type Session = {
  id: string;
  date: string;
  blocked: boolean;
  segmentCount: number;
};

export function SessionList({
  token,
  sessions,
}: {
  token: string;
  sessions: Session[];
}) {
  const [rows, setRows] = useState(sessions);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(session: Session) {
    const next = !session.blocked;
    setBusyId(session.id);
    setMessage(null);

    start(async () => {
      const result = await blockAction(token, session.id, next);
      setBusyId(null);
      setMessage(result.message);
      if (result.ok) {
        setRows((current) =>
          current.map((row) =>
            row.id === session.id ? { ...row, blocked: next } : row,
          ),
        );
      }
    });
  }

  return (
    <div>
      <Link
        href={`/instructor/${token}`}
        className="text-xs text-muted hover:text-navy"
      >
        돌아가기
      </Link>

      <h1 className="mt-3 text-xl font-bold text-navy">회차별 녹음 허용</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        막은 회차에서는 학습자의 녹음 버튼이 열리지 않습니다. 언제든 다시 열 수
        있습니다.
      </p>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-line bg-surface p-8 text-center">
          <p className="text-sm text-muted">아직 올라온 강의가 없습니다.</p>
          <p className="mt-1.5 text-xs text-muted">
            회차는 강의가 올라온 날짜로 만들어집니다.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {rows.map((session) => (
            <li
              key={session.id}
              className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3.5"
            >
              <div>
                <p className="text-sm font-medium text-navy">{session.date}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {session.blocked
                    ? "녹음을 막은 회차입니다"
                    : `올라온 강의 ${session.segmentCount}건`}
                </p>
              </div>

              <button
                type="button"
                disabled={busyId === session.id}
                onClick={() => toggle(session)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium transition disabled:opacity-50 ${
                  session.blocked
                    ? "bg-brand-soft text-brand hover:bg-brand hover:text-white"
                    : "border border-line text-muted hover:border-danger hover:text-danger"
                }`}
              >
                {busyId === session.id
                  ? "처리 중"
                  : session.blocked
                    ? "다시 열기"
                    : "녹음 막기"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint">
          {message}
        </p>
      )}
    </div>
  );
}
