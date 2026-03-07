import { NextResponse } from "next/server";
import {
  readMasterFile,
  appendToCheckins,
  appendTodosToContext,
} from "@/lib/file-system";

export async function POST(request: Request) {
  try {
    const { contextUpdates, todos } = await request.json();

    if (contextUpdates && typeof contextUpdates === "string") {
      const base = new URL(request.url).origin;
      const mergeRes = await fetch(`${base}/api/context/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedContent: contextUpdates }),
      });
      if (!mergeRes.ok) {
        const err = await mergeRes.text();
        return NextResponse.json(
          { error: "Merge failed: " + err },
          { status: 500 }
        );
      }
    }

    if (Array.isArray(todos) && todos.length > 0) {
      await appendTodosToContext(
        todos.map((t: { text?: string; status?: string; category?: string }) => ({
          text: t.text || "",
          status: t.status === "done" ? "done" : "open",
          category: t.category || "General",
        }))
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Commit failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Commit failed",
      },
      { status: 500 }
    );
  }
}
