import { NextResponse } from "next/server";
import { readInboxStatus } from "@/lib/inbox-status";
import { countFilesWaiting } from "@/lib/inbox-processor";

export async function GET() {
  try {
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
