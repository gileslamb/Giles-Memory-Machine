import { NextResponse } from "next/server";
import { generate } from "@/lib/ai-client";

export interface ProjectInput {
  name: string;
  summary: string;
  lastUpdated: string | null;
  daysSinceUpdate: number | null;
}

export interface ProjectPriorityResult {
  name: string;
  rank: number;
  reason: string;
}

const SYSTEM_PROMPT = `You are a priority scorer. Given a list of projects with metadata, rank them 1-5 (1 = highest priority) based on:
- Deadline proximity (e.g. Berlin in 6 weeks = high)
- Recent momentum (frequently updated = higher)
- Open blockers (unresolved issues = higher urgency)
- Overdue todos attached to that project

Return a JSON array of objects: [{ "name": "ProjectName", "rank": 1, "reason": "Brief reason" }].
Order by rank ascending (1 first). One object per project. No preamble.`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const projects = body.projects as ProjectInput[] | undefined;
    if (!Array.isArray(projects) || projects.length === 0) {
      return NextResponse.json(
        { error: "projects array required" },
        { status: 400 }
      );
    }

    const userContent = `Projects to rank (max 5):

${projects
  .map(
    (p) =>
      `- ${p.name}: ${p.summary?.slice(0, 150) ?? ""}… | last updated: ${p.daysSinceUpdate ?? "?"} days ago`
  )
  .join("\n")}

Return JSON array: [{ "name": "...", "rank": 1, "reason": "..." }]`;

    const { text } = await generate({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      maxTokens: 1024,
    });

    let jsonStr = text.trim();
    const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();
    const bracketStart = jsonStr.indexOf("[");
    const bracketEnd = jsonStr.lastIndexOf("]");
    if (bracketStart >= 0 && bracketEnd > bracketStart) {
      jsonStr = jsonStr.slice(bracketStart, bracketEnd + 1);
    }

    const result = JSON.parse(jsonStr) as ProjectPriorityResult[];
    if (!Array.isArray(result)) {
      throw new Error("Invalid response format");
    }

    return NextResponse.json({ suggested: result });
  } catch (err) {
    console.error("Project priority failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
