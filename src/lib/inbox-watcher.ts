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
import { processInboxFile, listFilesWaiting, countFilesWaiting } from "./inbox-processor";
import { writeInboxStatus } from "./inbox-status";

let watcher: ReturnType<typeof chokidar.watch> | null = null;
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
const processing = new Set<string>();
let queue: { filePath: string; sourceFolder: string }[] = [];
let processingQueue = false;

async function processQueue() {
  if (processingQueue || queue.length === 0) return;
  processingQueue = true;
  while (queue.length > 0) {
    const next = queue.shift()!;
    if (processing.has(next.filePath)) continue;
    processing.add(next.filePath);
    try {
      console.log(`[Memory Machine] Processing: ${path.basename(next.filePath)}`);
      const result = await processInboxFile(next.filePath, next.sourceFolder);
      if (result.success) {
        console.log(`[Memory Machine] Done: ${path.basename(next.filePath)}`);
      } else {
        console.log(`[Memory Machine] Failed: ${path.basename(next.filePath)} - ${result.error}`);
      }
    } finally {
      processing.delete(next.filePath);
      const { countFilesWaiting } = await import("./inbox-processor");
      const count = await countFilesWaiting();
      await writeInboxStatus({ filesWaiting: count });
    }
  }
  processingQueue = false;
}

function enqueue(filePath: string, sourceFolder: string) {
  const name = path.basename(filePath);
  if (name.startsWith(".")) return;
  if (processing.has(filePath)) return;
  queue.push({ filePath, sourceFolder });
  processQueue();
}

export async function startInboxWatcher(): Promise<void> {
  if (watcher) return;

  await ensureInboxStructure();

  // Process existing files in background — don't block server startup
  void (async () => {
    const { processAllWaitingFiles } = await import("./inbox-processor");
    const existing = await listFilesWaiting();
    if (existing.length > 0) {
      console.log(`[Memory Machine] Processing ${existing.length} existing inbox file(s) on startup…`);
      const { processed, errors } = await processAllWaitingFiles();
      if (processed > 0) console.log(`[Memory Machine] Processed ${processed} file(s) on startup`);
      if (errors.length > 0) console.error(`[Memory Machine] Startup errors:`, errors);
    }
  })();

  watcher = chokidar.watch(
    [
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.DROP),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.PROJECTS),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.ADMIN),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.VISION),
      path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.LIFE),
    ],
    {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 2000 },
      usePolling: true,
      interval: 5000,
    }
  );

  watcher.on("add", (filePath) => {
    const relative = path.relative(MEMORY_INBOX_PATH, filePath);
    const parts = relative.split(path.sep);
    const sourceFolder = parts[0] ?? INBOX_FOLDERS.DROP;
    enqueue(filePath, sourceFolder);
  });

  // Update filesWaiting when files change
  watcher.on("add", async () => {
    const count = await countFilesWaiting();
    await writeInboxStatus({ filesWaiting: count });
  });
  watcher.on("unlink", async () => {
    const count = await countFilesWaiting();
    await writeInboxStatus({ filesWaiting: count });
  });

  const count = await countFilesWaiting();
  await writeInboxStatus({ filesWaiting: count });
  console.log(`[Memory Machine] Inbox watcher ready: ${MEMORY_INBOX_PATH} (${count} files waiting)`);

  // Periodic backup scan (every 2 min) — catches files chokidar may miss on Google Drive
  pollIntervalId = setInterval(async () => {
    if (!watcher) return;
    const waiting = await listFilesWaiting();
    if (waiting.length === 0) return;
    for (const { filePath, sourceFolder } of waiting) {
      if (processing.has(filePath)) continue;
      enqueue(filePath, sourceFolder);
    }
  }, 120000);
  if (typeof (pollIntervalId as NodeJS.Timeout).unref === "function") {
    (pollIntervalId as NodeJS.Timeout).unref();
  }
}

export function stopInboxWatcher(): void {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  if (watcher) {
    watcher.close();
    watcher = null;
    console.log("[Memory Machine] Inbox watcher stopped");
  }
}
