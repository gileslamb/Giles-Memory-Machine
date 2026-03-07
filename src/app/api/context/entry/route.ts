import { NextResponse } from "next/server";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";
import { replaceEntryBlock, removeEntryFromContent } from "@/lib/entry-edit";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, layer, entryName, newContent } = body;

    if (
      typeof action !== "string" ||
      typeof layer !== "string" ||
      typeof entryName !== "string"
    ) {
      return NextResponse.json(
        { error: "action, layer, and entryName are required" },
        { status: 400 }
      );
    }

    const content = await readMasterFile();

    if (action === "update") {
      if (typeof newContent !== "string" || !newContent.trim()) {
        return NextResponse.json(
          { error: "newContent is required for update" },
          { status: 400 }
        );
      }
      const updated = replaceEntryBlock(content, layer, entryName, newContent.trim());
      await writeMasterFile(updated);
      return NextResponse.json({ success: true, content: updated });
    }

    if (action === "remove") {
      const updated = removeEntryFromContent(content, layer, entryName);
      await writeMasterFile(updated);
      return NextResponse.json({ success: true, content: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Entry update failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update entry" },
      { status: 500 }
    );
  }
}
