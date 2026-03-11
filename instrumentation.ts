/**
 * Next.js instrumentation — runs when server starts.
 * Starts inbox watcher so files in MEMORY_INBOX get processed when the app runs.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startInboxWatcher } = await import("./src/lib/inbox-watcher");
      await startInboxWatcher();
      console.log("[Memory Machine] Inbox watcher started");
    } catch (err) {
      console.error("[Memory Machine] Inbox watcher failed to start:", err);
    }
  }
}
