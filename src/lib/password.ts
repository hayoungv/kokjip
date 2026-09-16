import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * 비밀번호를 그대로 저장하지 않고 되돌릴 수 없는 형태로 바꿔 둔다.
 *
 * 바꿀 때마다 무작위 값을 함께 섞는다. 그래야 두 사람이 같은 비밀번호를
 * 쓰더라도 저장된 값이 달라진다. 값이 같으면 비밀번호가 같다는 사실이
 * 드러나고, 흔한 비밀번호의 변환값을 미리 계산해 둔 표로 되짚을 수도 있다.
 * 섞은 값은 비밀이 아니라 결과 옆에 함께 두고 대조할 때 다시 꺼내 쓴다.
 *
 * 대조할 때는 걸린 시간으로 정답을 짐작할 수 없게 비교한다.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  // 저장할 때마다 새로 만드는 무작위 값
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}
