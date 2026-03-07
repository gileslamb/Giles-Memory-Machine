import { NextResponse } from "next/server";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";

export async function GET() {
  try {
    const content = await readMasterFile();
    return NextResponse.json({ content });
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
