import { NextResponse } from "next/server";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";
import { findEntryBlock } from "@/lib/entry-edit";

function removeEntryBlock(content: string, layerName: string, entryName: string): string {
  const found = findEntryBlock(content, layerName, entryName);
  if (!found) return content;
  const before = content.slice(0, found.start);
  const after = content.slice(found.end);
  return before + after.replace(/\n{3,}/g, "\n\n");
}

function appendToArchived(content: string, block: string, layerName: string, entryName: string): string {
  const archivedHeader = "## ARCHIVED";
  const today = new Date().toISOString().slice(0, 10);
  const archivedBlock = `\n\n### ${layerName} — ${entryName}\n*Archived ${today}*\n\n${block}\n`;

  const idx = content.indexOf(archivedHeader);
  if (idx >= 0) {
    const insertPoint = idx + archivedHeader.length;
    return content.slice(0, insertPoint) + archivedBlock + content.slice(insertPoint);
  }
  return content.trimEnd() + `\n\n---\n\n${archivedHeader}${archivedBlock}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { layerName, entryName } = body as { layerName: string; entryName: string };
    if (!layerName || !entryName) {
      return NextResponse.json(
        { error: "layerName and entryName required" },
        { status: 400 }
      );
    }

    const content = await readMasterFile();
    const found = findEntryBlock(content, layerName, entryName);
    if (!found) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const block = content.slice(found.start, found.end);
    let newContent = removeEntryBlock(content, layerName, entryName);
    newContent = appendToArchived(newContent, block, layerName, entryName);

    await writeMasterFile(newContent);
    return NextResponse.json({ success: true, content: newContent });
  } catch (err) {
    console.error("Archive entry failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
