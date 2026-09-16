"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  clearTocAction,
  confirmTocAction,
  readMaterialAction,
  type ReadState,
} from "../actions";

/**
 * 학습 자료를 올리고 읽어 낸 목차를 고치는 화면.
 *
 * 두 걸음이다. 먼저 자료에서 목차를 읽어 보여주고, 강사가 고쳐 확인하면
 * 그때 목차가 된다. 읽기에 실패하면 직접 적는 자리로 그대로 넘어간다.
 */

type Kind = "DOCUMENT" | "WEB_PAGE" | "IMAGE" | "TYPED";

const KINDS: Array<{ value: Kind; label: string; hint: string }> = [
  { value: "DOCUMENT", label: "문서 파일", hint: "글자가 든 파일을 올립니다" },
  { value: "WEB_PAGE", label: "웹 페이지", hint: "공개된 페이지 주소를 붙여 넣습니다" },
  { value: "IMAGE", label: "사진", hint: "목차가 찍힌 사진을 올립니다" },
  { value: "TYPED", label: "직접 적기", hint: "목차를 손으로 적습니다" },
];

const PLACEHOLDER = [
  "1장 기획의 시작",
  "  1절 문제 정의",
  "  2절 가설 세우기",
  "2장 사용자 조사",
].join("\n");

type Props = {
  token: string;
  savedToc: string;
  savedCount: number;
};

export function MaterialForm({ token, savedToc, savedCount }: Props) {
  const [kind, setKind] = useState<Kind>("DOCUMENT");
  const [url, setUrl] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [draft, setDraft] = useState(savedToc);
  const [read, setRead] = useState<ReadState>({ phase: "idle" });
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const showEditor =
    draft.trim() !== "" || kind === "TYPED" || read.phase === "failed";

  function handleRead() {
    const form = new FormData();
    form.set("kind", kind);
    if (kind === "WEB_PAGE") form.set("url", url);
    if (files) for (const file of Array.from(files)) form.append("files", file);

    setSaved(null);
    start(async () => {
      const result = await readMaterialAction(token, form);
      setRead(result);
      if (result.phase === "ok") setDraft(result.text);
    });
  }

  function handleConfirm() {
    setSaved(null);
    start(async () => {
      const result = await confirmTocAction(token, draft);
      setSaved(result.message);
      if (result.ok) setRead({ phase: "idle" });
    });
  }

  function handleClear() {
    setSaved(null);
    start(async () => {
      const result = await clearTocAction(token);
      setSaved(result.message);
      if (result.ok) {
        setDraft("");
        setRead({ phase: "idle" });
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

      <h1 className="mt-3 text-xl font-bold text-navy">학습 자료와 목차</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        자료에서 목차만 읽습니다. 본문은 가져가지 않고, 읽고 나면 원본을 그 자리에서
        지웁니다.
      </p>

      {savedCount > 0 && (
        <div className="mt-6 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint">
          이미 확정한 목차가 {savedCount}개 있습니다. 새로 올리면 이 목차가 바뀝니다.
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm font-semibold text-navy">어떤 형식으로 올리시겠습니까</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {KINDS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setKind(option.value);
                setRead({ phase: "idle" });
              }}
              className={`rounded-xl border p-3 text-left transition ${
                kind === option.value
                  ? "border-brand bg-brand-soft"
                  : "border-line bg-surface hover:border-brand"
              }`}
            >
              <span className="block text-sm font-medium text-navy">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      {(kind === "DOCUMENT" || kind === "IMAGE") && (
        <div className="mt-5">
          <input
            type="file"
            multiple
            accept={kind === "IMAGE" ? "image/*" : ".txt,.md,.csv,.html,.htm,.pdf"}
            onChange={(e) => setFiles(e.target.files)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand"
          />
          <p className="mt-2 text-xs text-muted">
            쪽수가 많으면 목차가 있는 쪽만 골라 올려 주세요.
          </p>
        </div>
      )}

      {kind === "WEB_PAGE" && (
        <div className="mt-5">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-navy outline-none focus:border-brand"
          />
          <p className="mt-2 text-xs text-muted">
            로그인이 필요 없는 공개 페이지만 읽을 수 있습니다.
          </p>
        </div>
      )}

      {kind !== "TYPED" && (
        <button
          type="button"
          disabled={pending}
          onClick={handleRead}
          className="mt-5 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-deep-navy disabled:opacity-50"
        >
          {pending ? "읽고 있습니다" : "목차 읽기"}
        </button>
      )}

      {read.phase === "failed" && (
        <div className="mt-5 rounded-xl bg-warning-bg px-4 py-3">
          <p className="text-sm text-warning">{read.message}</p>
          <p className="mt-1 text-xs text-warning">
            아래에 목차를 직접 적으셔도 됩니다.
          </p>
        </div>
      )}

      {read.phase === "ok" && (
        <p className="mt-5 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
          {read.message}
        </p>
      )}

      {showEditor && (
        <div className="mt-8 border-t border-line pt-8">
          <p className="text-sm font-semibold text-navy">목차 확인</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            한 줄이 한 항목입니다. 줄 앞에 빈칸 두 칸을 넣으면 한 계단 아래가 됩니다.
          </p>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder={PLACEHOLDER}
            className="mt-3 w-full rounded-xl border border-line bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-navy outline-none focus:border-brand"
          />

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={pending || draft.trim() === ""}
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-deep-navy disabled:opacity-50"
            >
              {pending ? "저장하고 있습니다" : "이 목차로 확정"}
            </button>
            {savedCount > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={handleClear}
                className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium text-muted transition hover:border-danger hover:text-danger disabled:opacity-50"
              >
                목차 지우기
              </button>
            )}
          </div>
        </div>
      )}

      {saved && (
        <p className="mt-4 rounded-xl bg-mint-soft px-4 py-3 text-sm text-mint">
          {saved}
        </p>
      )}
    </div>
  );
}
