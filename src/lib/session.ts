import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 훈련기관 담당자의 로그인 상태를 쿠키에 담는다.
 *
 * 쿠키 값에 서명을 붙여 누군가 값을 고쳐도 알아챌 수 있게 한다.
 * 서명 열쇠가 설정돼 있지 않으면 개발용 기본값을 쓴다.
 */

const COOKIE_NAME = "kokjip_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function secret(): string {
  return process.env.SESSION_SECRET ?? "kokjip-development-secret";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function isSameSignature(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function startSession(adminId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, `${adminId}.${sign(adminId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** 로그인한 담당자의 식별자를 돌려준다. 없으면 `null`이다. */
export async function readSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const at = raw.lastIndexOf(".");
  if (at <= 0) return null;

  const adminId = raw.slice(0, at);
  const signature = raw.slice(at + 1);

  return isSameSignature(signature, sign(adminId)) ? adminId : null;
}
