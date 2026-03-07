import { NextResponse } from "next/server";
import {
  getDataDirectory,
  setDataDirectory,
} from "@/lib/file-system";

export async function GET() {
  try {
    const dataDirectory = await getDataDirectory();
    return NextResponse.json({ dataDirectory });
  } catch (error) {
    console.error("Failed to get settings:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { dataDirectory } = await request.json();
    if (typeof dataDirectory !== "string" || !dataDirectory.trim()) {
      return NextResponse.json(
        { error: "dataDirectory must be a non-empty string" },
        { status: 400 }
      );
    }
    await setDataDirectory(dataDirectory.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
