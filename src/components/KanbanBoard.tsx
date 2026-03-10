"use client";

import { useState, useEffect, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { apiUrl } from "@/lib/api";
import {
  parseTodosSection,
  serializeTodos,
  type ParsedTodo,
  type TodoStatus,
} from "@/lib/parse-todos";

const COLUMNS: { id: TodoStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

const LAYER_COLORS: Record<string, string> = {
  PROJECTS: "#c8f04a",
  ADMIN: "#f0c84a",
  "VISION / IDEAS": "#f0844a",
};

function getCategoryColor(category: string): string {
  const upper = category.toUpperCase();
  if (upper.startsWith("PROJECTS")) return LAYER_COLORS.PROJECTS ?? "#c8f04a";
  if (upper.startsWith("ADMIN")) return LAYER_COLORS.ADMIN ?? "#f0c84a";
  if (upper.startsWith("VISION")) return LAYER_COLORS["VISION / IDEAS"] ?? "#f0844a";
  return "#737373";
}

function getStalenessBorder(dateStr: string, status: TodoStatus): string {
  if (status === "done") return "border-border";
  const date = new Date(dateStr);
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days >= 14) return "border-red-500/60";
  if (days >= 7) return "border-amber-500/60";
  return "border-border";
}

export function KanbanBoard() {
  const [todos, setTodos] = useState<ParsedTodo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Projects > General");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/context/todos"));
      const { todos: parsed } = await res.json();
      setTodos(parsed ?? []);
    } catch {
      setTodos([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const saveTodos = async (updated: ParsedTodo[]) => {
    setIsSaving(true);
    try {
      const res = await fetch(apiUrl("/api/context/todos"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      const parsed = parseTodosSection(data.content ?? "", { includeArchivedDone: false });
      setTodos(parsed);
    } catch {
      // Could show toast
    } finally {
      setIsSaving(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index)
      return;

    const sourceCol = source.droppableId as TodoStatus;
    const destCol = destination.droppableId as TodoStatus;
    const byCol = COLUMNS.reduce(
      (acc, c) => ({ ...acc, [c.id]: todos.filter((t) => t.status === c.id) }),
      {} as Record<TodoStatus, ParsedTodo[]>
    );

    const [moved] = byCol[sourceCol].splice(source.index, 1);
    if (!moved) return;

    const today = new Date().toISOString().slice(0, 10);
    const updated: ParsedTodo = {
      ...moved,
      status: destCol,
      dateCompleted: destCol === "done" ? today : undefined,
    };

    byCol[destCol].splice(destination.index, 0, updated);
    const newTodos = COLUMNS.flatMap((c) => byCol[c.id]);
    setTodos(newTodos);
    saveTodos(newTodos);
  };

  const addTask = async () => {
    if (!newTaskText.trim()) return;
    try {
      const res = await fetch(apiUrl("/api/context/todos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTaskText.trim(), category: newTaskCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      fetchTodos();
      setNewTaskText("");
    } catch {
      // Could show toast
    }
  };

  const updateTaskText = async (id: string, text: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, text } : t));
    setTodos(updated);
    setEditingId(null);
    saveTodos(updated);
  };

  const toggleDone = (todo: ParsedTodo) => {
    const newStatus: TodoStatus = todo.status === "done" ? "todo" : "done";
    const today = new Date().toISOString().slice(0, 10);
    const updatedTodo = {
      ...todo,
      status: newStatus,
      dateCompleted: newStatus === "done" ? today : undefined,
    };
    const updated = todos.map((t) => (t.id === todo.id ? updatedTodo : t));
    setTodos(updated);
    saveTodos(updated);
  };

  const todosByCol = COLUMNS.reduce(
    (acc, c) => ({ ...acc, [c.id]: todos.filter((t) => t.status === c.id) }),
    {} as Record<TodoStatus, ParsedTodo[]>
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-muted text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-ink-muted">Kanban board</h2>
        <button
          onClick={fetchTodos}
          className="text-xs text-ink-faint hover:text-ink-muted"
        >
          Refresh
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-4 min-h-0 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex-shrink-0 w-72 flex flex-col rounded-lg border border-border bg-surface-muted/50"
                >
                  <div className="p-3 border-b border-border font-medium text-sm text-ink">
                    {col.title}
                  </div>
                  <div className="flex-1 p-2 space-y-2 min-h-[120px] overflow-y-auto">
                    {col.id === "todo" && (
                      <div className="mb-2 space-y-1">
                        <input
                          type="text"
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTask()}
                          placeholder="Add task…"
                          className="w-full px-3 py-2 rounded text-sm bg-surface border border-border text-ink placeholder-ink-faint focus:outline-none focus:ring-1 focus:ring-ink-faint"
                        />
                        <input
                          type="text"
                          value={newTaskCategory}
                          onChange={(e) => setNewTaskCategory(e.target.value)}
                          placeholder="Category"
                          className="w-full px-3 py-1.5 rounded text-xs bg-surface border border-border text-ink placeholder-ink-faint focus:outline-none"
                        />
                        <button
                          onClick={addTask}
                          disabled={!newTaskText.trim() || isSaving}
                          className="w-full py-1.5 text-xs rounded bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    {todosByCol[col.id].map((todo, idx) => (
                      <Draggable key={todo.id} draggableId={todo.id} index={idx}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 rounded-lg border bg-surface-elevated ${getStalenessBorder(
                              todo.dateAdded,
                              todo.status
                            )} ${snapshot.isDragging ? "opacity-90 shadow-lg" : ""}`}
                          >
                            {editingId === todo.id ? (
                              <div onClick={(e) => e.stopPropagation()}>
                                <input
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  onBlur={() => {
                                    if (editText.trim() && editText !== todo.text) {
                                      updateTaskText(todo.id, editText.trim());
                                    } else {
                                      setEditingId(null);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    e.stopPropagation();
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      if (editText.trim()) updateTaskText(todo.id, editText.trim());
                                    }
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  autoFocus
                                  className="w-full px-2 py-1.5 text-sm bg-surface border border-ink-faint rounded focus:outline-none focus:ring-1 focus:ring-ink-faint"
                                />
                                <div className="mt-1 flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (editText.trim()) updateTaskText(todo.id, editText.trim());
                                    }}
                                    className="text-xs px-2 py-0.5 rounded bg-ink text-surface"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(null);
                                    }}
                                    className="text-xs px-2 py-0.5 rounded border border-border"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2">
                                  <p
                                    className="text-sm text-ink flex-1 cursor-pointer hover:text-ink-muted min-w-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(todo.id);
                                      setEditText(todo.text);
                                    }}
                                    title="Click to edit"
                                  >
                                    {todo.text}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(todo.id);
                                      setEditText(todo.text);
                                    }}
                                    className="shrink-0 p-0.5 rounded hover:bg-surface-muted text-ink-faint hover:text-ink"
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                  {col.id !== "done" ? (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleDone(todo); }}
                                      className="shrink-0 w-5 h-5 rounded border border-border flex items-center justify-center hover:bg-surface-muted text-xs"
                                    >
                                      ✓
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); toggleDone(todo); }}
                                      className="shrink-0 text-ink-faint hover:text-ink text-xs"
                                      title="Mark not done"
                                    >
                                      ↶
                                    </button>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  <span
                                    className="px-1.5 py-0.5 rounded text-xs"
                                    style={{
                                      backgroundColor: `${getCategoryColor(todo.category)}20`,
                                      color: getCategoryColor(todo.category),
                                      borderColor: `${getCategoryColor(todo.category)}40`,
                                    }}
                                  >
                                    {todo.category}
                                  </span>
                                  <span className="text-xs text-ink-faint">
                                    {todo.dateAdded}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {isSaving && (
        <p className="text-xs text-ink-faint mt-2">Saving…</p>
      )}
    </div>
  );
}
