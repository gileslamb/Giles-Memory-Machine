import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";
import { readMasterFile, writeMasterFile, setNextArchivePreview } from "@/lib/file-system";
import { preserveTodosInMerge } from "@/lib/parse-todos";
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
6. Preserve the four-layer structure (PROJECTS, ADMIN, VISION / IDEAS, LIFE) and their category headings
7. Output ONLY the complete merged markdown file — no preamble, no explanation

CRITICAL — ## CURRENT TODOS: Never remove, replace, or truncate the existing ## CURRENT TODOS section. Preserve every existing todo line exactly. You may ADD new todos from the incoming content (format: - [ ] item · added ${today} · category. Do not duplicate. Do not remove any existing todos.`;
}

export async function POST(request: Request) {
  try {
    const { pastedContent } = await request.json();
    if (typeof pastedContent !== "string" || !pastedContent.trim()) {
      return NextResponse.json(
        { error: "pastedContent must be a non-empty string" },
        { status: 400 }
      );
    }

    const currentContext = await readMasterFile();

    const userContent = `Current AI_CONTEXT.md content:

\`\`\`markdown
${currentContext}
\`\`\`

---

User pasted the following. Read it, identify which layer and category it belongs to, extract what's relevant, and merge it into the appropriate section(s) of the master file. Output the complete merged AI_CONTEXT.md:

\`\`\`
${pastedContent}
\`\`\``;

    const { text } = await generate({
      system: getMergeSystemPrompt(),
      messages: [{ role: "user", content: userContent }],
      maxTokens: 8192,
    });

    let mergedContent = text.trim();
    const codeMatch = mergedContent.match(/```(?:markdown)?\s*([\s\S]*?)```/);
    if (codeMatch) {
      mergedContent = codeMatch[1].trim();
    }

    const today = new Date().toISOString().slice(0, 10);
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
        {
          error:
            "Merge output invalid — key sections missing or content too short. Try again or use Paste.",
        },
        { status: 500 }
      );
    }

    mergedContent = preserveTodosInMerge(currentContext, mergedContent);
    setNextArchivePreview(pastedContent);
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
