import { NextResponse } from "next/server";
import {
  getDataDirectory,
  setDataDirectory,
  getAIProvider,
  setAIProvider,
} from "@/lib/file-system";

export async function GET() {
  try {
    const [dataDirectory, aiProvider] = await Promise.all([
      getDataDirectory(),
      getAIProvider(),
    ]);
    return NextResponse.json({ dataDirectory, aiProvider: aiProvider as string });
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
    const body = await request.json();
    if (body.dataDirectory !== undefined) {
      if (typeof body.dataDirectory !== "string" || !body.dataDirectory.trim()) {
        return NextResponse.json(
          { error: "dataDirectory must be a non-empty string" },
          { status: 400 }
        );
      }
      await setDataDirectory(body.dataDirectory.trim());
    }
    if (body.aiProvider !== undefined) {
      if (!["auto", "light_local", "full_local", "claude"].includes(body.aiProvider)) {
        return NextResponse.json(
          { error: "aiProvider must be auto, light_local, full_local, or claude" },
          { status: 400 }
        );
      }
      await setAIProvider(body.aiProvider);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
