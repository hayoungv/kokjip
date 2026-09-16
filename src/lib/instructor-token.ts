import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * 강사 전용 주소.
 *
 * 강사는 계정을 만들지 않는다. 추측할 수 없는 값을 하나 만들어 주소에 담고,
 * 서버에는 그 값의 요약본만 둔다. 저장소가 새어도 주소를 되살릴 수 없다.
 */

/** 주소에 담기는 값의 길이. 32바이트를 글자로 옮긴다. */
const TOKEN_BYTES = 32;

/** 발급한 주소가 열려 있는 기간. */
export const TOKEN_TTL_DAYS = 14;

/** 새 값을 만든다. 이 값은 이 자리에서만 볼 수 있다. */
export function createToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** 저장소에 둘 요약본. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 두 요약본이 같은지 본다. 길이가 같아야 하므로 앞에서 걸러 낸다. */
export function isSameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** 지금부터 유효 기간이 끝나는 시각. */
export function expiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}
