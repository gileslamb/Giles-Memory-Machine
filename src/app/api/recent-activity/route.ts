import { NextResponse } from "next/server";
import { getRecentActivity } from "@/lib/recent-activity";

export async function GET() {
  try {
    const items = await getRecentActivity();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Recent activity failed:", error);
    return NextResponse.json({ items: [] });
  }
}
