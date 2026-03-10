import { NextResponse } from "next/server";
import { readPriorityOverrides, writePriorityOverrides } from "@/lib/file-system";

export async function GET() {
  try {
    const overrides = await readPriorityOverrides();
    return NextResponse.json({ overrides });
  } catch (err) {
    console.error("Read overrides failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const existing = (await readPriorityOverrides()) ?? { projectNames: [], inactiveProjectNames: [] };
    const overrides = {
      projectNames: Array.isArray(body.projectNames)
        ? body.projectNames.filter((n: unknown) => typeof n === "string")
        : existing.projectNames,
      inactiveProjectNames: Array.isArray(body.inactiveProjectNames)
        ? body.inactiveProjectNames.filter((n: unknown) => typeof n === "string")
        : existing.inactiveProjectNames ?? [],
    };
    await writePriorityOverrides(overrides);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Write overrides failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
