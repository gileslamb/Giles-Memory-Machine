import { NextResponse } from "next/server";
import { readInboxStatus } from "@/lib/inbox-status";
import { countFilesWaiting } from "@/lib/inbox-processor";
import { startInboxWatcher } from "@/lib/inbox-watcher";

export async function GET() {
  try {
    // Start watcher on first request (instrumentation may not run in prod)
    await startInboxWatcher();
    const [status, waiting] = await Promise.all([
      readInboxStatus(),
      countFilesWaiting(),
    ]);
    return NextResponse.json({
      ...status,
      filesWaiting: waiting,
    });
  } catch (error) {
    console.error("Inbox status failed:", error);
    return NextResponse.json(
      {
        filesWaiting: 0,
        lastProcessedFile: null,
        lastProcessedAt: null,
        lastError: error instanceof Error ? error.message : "Failed to load status",
        lastErrorAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
