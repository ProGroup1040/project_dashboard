import path from "node:path";

const DEFAULT_STORAGE_DIRECTORY = path.resolve(process.cwd(), "storage");

/** Persistent directory for uploaded files. Override this with a mounted volume in deployments. */
export function getStorageDirectory(): string {
  const configured = process.env.PRICING_STORAGE_DIR?.trim();
  return path.resolve(configured || DEFAULT_STORAGE_DIRECTORY);
}

/** Resolve a storage key while preventing path traversal outside the storage root. */
export function resolveStorageFilePath(key: string): string {
  const normalized = key.replace(/\\/g, "/").replace(/^\\/+/, "");
  const segments = normalized.split("/");

  if (
    !normalized ||
    segments.some(segment => !segment || segment === "." || segment === ".." || segment.includes("\0"))
  ) {
    throw new Error("Invalid storage key");
  }

  const root = getStorageDirectory();
  const filePath = path.resolve(root, ...segments);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    throw new Error("Invalid storage key");
  }

  return filePath;
}
