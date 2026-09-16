"use server";

import { revalidatePath } from "next/cache";
import {
  clearToc,
  confirmToc,
  giveConsent,
  setSessionBlocked,
  submitMaterial,
} from "@/server/api/instructor";
import type { MaterialInput } from "@/server/material/read-material";

/**
 * 강사 화면이 부르는 처리.
 *
 * 모든 처리가 주소에 담긴 값으로 시작한다. 값이 맞지 않거나 기간이
 * 지났으면 아무 일도 일어나지 않는다.
 */

export type ActionState = { ok: boolean; message: string };

export async function consentAction(token: string): Promise<ActionState> {
  const done = await giveConsent(token);
  if (!done) return { ok: false, message: "이 주소는 열리지 않습니다." };

  revalidatePath(`/instructor/${token}`);
  return { ok: true, message: "녹음을 허용했습니다." };
}

export async function blockAction(
  token: string,
  sessionId: string,
  blocked: boolean,
): Promise<ActionState> {
  const done = await setSessionBlocked(token, sessionId, blocked);
  if (!done) return { ok: false, message: "이 주소는 열리지 않습니다." };

  revalidatePath(`/instructor/${token}/sessions`);
  return {
    ok: true,
    message: blocked ? "이 회차의 녹음을 막았습니다." : "이 회차의 녹음을 다시 열었습니다.",
  };
}

export type ReadState =
  | { phase: "idle" }
  | { phase: "ok"; text: string; message: string }
  | { phase: "failed"; message: string };

/** 올린 자료에서 목차를 읽는다. 읽어 낸 것을 아직 저장하지 않는다. */
export async function readMaterialAction(
  token: string,
  form: FormData,
): Promise<ReadState> {
  const kind = String(form.get("kind") ?? "");

  let input: MaterialInput;
  if (kind === "WEB_PAGE") {
    input = { kind: "WEB_PAGE", url: String(form.get("url") ?? "").trim() };
  } else if (kind === "TYPED") {
    input = { kind: "TYPED", text: String(form.get("text") ?? "") };
  } else if (kind === "DOCUMENT" || kind === "IMAGE") {
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    input = { kind, files };
  } else {
    return { phase: "failed", message: "형식을 고르지 않았습니다." };
  }

  const outcome = await submitMaterial(token, input);
  if (!outcome.ok) return { phase: "failed", message: outcome.message };

  return {
    phase: "ok",
    text: outcome.items.map((i) => "  ".repeat(i.depth) + i.title).join("\n"),
    message: `목차 ${outcome.items.length}개를 읽었습니다. 확인하고 고쳐 주세요.`,
  };
}

/** 강사가 확인한 목차를 확정한다. */
export async function confirmTocAction(
  token: string,
  text: string,
): Promise<ActionState> {
  const outcome = await confirmToc(token, text);
  if (!outcome.ok) return { ok: false, message: outcome.message };

  revalidatePath(`/instructor/${token}`);
  revalidatePath(`/instructor/${token}/material`);
  return { ok: true, message: `목차 ${outcome.items.length}개를 확정했습니다.` };
}

/** 목차를 모두 지운다. */
export async function clearTocAction(token: string): Promise<ActionState> {
  const done = await clearToc(token);
  if (!done) return { ok: false, message: "이 주소는 열리지 않습니다." };

  revalidatePath(`/instructor/${token}`);
  revalidatePath(`/instructor/${token}/material`);
  return { ok: true, message: "목차를 지웠습니다." };
}
