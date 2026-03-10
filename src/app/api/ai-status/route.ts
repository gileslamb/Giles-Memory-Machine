import { NextResponse } from "next/server";

/**
 * GET /api/ai-status — Claude-only. Returns claude | offline.
 */
export async function GET() {
  const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY;
  return NextResponse.json({
    state: hasClaudeKey ? "claude" : "offline",
  });
}
