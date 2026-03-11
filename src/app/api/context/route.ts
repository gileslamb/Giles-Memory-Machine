import { NextResponse } from "next/server";
import { readMasterFileWithStats, writeMasterFile, setNextArchivePreview } from "@/lib/file-system";

export async function GET() {
  try {
    const { content, lastModified } = await readMasterFileWithStats();
    return NextResponse.json(
      { content, lastModified },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("Failed to read context:", error);
    return NextResponse.json(
      { error: "Failed to read AI_CONTEXT.md" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { content } = await request.json();
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }
    setNextArchivePreview(content);
    await writeMasterFile(content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to write context:", error);
    return NextResponse.json(
      { error: "Failed to write AI_CONTEXT.md" },
      { status: 500 }
    );
  }
}
