import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const HASH_PATTERN = /^[a-f0-9]{32}:[a-f0-9]{128}$/i;

export function isPasswordHashed(password: string | null | undefined): boolean {
  return typeof password === "string" && HASH_PATTERN.test(password);
}

export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password is required");
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function comparePassword(
  password: string,
  storedPassword: string | null | undefined,
): Promise<boolean> {
  if (!storedPassword || !isPasswordHashed(storedPassword)) {
    return false;
  }

  const [salt, hash] = storedPassword.split(":");
  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedHash = Buffer.from(hash, "hex");
  if (storedHash.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedHash);
}
