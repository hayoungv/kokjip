"use client";

import { useState, useTransition } from "react";
import { consentAction } from "./actions";

/**
 * 녹음 허용 동의 화면.
 *
 * 동의를 받기 전에 여섯 가지를 먼저 보여준다. 무엇이 녹음되는지,
 * 무엇이 글로 옮겨지는지, 얼마나 보관되는지, 회차를 막을 수 있다는 것,
 * 학습 자료는 목차만 읽고 원본을 즉시 지운다는 것, 목차를 얼마나
 * 보관하는지다.
 */

const NOTICES = [
  {
    title: "무엇이 녹음되나요",
    body: "학습자의 기기가 강의 시간 동안 소리를 녹음합니다. 녹음은 학습자의 기기에 남고, 서버로는 글로 옮긴 것만 올라갑니다.",
  },
  {
    title: "무엇이 글로 옮겨지나요",
    body: "강의 중의 말 전부입니다. 질의응답도 함께 옮겨집니다. 누가 말했는지는 만들지 않습니다.",
  },
  {
    title: "얼마나 보관되나요",
    body: "글로 옮긴 것은 과정이 끝난 뒤 6개월까지 두고 지웁니다.",
  },
  {
    title: "회차를 막을 수 있나요",
    body: "언제든 막을 수 있습니다. 막은 회차에서는 학습자의 녹음 버튼이 열리지 않습니다.",
  },
  {
    title: "학습 자료는 어떻게 되나요",
    body: "올려 주신 자료에서 목차만 읽습니다. 본문은 가져가지 않고, 읽고 나면 원본을 그 자리에서 지웁니다.",
  },
  {
    title: "목차는 얼마나 보관되나요",
    body: "읽어 낸 목차는 과정이 끝난 뒤 6개월까지 두고 지웁니다.",
  },
];

export function ConsentForm({ token, courseName }: { token: string; courseName: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-xl font-bold text-navy">강의 녹음을 허용하시겠습니까</h1>
      <p className="mt-2 text-sm text-muted">{courseName}</p>

      <ul className="mt-8 space-y-3">
        {NOTICES.map((notice) => (
          <li key={notice.title} className="rounded-xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold text-navy">{notice.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{notice.body}</p>
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-6 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger">{error}</p>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await consentAction(token);
            if (!result.ok) setError(result.message);
          })
        }
        className="mt-8 w-full rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-deep-navy disabled:opacity-50"
      >
        {pending ? "처리하고 있습니다" : "녹음을 허용합니다"}
      </button>

      <p className="mt-3 text-center text-xs text-muted">
        허용한 뒤에도 회차마다 막을 수 있습니다.
      </p>
    </div>
  );
}
