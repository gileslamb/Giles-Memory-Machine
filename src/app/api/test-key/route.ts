import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";

/**
 * GET /api/test-key — Verify Claude API is working.
 */
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "No AI provider available",
        hint: "Add ANTHROPIC_API_KEY to .env.local",
      },
      { status: 500 }
    );
  }

  try {
    const { text } = await generate({
      system: "Reply with exactly: OK",
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      maxTokens: 10,
    });

    return NextResponse.json({
      ok: true,
      message: "Claude responded successfully.",
      provider: "claude",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const status =
      typeof (err as { status?: number })?.status === "number"
        ? (err as { status: number }).status
        : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
        hint:
          message.toLowerCase().includes("credit") ||
          message.toLowerCase().includes("balance")
            ? "Go to console.anthropic.com → Settings → Plans & Billing to add credits."
            : message.toLowerCase().includes("invalid") ||
              message.toLowerCase().includes("authentication")
            ? "The API key may be wrong or revoked. Create a new key at console.anthropic.com"
            : "Check the error above and restart the server",
      },
      { status }
    );
  }
}
