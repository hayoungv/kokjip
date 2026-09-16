"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { readSession } from "@/lib/session";
import { inviteInstructor } from "@/server/api/instructor";
import { readInstitutionView } from "@/server/api/institution";

/**
 * 훈련기관 화면이 부르는 처리.
 *
 * 기관으로 거르는 일을 여기서 한 번 더 한다. 담당자가 자기 기관의
 * 과정에만 손댈 수 있어야 한다.
 */

export type InviteState =
  | { ok: true; url: string; sent: boolean; message: string }
  | { ok: false; message: string };

/** 이 서버가 열려 있는 주소. 안내에 담을 주소를 만들 때 쓴다. */
async function baseUrl(): Promise<string> {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host") ?? "localhost:3000";
  const protocol = store.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/** 강사에게 전용 주소가 담긴 안내를 보낸다. */
export async function inviteAction(courseId: string): Promise<InviteState> {
  const adminId = await readSession();
  if (!adminId) return { ok: false, message: "다시 로그인해 주세요." };

  const view = await readInstitutionView(adminId);
  if (!view) return { ok: false, message: "다시 로그인해 주세요." };

  const mine = view.courses.some((course) => course.id === courseId);
  if (!mine) return { ok: false, message: "이 과정에는 손댈 수 없습니다." };

  const result = await inviteInstructor(courseId, await baseUrl());
  if (!result) return { ok: false, message: "과정을 찾지 못했습니다." };

  revalidatePath("/institution");
  return { ok: true, url: result.url, sent: result.sent, message: result.message };
}
