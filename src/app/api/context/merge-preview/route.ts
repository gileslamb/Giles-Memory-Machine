import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readMasterFile } from "@/lib/file-system";
import { SCHEMA_PROMPT } from "@/lib/schema";

/**
 * Preview merge: returns summary + proposed content without writing.
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { pastedContent } = body;
    const content = typeof pastedContent === "string" ? pastedContent : null;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "pastedContent must be a non-empty string" },
        { status: 400 }
      );
    }

    const currentContext = await readMasterFile();
    const today = new Date().toISOString().slice(0, 10);

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: `You are a context manager for a creative practitioner. Your job is to merge incoming content into a master AI_CONTEXT.md file.

${SCHEMA_PROMPT}

MERGE RULES (critical):
1. NEVER overwrite existing content — always merge and update
2. If a project/area already exists, UPDATE its entry rather than duplicating
3. Add "Last updated: [ISO date]" to any section that changes — ALWAYS use today's date (${today})
4. Keep the file clean, readable, and concise — summarise rather than dump raw text
5. Structure each project/area entry: what it is, current status, key people, next steps
6. Preserve the three-layer structure (PROJECTS, ADMIN, VISION / IDEAS)
7. Output a JSON object with two fields:
   - "summary": A brief 2–4 sentence summary of what will be merged (e.g. "Adds new project X from meeting notes. Updates project Y with latest status. No changes to ADMIN.")
   - "mergedContent": The complete merged markdown file (no preamble, no code blocks)`,
      messages: [
        {
          role: "user",
          content: `Current AI_CONTEXT.md content:

\`\`\`markdown
${currentContext}
\`\`\`

---

User pasted the following. Read it, identify which layer and category it belongs to, extract what's relevant, and merge it into the appropriate section(s). Output a JSON object with "summary" and "mergedContent" only. No other text.

\`\`\`
${content}
\`\`\``,
        },
      ],
    });

    const textBlock = response.content.find(
      (block): block is { type: "text"; text: string } => block.type === "text"
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "Claude did not return text" },
        { status: 500 }
      );
    }

    let jsonStr = textBlock.text.trim();
    const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      jsonStr = codeMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr) as { summary?: string; mergedContent?: string };
    const summary = parsed.summary ?? "Merge preview";
    let mergedContent = parsed.mergedContent ?? "";

    if (typeof mergedContent !== "string") {
      return NextResponse.json(
        { error: "Invalid response from Claude" },
        { status: 500 }
      );
    }

    mergedContent = mergedContent.replace(
      /\*?Last updated:\s*\d{4}-\d{2}-\d{2}\*?/gi,
      `*Last updated: ${today}*`
    );
    mergedContent = mergedContent.replace(
      /Last updated:\s*\d{4}-\d{2}-\d{2}/gi,
      `Last updated: ${today}`
    );

    return NextResponse.json({
      success: true,
      summary,
      proposedContent: mergedContent,
    });
  } catch (error) {
    console.error("Merge preview failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to preview merge",
      },
      { status: 500 }
    );
  }
}
