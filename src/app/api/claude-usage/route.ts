import { NextResponse } from "next/server";
import { getClaudeUsage, estimateCost } from "@/lib/claude-usage";

/**
 * GET /api/claude-usage — Returns Claude API token usage and estimated cost.
 */
export async function GET() {
  try {
    const stats = await getClaudeUsage();
    const { totalUsd, dailyUsd } = estimateCost(stats);
    return NextResponse.json({
      ...stats,
      totalUsd: Math.round(totalUsd * 100) / 100,
      dailyUsd: Math.round(dailyUsd * 100) / 100,
    });
  } catch (err) {
    console.error("Claude usage fetch failed:", err);
    return NextResponse.json(
      {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        dailyInputTokens: 0,
        dailyOutputTokens: 0,
        totalUsd: 0,
        dailyUsd: 0,
        dateKey: new Date().toISOString().slice(0, 10),
        lastUpdated: null,
      },
      { status: 200 }
    );
  }
}
