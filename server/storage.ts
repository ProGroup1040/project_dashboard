import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveStorageFilePath } from "./_core/storagePaths";

function normalizeKey(relKey: string): string {
  let key = relKey.replaceAll("\\", "/");
  while (key.startsWith("/")) key = key.slice(1);
  // Validate the key before using it or returning it to the caller.
  resolveStorageFilePath(key);
  return key;
}

function toPublicUrl(key: string): string {
  return "/manus-storage/" + key.split("/").map(encodeURIComponent).join("/");
}

/**
 * Store uploaded files on persistent local storage.
 *
 * Set PRICING_STORAGE_DIR to a mounted persistent volume in deployments.
 * The legacy URL path is retained for compatibility with existing frontend
 * references; no Manus credentials or remote storage service are used.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const destination = resolveStorageFilePath(key);
  const directory = path.dirname(destination);
  const temporaryPath = destination + "." + randomUUID() + ".tmp";
  const buffer = Buffer.from(data);

  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporaryPath, buffer, { flag: "wx" });
    await rename(temporaryPath, destination);
  } catch (error) {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }

  return { key, url: toPublicUrl(key) };
}

/** Return the stable local URL for a stored object without an external signing service. */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  resolveStorageFilePath(key);
  return { key, url: toPublicUrl(key) };
}
