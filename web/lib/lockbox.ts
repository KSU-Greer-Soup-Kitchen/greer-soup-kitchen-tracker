// Locks private answers before they go into the database, and unlocks them for staff.
// Uses AES-256-GCM with the key in STEP_APPLICATION_KEY (32 random bytes, base64).
// Make a key with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
// If the key is lost, saved applications can't be read. Keep a copy somewhere safe.

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

type Env = Record<string, string | undefined>;

function readKey(env: Env): Buffer | null {
  const raw = env.STEP_APPLICATION_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

// True when a valid key is set, so applications can be taken
export function lockboxReady(env: Env = process.env): boolean {
  return readKey(env) !== null;
}

export function lock(data: unknown, env: Env = process.env): string {
  const key = readKey(env);
  if (!key) throw new Error("STEP_APPLICATION_KEY is missing or not 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), body.toString("base64")].join(".");
}

// Throws if the key is wrong or the saved text was changed
export function unlock<T>(locked: string, env: Env = process.env): T {
  const key = readKey(env);
  if (!key) throw new Error("STEP_APPLICATION_KEY is missing or not 32 bytes");
  const [version, iv, tag, body] = locked.split(".");
  if (version !== "v1" || !iv || !tag || !body) throw new Error("Not a locked value");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const text = Buffer.concat([decipher.update(Buffer.from(body, "base64")), decipher.final()]).toString("utf8");
  return JSON.parse(text) as T;
}
