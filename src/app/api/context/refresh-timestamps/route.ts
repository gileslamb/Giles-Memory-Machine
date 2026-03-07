import { NextResponse } from "next/server";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";

/**
 * Refresh all "Last updated" timestamps in AI_CONTEXT.md to today.
 * Use when content is current but dates are old (e.g. after migration).
 */
export async function POST() {
  try {
    const content = await readMasterFile();
    const today = new Date().toISOString().slice(0, 10);

    const refreshed = content
      .replace(/\*?Last updated:\s*\d{4}-\d{2}-\d{2}\*?/gi, `*Last updated: ${today}*`)
      .replace(/Last updated:\s*\d{4}-\d{2}-\d{2}/gi, `Last updated: ${today}`);

    await writeMasterFile(refreshed);

    return NextResponse.json({ success: true, content: refreshed });
  } catch (error) {
    console.error("Refresh timestamps failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh" },
      { status: 500 }
    );
  }
}
