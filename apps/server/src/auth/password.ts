import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SCHEME = "scrypt";

/**
 * 비밀번호 해싱. Node 내장 scrypt 를 쓰므로 네이티브 의존성이 없다.
 * 저장 형식: `scrypt$<salt hex>$<hash hex>`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${SCHEME}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split("$");
  if (scheme !== SCHEME || !salt || !hex) return false;

  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hex, "hex");

  // 길이가 다르면 timingSafeEqual 이 던지므로 먼저 확인한다
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
