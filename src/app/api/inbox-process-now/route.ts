import { NextResponse } from "next/server";
import { processAllWaitingFiles } from "@/lib/inbox-processor";

export const maxDuration = 300; // 5 min for LLM processing of multiple files

export async function POST() {
  try {
    const { processed, errors } = await processAllWaitingFiles();
    return NextResponse.json({
      processed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Inbox process-now failed:", error);
    return NextResponse.json(
      {
        processed: 0,
        errors: [error instanceof Error ? error.message : "Failed to process inbox"],
      },
      { status: 500 }
    );
  }
}
