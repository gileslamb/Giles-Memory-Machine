import { NextResponse } from "next/server";
import { readMasterFile, writeMasterFile } from "@/lib/file-system";
import {
  parseTodosSection,
  serializeTodos,
  type ParsedTodo,
} from "@/lib/parse-todos";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";
    const content = await readMasterFile();
    const todos = parseTodosSection(content, { includeArchivedDone: includeArchived });
    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Failed to read todos:", error);
    return NextResponse.json(
      { error: "Failed to read todos" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { todos: updatedTodos } = body as { todos: ParsedTodo[] };

    if (!Array.isArray(updatedTodos)) {
      return NextResponse.json(
        { error: "todos array is required" },
        { status: 400 }
      );
    }

    const content = await readMasterFile();
    const allTodos = parseTodosSection(content, { includeArchivedDone: true });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const archivedDone = allTodos.filter(
      (t) =>
        t.status === "done" &&
        t.dateCompleted &&
        t.dateCompleted < thirtyDaysAgo
    );

    const today = new Date().toISOString().slice(0, 10);

    // Update status dates when status changes
    const withDates = updatedTodos.map((t) => {
      if (t.status === "done" && !t.dateCompleted) {
        return { ...t, dateCompleted: today };
      }
      if (t.status === "in_progress" && t.dateAdded === "") {
        return { ...t, dateAdded: today };
      }
      return t;
    });

    // Append archived done items so we don't lose them
    const merged = [...withDates, ...archivedDone];
    const serialized = serializeTodos(merged);

    const todosHeaderIdx = content.indexOf("## CURRENT TODOS");
    let newContent: string;
    if (todosHeaderIdx >= 0) {
      const afterTodosHeader = content.slice(todosHeaderIdx);
      const nextH2 = afterTodosHeader.indexOf("\n## ", 1);
      const sectionEnd = nextH2 >= 0 ? todosHeaderIdx + nextH2 : content.length;
      const before = content.slice(0, todosHeaderIdx);
      const rest = content.slice(sectionEnd);
      newContent = before + "## CURRENT TODOS\n" + serialized + "\n" + rest;
    } else {
      const todosSection = `\n\n---\n\n## CURRENT TODOS\n${serialized}\n`;
      newContent = content.trimEnd() + todosSection;
    }

    await writeMasterFile(newContent);
    return NextResponse.json({ success: true, content: newContent });
  } catch (error) {
    console.error("Failed to update todos:", error);
    return NextResponse.json(
      { error: "Failed to update todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, category } = body as { text: string; category: string };

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    const content = await readMasterFile();
    const todos = parseTodosSection(content);
    const today = new Date().toISOString().slice(0, 10);

    const newTodo: ParsedTodo = {
      id: `todo-new-${Date.now()}`,
      text: text.trim(),
      status: "todo",
      dateAdded: today,
      category: category || "Projects > General",
      rawLine: "",
    };

    const updatedTodos = [newTodo, ...todos];
    const serialized = serializeTodos(updatedTodos);

    const todosHeaderIdx = content.indexOf("## CURRENT TODOS");
    let newContent: string;
    if (todosHeaderIdx >= 0) {
      const afterTodosHeader = content.slice(todosHeaderIdx);
      const nextH2 = afterTodosHeader.indexOf("\n## ", 1);
      const sectionEnd = nextH2 >= 0 ? todosHeaderIdx + nextH2 : content.length;
      const before = content.slice(0, todosHeaderIdx);
      const rest = content.slice(sectionEnd);
      newContent = before + "## CURRENT TODOS\n" + serialized + "\n" + rest;
    } else {
      const todosSection = `\n\n---\n\n## CURRENT TODOS\n${serialized}\n`;
      newContent = content.trimEnd() + todosSection;
    }

    await writeMasterFile(newContent);
    return NextResponse.json({ success: true, content: newContent });
  } catch (error) {
    console.error("Failed to add todo:", error);
    return NextResponse.json(
      { error: "Failed to add todo" },
      { status: 500 }
    );
  }
}
