import crypto from "crypto";
import { promisify } from "util";

const pbkdf2Async = promisify(crypto.pbkdf2);

export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const iterations = 10000;
  const keyLength = 64;
  const digest = "sha512";

  const derivedKey = await pbkdf2Async(
    password,
    salt,
    iterations,
    keyLength,
    digest
  );
  const hashPassword = derivedKey.toString("hex");
  return hashPassword;
}

export async function verifyPassword(
  providedPassword: string,
  storedHashedPassword: string,
  salt: string
): Promise<boolean> {
  const hashedPassword = await hashPassword(providedPassword, salt);
  return hashedPassword === storedHashedPassword;
}
