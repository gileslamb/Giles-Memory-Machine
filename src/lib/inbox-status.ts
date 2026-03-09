/**
 * Inbox processing status — persisted to disk for dashboard display.
 */

import fs from "fs/promises";
import path from "path";
import { getDataDirectory } from "./file-system";

const STATUS_FILE = "inbox-status.json";

export interface InboxStatus {
  filesWaiting: number;
  lastProcessedFile: string | null;
  lastProcessedAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
}

const DEFAULT: InboxStatus = {
  filesWaiting: 0,
  lastProcessedFile: null,
  lastProcessedAt: null,
  lastError: null,
  lastErrorAt: null,
};

export async function readInboxStatus(): Promise<InboxStatus> {
  try {
    const dir = await getDataDirectory();
    const data = await fs.readFile(path.join(dir, STATUS_FILE), "utf-8");
    return { ...DEFAULT, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT };
  }
}

export async function writeInboxStatus(updates: Partial<InboxStatus>): Promise<void> {
  const current = await readInboxStatus();
  const next = { ...current, ...updates };
  const dir = await getDataDirectory();
  await fs.writeFile(path.join(dir, STATUS_FILE), JSON.stringify(next, null, 2), "utf-8");
}
