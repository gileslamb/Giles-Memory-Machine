import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";
import { SCHEMA_PROMPT } from "@/lib/schema";

const REPLY = "Got it.";

async function mergeInBackground(text: string): Promise<void> {
  try {
    const currentContext = await readMasterFile();
    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a silent context manager. You receive information and save it. You NEVER analyse, summarise, or give feedback.

Merge incoming content into AI_CONTEXT.md.

${SCHEMA_PROMPT}

MERGE RULES:
1. NEVER overwrite existing content — always merge and update
2. If a project/area exists, UPDATE it rather than duplicating
3. Add "Last updated: [ISO date]" to any section that changes — use today (${today})
4. Keep the file clean and concise — summarise, don't dump raw text
5. Preserve the four-layer structure (PROJECTS, ADMIN, VISION / IDEAS, LIFE)
6. Output a JSON object with one field: "mergedContent" — the complete merged markdown (no preamble, no code blocks)`;

    const userContent = `Current AI_CONTEXT.md:

\`\`\`markdown
${currentContext}
\`\`\`

---

User sent:

\`\`\`
${text}
\`\`\`

Output JSON with "mergedContent" only.`;

    const { text: raw } = await generate({
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
      maxTokens: 8192,
    });

    let jsonStr = raw.trim();
    const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();
    const braceStart = jsonStr.indexOf("{");
    const braceEnd = jsonStr.lastIndexOf("}");
    if (braceStart >= 0 && braceEnd > braceStart) {
      jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
    }

    const parsed = JSON.parse(jsonStr) as { mergedContent?: string };
    let merged = typeof parsed.mergedContent === "string" ? parsed.mergedContent : "";

    merged = merged.replace(/\*?Last updated:\s*\d{4}-\d{2}-\d{2}\*?/gi, `*Last updated: ${today}*`);
    merged = merged.replace(/Last updated:\s*\d{4}-\d{2}-\d{2}/gi, `Last updated: ${today}`);

    const hasProjects = /##\s*PROJECTS/i.test(merged);
    const hasAdmin = /##\s*ADMIN/i.test(merged);
    const hasVision = /##\s*VISION\s*\/?\s*IDEAS/i.test(merged);
    const hasLife = /##\s*LIFE/i.test(merged);
    const minLen = Math.floor(currentContext.length * 0.25);
    if (hasProjects && hasAdmin && hasVision && hasLife && merged.length >= minLen) {
      await writeMasterFile(merged);
    }
  } catch (err) {
    console.error("Background merge failed:", err);
  }
}

/**
 * POST /api/simple-merge — Returns immediately, merges in background.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body.text === "string" ? body.text : "";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    if (text.trim()) {
      mergeInBackground(text.trim()).catch(() => {});
    }

    return NextResponse.json({ reply: REPLY });
  } catch (err) {
    console.error("simple-merge failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
