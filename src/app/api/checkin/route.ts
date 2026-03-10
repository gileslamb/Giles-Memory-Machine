import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";
import {
  readMasterFile,
  readCheckinsFile,
  appendToCheckins,
} from "@/lib/file-system";
import { parseContextMarkdown } from "@/lib/parse-context";

export async function GET() {
  try {
    const checkins = await readCheckinsFile();
    const match = checkins.match(/## (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/g);
    const lastDate = match ? match[match.length - 1]?.replace("## ", "") : null;
    return NextResponse.json({
      lastCheckinDate: lastDate,
      daysSinceCheckin: lastDate
        ? Math.floor(
            (Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    });
  } catch {
    return NextResponse.json({ lastCheckinDate: null, daysSinceCheckin: null });
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

    const [context, checkins] = await Promise.all([
      readMasterFile(),
      readCheckinsFile(),
    ]);

    const parsed = parseContextMarkdown(context);
    const staleEntries = parsed.layers.flatMap((l) =>
      l.entries.filter((e) => e.healthTier >= 2).map((e) => `${e.name} (${e.daysSinceUpdate}d)`)
    );
    const contextSummary = parsed.layers
      .map(
        (l) =>
          `${l.name}: ${l.entries.map((e) => `${e.name} — ${e.summary?.slice(0, 80) || "no summary"}`).join("; ")}`
      )
      .join("\n");

    const systemPrompt = `You are a supportive check-in companion for a creative practitioner. You have access to their AI_CONTEXT.md (projects, admin, vision) and CHECKINS.md (past conversations).

BEHAVIOUR:
- Conversational, one question or observation at a time. Never naggy.
- You know: projects, when things were last updated, outstanding todos.
- Extract from the conversation: 1) any new project/context info to merge into AI_CONTEXT.md, 2) any action items (todos).

REVIEW FLOW:
- When the user says "done", "that's it", or indicates they're finished, generate a review summary showing exactly what you're proposing to add.
- Format the review clearly, e.g. "Here's what I'm about to add to your context: PROJECTS → organism: [updates]. TODOS → [list]. Does this look right? Type 'yes' to commit, or correct anything first."
- NEVER write to files yourself. You only propose. The user must confirm with "yes", "commit", "looks good", or similar before anything is written.
- If the user corrects something, update your proposal and ask again.

RESPONSE FORMAT:
Reply naturally. At the very end, if you have context updates OR todos to propose, add:
\`\`\`ACTIONS
{"contextUpdates": "optional markdown snippet to merge", "todos": [{"text": "todo text", "status": "open", "category": "Projects > organism"}]}
\`\`\`

- contextUpdates: only if user shared new project info, status updates, decisions. Omit if nothing to merge.
- todos: array of {text, status: "open"|"done", category}. Category format: "Layer > entry".
- If neither, omit the ACTIONS block. These are PROPOSALS only — nothing is written until the user confirms.`;

    const todosMatch = context.match(/## CURRENT TODOS\n([\s\S]*?)(?=\n## |$)/);
    const todosBlock = todosMatch ? todosMatch[1].trim() : "";

    const contextBlock = `
CURRENT CONTEXT SUMMARY:
${contextSummary}

STALE ENTRIES (15+ days): ${staleEntries.length ? staleEntries.join(", ") : "none"}

CURRENT TODOS:
${todosBlock || "none"}

RECENT CHECK-INS:
${checkins.slice(-2000)}
`;

    const fullSystemPrompt = systemPrompt + contextBlock;

    const apiMessages: { role: "user" | "assistant"; content: string }[] =
      messages.length > 0
        ? messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        : [
            {
              role: "user",
              content:
                "Start a check-in. Greet based on the context. One observation, one question. Be conversational, never naggy.",
            },
          ];

    const { text } = await generate({
      system: fullSystemPrompt,
      messages: apiMessages,
      maxTokens: 4096,
    });

    let reply = text.trim();
    const actionsMatch = reply.match(/```ACTIONS\s*([\s\S]*?)```/);
    let pendingReview: { contextUpdates?: string; todos?: unknown[] } | null = null;

    if (actionsMatch) {
      reply = reply.replace(/```ACTIONS[\s\S]*?```/, "").trim();
      try {
        const actions = JSON.parse(actionsMatch[1].trim());
        if (
          (actions.contextUpdates && typeof actions.contextUpdates === "string") ||
          (Array.isArray(actions.todos) && actions.todos.length > 0)
        ) {
          pendingReview = {
            contextUpdates: actions.contextUpdates,
            todos: actions.todos || [],
          };
        }
      } catch (e) {
        console.error("Parse actions failed:", e);
      }
    }

    const lastUser = messages.filter((m: { role: string }) => m.role === "user").pop();
    const checkinBlock = lastUser
      ? `**User:** ${lastUser.content}\n\n**Assistant:** ${reply}`
      : `**Assistant (greeting):** ${reply}`;
    await appendToCheckins(checkinBlock);

    return NextResponse.json({ reply, pendingReview });
  } catch (error) {
    console.error("Check-in failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Check-in failed",
      },
      { status: 500 }
    );
  }
}
