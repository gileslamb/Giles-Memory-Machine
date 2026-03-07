/**
 * Parse and serialize the ## CURRENT TODOS section in AI_CONTEXT.md.
 * Status: [ ] = todo, [~] = in_progress, [x] = done
 */

export type TodoStatus = "todo" | "in_progress" | "done";

export interface ParsedTodo {
  id: string;
  text: string;
  status: TodoStatus;
  dateAdded: string; // YYYY-MM-DD
  dateCompleted?: string; // for done
  category: string; // e.g. "Projects > organism"
  rawLine: string;
}

const STATUS_REGEX = /^-\s+\[([ x~])\]\s+/;
const DATE_PART_REGEX = /(added|completed|started)\s+(\d{4}-\d{2}-\d{2})/;

function statusFromChar(c: string): TodoStatus {
  if (c === "x") return "done";
  if (c === "~") return "in_progress";
  return "todo";
}

function charFromStatus(s: TodoStatus): string {
  if (s === "done") return "x";
  if (s === "in_progress") return "~";
  return " ";
}

export function parseTodosSection(
  content: string,
  options?: { includeArchivedDone?: boolean }
): ParsedTodo[] {
  const match = content.match(/## CURRENT TODOS\n([\s\S]*?)(?=\n## |$)/);
  const block = match ? match[1].trim() : "";
  const lines = block.split("\n").filter((l) => l.trim());
  const todos: ParsedTodo[] = [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const statusMatch = line.match(STATUS_REGEX);
    if (!statusMatch) continue;

    const statusChar = statusMatch[1];
    const rest = line.slice(statusMatch[0].length);
    const parts = rest.split(" · ");
    if (parts.length < 3) continue;

    const category = parts.pop()!.trim();
    const datePart = parts.pop()!.trim();
    const text = parts.join(" · ").trim();

    const dateMatch = datePart.match(DATE_PART_REGEX);
    if (!dateMatch) continue;

    const [, dateType, dateStr] = dateMatch;
    const status = statusFromChar(statusChar);
    const dateAdded = dateType === "added" || dateType === "started" ? dateStr : dateStr;
    const dateCompleted = dateType === "completed" ? dateStr : undefined;

    // Done column: only show last 30 days unless includeArchivedDone
    if (
      !options?.includeArchivedDone &&
      status === "done" &&
      dateCompleted &&
      dateCompleted < thirtyDaysAgo
    )
      continue;

    todos.push({
      id: `todo-${i}-${text.slice(0, 30).replace(/\s/g, "-")}`,
      text,
      status,
      dateAdded,
      dateCompleted,
      category,
      rawLine: line,
    });
  }

  return todos;
}

export function serializeTodos(todos: ParsedTodo[]): string {
  const today = new Date().toISOString().slice(0, 10);
  return todos
    .map((t) => {
      const char = charFromStatus(t.status);
      const datePart =
        t.status === "done"
          ? `completed ${t.dateCompleted ?? today}`
          : t.status === "in_progress"
            ? `started ${t.dateAdded}`
            : `added ${t.dateAdded}`;
      return `- [${char}] ${t.text} · ${datePart} · ${t.category}`;
    })
    .join("\n");
}

export function buildTodosSection(todoLines: string): string {
  return `## CURRENT TODOS\n${todoLines}\n`;
}
