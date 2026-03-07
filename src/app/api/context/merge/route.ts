import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";
import { SCHEMA_PROMPT } from "@/lib/schema";

function getMergeSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `You are a context manager for a creative practitioner. Your job is to merge incoming content into a master AI_CONTEXT.md file.

${SCHEMA_PROMPT}

MERGE RULES (critical):
1. NEVER overwrite existing content — always merge and update
2. If a project/area already exists, UPDATE its entry rather than duplicating
3. Add "Last updated: [ISO date]" to any section that changes — ALWAYS use today's date (${today}). Never inherit dates from the pasted content; the source may be old but the context entry is new.
4. Keep the file clean, readable, and concise — summarise rather than dump raw text
5. Structure each project/area entry: what it is, current status, key people, next steps, decisions made
6. Preserve the three-layer structure (PROJECTS, ADMIN, VISION / IDEAS) and their category headings
7. Output ONLY the complete merged markdown file — no preamble, no explanation`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const { pastedContent } = await request.json();
    if (typeof pastedContent !== "string" || !pastedContent.trim()) {
      return NextResponse.json(
        { error: "pastedContent must be a non-empty string" },
        { status: 400 }
      );
    }

    const currentContext = await readMasterFile();

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: getMergeSystemPrompt(),
      messages: [
        {
          role: "user",
          content: `Current AI_CONTEXT.md content:

\`\`\`markdown
${currentContext}
\`\`\`

---

User pasted the following. Read it, identify which layer and category it belongs to, extract what's relevant, and merge it into the appropriate section(s) of the master file. Output the complete merged AI_CONTEXT.md:

\`\`\`
${pastedContent}
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

    // Extract markdown from response (handle code blocks if Claude wrapped it)
    let mergedContent = textBlock.text.trim();
    const codeMatch = mergedContent.match(/```(?:markdown)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      mergedContent = codeMatch[1].trim();
    }

    // Always use today's date for Last updated — never inherit from pasted content
    const today = new Date().toISOString().slice(0, 10);
    mergedContent = mergedContent.replace(
      /\*?Last updated:\s*\d{4}-\d{2}-\d{2}\*?/gi,
      `*Last updated: ${today}*`
    );
    mergedContent = mergedContent.replace(
      /Last updated:\s*\d{4}-\d{2}-\d{2}/gi,
      `Last updated: ${today}`
    );

    await writeMasterFile(mergedContent);

    return NextResponse.json({
      success: true,
      content: mergedContent,
    });
  } catch (error) {
    console.error("Merge failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to merge content",
      },
      { status: 500 }
    );
  }
}
