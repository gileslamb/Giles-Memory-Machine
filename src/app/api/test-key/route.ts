import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * GET /api/test-key — Verify API key is loaded and can reach Anthropic.
 * Use this to confirm your key is correct and has credits.
 */
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "ANTHROPIC_API_KEY not found in environment",
        hint: "Add it to .env.local and restart the dev server",
      },
      { status: 500 }
    );
  }

  // Mask key for logging (show first 12 and last 4 chars)
  const masked =
    apiKey.slice(0, 15) + "..." + apiKey.slice(-4);

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 10,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
    });

    const text = response.content.find(
      (b): b is { type: "text"; text: string } => b.type === "text"
    );

    return NextResponse.json({
      ok: true,
      message: "API key works. Claude responded successfully.",
      keyPreview: masked,
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
        keyPreview: masked,
        hint:
          message.toLowerCase().includes("credit") ||
          message.toLowerCase().includes("balance")
            ? "Go to console.anthropic.com → Settings → Plans & Billing to add credits. Ensure the key in .env.local matches the account you topped up."
            : message.toLowerCase().includes("invalid") || message.toLowerCase().includes("authentication")
            ? "The API key may be wrong or revoked. Create a new key at console.anthropic.com and update .env.local"
            : "Check the error above and restart the server after updating .env.local",
      },
      { status }
    );
  }
}
