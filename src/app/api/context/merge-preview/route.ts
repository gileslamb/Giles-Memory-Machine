import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";
import { readMasterFile } from "@/lib/file-system";
import { preserveTodosInMerge } from "@/lib/parse-todos";
import { SCHEMA_PROMPT } from "@/lib/schema";

/**
 * Preview merge: returns summary + proposed content without writing.
 */
export async function POST(request: Request) {
  try {
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

    const systemPrompt = `You are a context manager for a creative practitioner. Your job is to merge incoming content into a master AI_CONTEXT.md file.

${SCHEMA_PROMPT}

MERGE RULES (critical):
1. NEVER overwrite existing content — always merge and update
2. If a project/area already exists, UPDATE its entry rather than duplicating
3. Add "Last updated: [ISO date]" to any section that changes — ALWAYS use today's date (${today})
4. Keep the file clean, readable, and concise — summarise rather than dump raw text
5. Structure each project/area entry: what it is, current status, key people, next steps
6. Preserve the four-layer structure (PROJECTS, ADMIN, VISION / IDEAS, LIFE)
7. Output a JSON object with three fields:
   - "summary": A brief 2–4 sentence summary of what will be merged (e.g. "Adds new project X from meeting notes. Updates project Y with latest status. No changes to ADMIN.")
   - "mergedContent": The complete merged markdown file (no preamble, no code blocks)
   - "ack": A warm, conversational reply as if you're a supportive assistant. 2–3 short sentences. Examples of tone:
      • "I've got that — I'll add it to the scoring project info. Keep an eye on timescales."
      • "Great feedback. It looks like this is coming on line — I've noted it."
      • "Got it. I've updated the admin section with that. Let me know if anything else comes up."
   Be specific about what you're adding (project name, section, etc). Add a brief relevant nudge or observation when it fits (deadlines, risks, follow-ups). Sound engaged and helpful, not robotic.`;

    const userContent = `Current AI_CONTEXT.md content:

\`\`\`markdown
${currentContext}
\`\`\`

---

User pasted the following. Read it, identify which layer and category it belongs to, extract what's relevant, and merge it into the appropriate section(s). Output a JSON object with "summary", "mergedContent", and "ack" only. No other text.

\`\`\`
${content}
\`\`\``;

    const { text } = await generate({
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
      maxTokens: 8192,
    });

    let jsonStr = text.trim();
    // Strip markdown code blocks if present (AI often wraps JSON in ```json ... ```)
    const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      jsonStr = codeMatch[1].trim();
    }
    // Fallback: extract first { ... } block in case of malformed wrapping
    if (jsonStr.includes("`") || !jsonStr.startsWith("{")) {
      const braceStart = jsonStr.indexOf("{");
      const braceEnd = jsonStr.lastIndexOf("}");
      if (braceStart >= 0 && braceEnd > braceStart) {
        jsonStr = jsonStr.slice(braceStart, braceEnd + 1);
      }
    }

    const parsed = JSON.parse(jsonStr) as {
      summary?: string;
      mergedContent?: string;
      ack?: string;
    };
    const summary = parsed.summary ?? "Merge preview";
    const ack = typeof parsed.ack === "string" ? parsed.ack.trim() : null;
    let mergedContent = parsed.mergedContent ?? "";

    if (typeof mergedContent !== "string") {
      return NextResponse.json(
        { error: "Invalid response from AI" },
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

    // Safeguard: reject if output is suspiciously short (likely overwrite bug)
    const hasProjects = /##\s*PROJECTS/i.test(mergedContent);
    const hasAdmin = /##\s*ADMIN/i.test(mergedContent);
    const hasVision = /##\s*VISION\s*\/?\s*IDEAS/i.test(mergedContent);
    const hasLife = /##\s*LIFE/i.test(mergedContent);
    const hasAllHeaders = hasProjects && hasAdmin && hasVision && hasLife;
    const minLength = Math.floor((currentContext?.length ?? 0) * 0.25);
    if (!hasAllHeaders || mergedContent.length < minLength) {
      return NextResponse.json(
        { error: "Merge output invalid — key sections missing or content too short. Try again or use Paste." },
        { status: 500 }
      );
    }

    mergedContent = preserveTodosInMerge(currentContext, mergedContent);

    return NextResponse.json({
      success: true,
      summary,
      proposedContent: mergedContent,
      ack: ack || "Added.",
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
