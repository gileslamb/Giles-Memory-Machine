/**
 * Next.js instrumentation — runs when server starts.
 * Starts the Memory Inbox folder watcher (Node.js only).
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startInboxWatcher } = await import("./src/lib/inbox-watcher");
    await startInboxWatcher();
  }
}
