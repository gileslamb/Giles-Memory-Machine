import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";
import { readMasterFile } from "@/lib/file-system";
import { parseContextMarkdown } from "@/lib/parse-context";

const OVERVIEW_ROLE = `You have two modes:

1. **Status Commentary** — When asked "how am I doing?" or similar, give a brief, honest life-coach-style assessment. Structure it like:
   - ✅ What's going well / good momentum
   - 👀 What seems to have been dropped or neglected
   - ⚠️ Where you might be drifting off course
   - 🎯 Overall verdict — are actions aligning with purpose?
   Keep it warm but direct. Not cheerleading — genuine signal.

2. **Advisor** — Answer specific questions about direction, next steps, priorities, or creative decisions based on the context below.

When asked "what's the single next thing I should do?", give ONE clear, concrete action. No lists. No hedging.

You can also suggest what to add to the context — e.g. "You might add an update on X" or "Consider pasting your latest Y into the paste box."`;

const STATUS_PROMPT = `Give a one-line status verdict based on the context. Format: ✅ [one thing going well] · 👀 [one thing neglected] · 🎯 [brief verdict]. Keep it under 120 chars. Warm but direct.`;

async function getAdvisorResponse(systemPrompt: string, userMessage: string) {
  const context = await readMasterFile();
  const parsed = parseContextMarkdown(context);
  const staleEntries = parsed.layers.flatMap((l) =>
    l.entries.filter((e) => e.healthTier >= 2).map((e) => `${e.name} (${e.daysSinceUpdate}d)`)
  );

  const fullSystem = `${systemPrompt}

--- CONTEXT ---

${context}

STALE ENTRIES (15+ days no update): ${staleEntries.length ? staleEntries.join(", ") : "none"}`;

  try {
    const { text } = await generate({
      system: fullSystem,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 256,
    });
    return text.trim() || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const status = await getAdvisorResponse(OVERVIEW_ROLE, STATUS_PROMPT);
    return NextResponse.json({ status: status ?? "No status available." });
  } catch (error) {
    console.error("Status failed:", error);
    return NextResponse.json(
      { status: error instanceof Error ? error.message : "Could not load status." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages must be an array" },
        { status: 400 }
      );
    }

    const context = await readMasterFile();
    const parsed = parseContextMarkdown(context);
    const staleEntries = parsed.layers.flatMap((l) =>
      l.entries.filter((e) => e.healthTier >= 2).map((e) => `${e.name} (${e.daysSinceUpdate}d)`)
    );

    const systemPrompt = `${OVERVIEW_ROLE}

--- CONTEXT ---

${context}

STALE ENTRIES (15+ days no update): ${staleEntries.length ? staleEntries.join(", ") : "none"}`;

    const apiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const { text } = await generate({
      system: systemPrompt,
      messages: apiMessages,
      maxTokens: 1024,
    });

    return NextResponse.json({ reply: text.trim() });
  } catch (error) {
    console.error("Advisor failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Advisor failed",
      },
      { status: 500 }
    );
  }
}
