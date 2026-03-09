import { NextResponse } from "next/server";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";

function extractLayerSection(content: string, layerHeader: string, nextHeader: string | null): string {
  const start = content.indexOf(layerHeader);
  if (start < 0) return "";
  const searchFrom = start + layerHeader.length;
  const end = nextHeader ? content.indexOf(nextHeader, searchFrom) : content.length;
  return content.slice(start, end >= 0 ? end : content.length).trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const layer = searchParams.get("layer");
    const entryName = searchParams.get("name");
    if (!layer || !entryName) {
      return NextResponse.json({ error: "layer and name required" }, { status: 400 });
    }

    const content = await readMasterFile();
    const layerMap: Record<string, { header: string; next: string | null }> = {
      PROJECTS: { header: "## PROJECTS", next: "## ADMIN" },
      ADMIN: { header: "## ADMIN", next: "## VISION / IDEAS" },
      "VISION / IDEAS": { header: "## VISION / IDEAS", next: "## LIFE" },
      LIFE: { header: "## LIFE", next: null },
    };
    const config = layerMap[layer];
    if (!config) return NextResponse.json({ error: "Invalid layer" }, { status: 400 });

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
      return NextResponse.json({ content: block.trim() });
    }
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  } catch (error) {
    console.error("Get entry failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { layer, entryName, content: newContent } = await request.json();
    if (!layer || !entryName || typeof newContent !== "string") {
      return NextResponse.json({ error: "layer, entryName, content required" }, { status: 400 });
    }

    const content = await readMasterFile();
    const layerMap: Record<string, { header: string; next: string | null }> = {
      PROJECTS: { header: "## PROJECTS", next: "## ADMIN" },
      ADMIN: { header: "## ADMIN", next: "## VISION / IDEAS" },
      "VISION / IDEAS": { header: "## VISION / IDEAS", next: "## LIFE" },
      LIFE: { header: "## LIFE", next: null },
    };
    const config = layerMap[layer];
    if (!config) return NextResponse.json({ error: "Invalid layer" }, { status: 400 });

    const section = extractLayerSection(content, config.header, config.next);
    const layerStart = content.indexOf(config.header);
    if (layerStart < 0) return NextResponse.json({ error: "Layer not found" }, { status: 404 });

    const sectionStart = content.indexOf(section, layerStart);
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

      const beforeLines = lines.slice(0, i).join("\n");
      const blockStartInSection = beforeLines.length;
      const blockStartInContent = sectionStart + blockStartInSection;
      const blockEndInContent = blockStartInContent + block.length;

      const beforeBlock = content.slice(0, blockStartInContent);
      const afterBlock = content.slice(blockEndInContent);
      const updated = beforeBlock + newContent.trim() + afterBlock;
      await writeMasterFile(updated);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  } catch (error) {
    console.error("Update entry failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
