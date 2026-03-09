import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readMasterFile } from "@/lib/file-system";

const ENTRY_COACH_PROMPT = `You are a direct, practical coach. Given the full context of a single entry from the user's AI context file, write a 2-3 sentence note focused entirely on that entry. Cover: current status, what needs to happen next, any flags or urgent items. Be specific and actionable. No fluff. Warm but direct.`;

function extractLayerSection(content: string, layerHeader: string, nextHeader: string | null): string {
  const start = content.indexOf(layerHeader);
  if (start < 0) return "";
  const searchFrom = start + layerHeader.length;
  const end = nextHeader ? content.indexOf(nextHeader, searchFrom) : content.length;
  return content.slice(start, end >= 0 ? end : content.length).trim();
}

function extractEntryContent(content: string, layerName: string, entryName: string): string | null {
  const layerMap: Record<string, { header: string; next: string | null }> = {
    PROJECTS: { header: "## PROJECTS", next: "## ADMIN" },
    ADMIN: { header: "## ADMIN", next: "## VISION / IDEAS" },
    "VISION / IDEAS": { header: "## VISION / IDEAS", next: "## LIFE" },
    LIFE: { header: "## LIFE", next: null },
  };
  const config = layerMap[layerName];
  if (!config) return null;

  const section = extractLayerSection(content, config.header, config.next);
  const lines = section.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const boldMatch = lines[i].match(/^-\s+\*\*(.+?)\*\*\s*(?:—|–|-|:)/);
    if (!boldMatch || boldMatch[1].trim() !== entryName) continue;

    let block = lines[i];
    let j = i + 1;
    while (j < lines.length) {
      const next = lines[j];
      if (next.match(/^-\s+\*\*/) || next.match(/^###\s+/) || next.match(/^##\s+/)) break;
      block += "\n" + next;
      j++;
    }
    return block.trim();
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { layer, entryName } = await request.json();
    if (!layer || !entryName) {
      return NextResponse.json(
        { error: "layer and entryName required" },
        { status: 400 }
      );
    }

    const content = await readMasterFile();
    const entryContent = extractEntryContent(content, layer, entryName);
    if (!entryContent) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      system: ENTRY_COACH_PROMPT,
      messages: [
        {
          role: "user",
          content: `Entry: ${entryName}\n\n${entryContent}`,
        },
      ],
    });

    const textBlock = response.content.find(
      (b): b is { type: "text"; text: string } => b.type === "text"
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "Claude did not return text" },
        { status: 500 }
      );
    }

    return NextResponse.json({ reply: textBlock.text.trim() });
  } catch (error) {
    console.error("Entry coach failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Entry coach failed" },
      { status: 500 }
    );
  }
}
