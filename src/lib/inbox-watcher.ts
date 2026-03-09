/**
 * Chokidar watcher for Memory Inbox folder.
 * Runs when Next.js server starts (via instrumentation).
 */

import chokidar from "chokidar";
import path from "path";
import {
  MEMORY_INBOX_PATH,
  INBOX_FOLDERS,
  ensureInboxStructure,
} from "./inbox-structure";
import { processInboxFile } from "./inbox-processor";
import { writeInboxStatus } from "./inbox-status";

let watcher: ReturnType<typeof chokidar.watch> | null = null;
const processing = new Set<string>();

export async function startInboxWatcher(): Promise<void> {
  if (watcher) return;

  await ensureInboxStructure();

  watcher = chokidar.watch(
    [
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.DROP, "*"),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.PROJECTS, "*"),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.ADMIN, "*"),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.VISION, "*"),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.LIFE, "*"),
    ],
    {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 500 },
    }
  );

  watcher.on("add", async (filePath) => {
    if (processing.has(filePath)) return;
    const name = path.basename(filePath);
    if (name.startsWith(".")) return;

    const relative = path.relative(MEMORY_INBOX_PATH, filePath);
    const parts = relative.split(path.sep);
    const sourceFolder = parts[0] ?? INBOX_FOLDERS.DROP;

    processing.add(filePath);
    try {
      await processInboxFile(filePath, sourceFolder);
    } finally {
      processing.delete(filePath);
    }
  });

  // Update filesWaiting periodically
  const updateCount = async () => {
    const { countFilesWaiting } = await import("./inbox-processor");
    const count = await countFilesWaiting();
    await writeInboxStatus({ filesWaiting: count });
  };
  watcher.on("add", updateCount);
  watcher.on("unlink", updateCount);

  // Initial count
  const { countFilesWaiting } = await import("./inbox-processor");
  const count = await countFilesWaiting();
  await writeInboxStatus({ filesWaiting: count });

  console.log(`[Memory Machine] Inbox watcher started: ${MEMORY_INBOX_PATH}`);
}

export function stopInboxWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log("[Memory Machine] Inbox watcher stopped");
  }
}
