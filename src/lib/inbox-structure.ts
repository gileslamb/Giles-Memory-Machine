/**
 * Memory Inbox folder structure and paths.
 * Google Drive syncs locally — we watch the local path.
 */

import fs from "fs/promises";
import path from "path";

export const MEMORY_INBOX_PATH =
  process.env.MEMORY_INBOX_PATH ||
  "/Users/gileslamb/Library/CloudStorage/GoogleDrive-giles@gileslamb.com/My Drive/MEMORY_INBOX";

export const INBOX_FOLDERS = {
  DROP: "00_DROP_HERE",
  PROJECTS: "Projects",
  ADMIN: "Admin",
  VISION: "Vision",
  LIFE: "Life",
  PROCESSED: "Processed",
} as const;

export const PROCESSED_SUBFOLDERS = [
  INBOX_FOLDERS.PROJECTS,
  INBOX_FOLDERS.ADMIN,
  INBOX_FOLDERS.VISION,
  INBOX_FOLDERS.LIFE,
  "Unrouted",
] as const;

export type InboxLayer = "projects" | "admin" | "vision" | "life";

export function getLayerFromFolder(folderName: string): InboxLayer | null {
  const map: Record<string, InboxLayer> = {
    [INBOX_FOLDERS.PROJECTS]: "projects",
    [INBOX_FOLDERS.ADMIN]: "admin",
    [INBOX_FOLDERS.VISION]: "vision",
    [INBOX_FOLDERS.LIFE]: "life",
  };
  return map[folderName] ?? null;
}

export async function ensureInboxStructure(): Promise<void> {
  const base = MEMORY_INBOX_PATH;
  await fs.mkdir(base, { recursive: true });
  await fs.mkdir(path.join(base, INBOX_FOLDERS.DROP), { recursive: true });
  await fs.mkdir(path.join(base, INBOX_FOLDERS.PROJECTS), { recursive: true });
  await fs.mkdir(path.join(base, INBOX_FOLDERS.ADMIN), { recursive: true });
  await fs.mkdir(path.join(base, INBOX_FOLDERS.VISION), { recursive: true });
  await fs.mkdir(path.join(base, INBOX_FOLDERS.LIFE), { recursive: true });
  const processed = path.join(base, INBOX_FOLDERS.PROCESSED);
  await fs.mkdir(processed, { recursive: true });
  for (const sub of PROCESSED_SUBFOLDERS) {
    await fs.mkdir(path.join(processed, sub), { recursive: true });
  }
}

const PROCESSED_SUBFOLDER_MAP: Record<InboxLayer | "unrouted", string> = {
  projects: INBOX_FOLDERS.PROJECTS,
  admin: INBOX_FOLDERS.ADMIN,
  vision: INBOX_FOLDERS.VISION,
  life: INBOX_FOLDERS.LIFE,
  unrouted: "Unrouted",
};

export function getProcessedDestPath(layer: InboxLayer | "unrouted", filename: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const prefix = `${date}_${filename}`;
  const subfolder = PROCESSED_SUBFOLDER_MAP[layer];
  return path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.PROCESSED, subfolder, prefix);
}
