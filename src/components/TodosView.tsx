"use client";

import { useState, useEffect, useCallback } from "react";
import type { ParsedTodo } from "@/lib/parse-todos";

const LAYER_COLORS: Record<string, string> = {
  PROJECTS: "#4af0c8",
  ADMIN: "#f0a84a",
  IDEAS: "#c84af0",
  "VISION / IDEAS": "#c84af0",
  LIFE: "#f04a7a",
};

const LAYER_ORDER = ["PROJECTS", "ADMIN", "IDEAS", "LIFE"];

function categoryToLayer(category: string): string {
  const parts = category.split(" > ");
  const first = (parts[0]?.trim() ?? "").toLowerCase();
  if (first === "projects") return "PROJECTS";
  if (first === "admin") return "ADMIN";
  if (first.startsWith("vision") || first === "ideas") return "IDEAS";
  if (first === "life") return "LIFE";
  return "PROJECTS";
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function formatDays(days: number, overdue?: boolean): string {
  if (overdue && days >= 7) return `${days} days overdue`;
  return `${days} days`;
}

interface TodosViewProps {
  onContentUpdated?: () => void;
}

export function TodosView({ onContentUpdated }: TodosViewProps) {
  const [todos, setTodos] = useState<ParsedTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneAck, setDoneAck] = useState(false);
  const [addingForLayer, setAddingForLayer] = useState<string | null>(null);
  const [newTodoText, setNewTodoText] = useState("");
  const [completedExpanded, setCompletedExpanded] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/context/todos?includeArchived=true");
      const data = await res.json();
      if (data.todos) setTodos(data.todos);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const openTodos = todos.filter((t) => t.status !== "done");
  const completedTodos = todos
    .filter((t) => t.status === "done")
    .sort((a, b) => (b.dateCompleted ?? "").localeCompare(a.dateCompleted ?? ""))
    .slice(0, 10);

  const grouped = LAYER_ORDER.reduce<Record<string, ParsedTodo[]>>((acc, layer) => {
    acc[layer] = openTodos.filter((t) => categoryToLayer(t.category) === layer);
    return acc;
  }, {});

  const handleToggle = async (todo: ParsedTodo) => {
    if (todo.status === "done") return;
    const updated = todos.map((t) =>
      t.id === todo.id ? { ...t, status: "done" as const, dateCompleted: new Date().toISOString().slice(0, 10) } : t
    );
    setTodos(updated);
    try {
      await fetch("/api/context/todos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: updated }),
      });
      setDoneAck(true);
      setTimeout(() => setDoneAck(false), 3000);
      onContentUpdated?.();
    } catch {
      setTodos(todos);
    }
  };

  const handleAddTodo = async (layer: string) => {
    const text = newTodoText.trim();
    if (!text) return;
    const categoryMap: Record<string, string> = {
      PROJECTS: "Projects > General",
      ADMIN: "Admin > General",
      IDEAS: "Vision / Ideas > General",
      "VISION / IDEAS": "Vision / Ideas > General",
      LIFE: "Life > General",
    };
    const category = categoryMap[layer] ?? "Projects > General";
    try {
      const res = await fetch("/api/context/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category }),
      });
      if (res.ok) {
        setNewTodoText("");
        setAddingForLayer(null);
        fetchTodos();
        onContentUpdated?.();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-[#a3a3a3] animate-pulse">
        Loading todos…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {doneAck && (
        <div
          className="text-sm text-[#4af0c8] animate-fade-in"
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          Done. Context updated.
        </div>
      )}

      <div className="space-y-6">
        {LAYER_ORDER.map((layer) => {
          const items = grouped[layer] ?? [];
          const color = LAYER_COLORS[layer] ?? "#737373";
          const isAdding = addingForLayer === layer;

          return (
            <div key={layer}>
              <div className="text-sm font-medium mb-2" style={{ color }}>
                {layer}
              </div>
              <div className="space-y-1">
                {items.map((todo) => {
                  const days = daysSince(todo.dateAdded);
                  const overdue = days >= 7;
                  const veryOverdue = days >= 14;
                  const area = todo.category.split(" > ")[1] ?? todo.category;
                  const textColor = overdue ? (veryOverdue ? "#f04a4a" : "#f0a84a") : "#a3a3a3";

                  return (
                    <label
                      key={todo.id}
                      className="flex items-start gap-2 py-1.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={todo.status === "done"}
                        onChange={() => handleToggle(todo)}
                        className="mt-1 rounded border-[#525252] bg-[#111111]"
                      />
                      <span
                        className={`text-sm ${todo.status === "done" ? "line-through opacity-50" : ""}`}
                        style={todo.status !== "done" ? { color: textColor } : {}}
                      >
                        {todo.text} · {area} · {formatDays(days, overdue)}
                      </span>
                    </label>
                  );
                })}
                {isAdding ? (
                  <div className="flex gap-2 py-1.5">
                    <input
                      type="text"
                      value={newTodoText}
                      onChange={(e) => setNewTodoText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddTodo(layer);
                        if (e.key === "Escape") {
                          setAddingForLayer(null);
                          setNewTodoText("");
                        }
                      }}
                      placeholder="New todo…"
                      className="flex-1 px-3 py-1.5 text-sm bg-[#111111] border rounded text-[#e8e8e8] placeholder-[#525252] focus:outline-none focus:ring-1"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingForLayer(layer)}
                    className="text-xs text-[#525252] hover:text-[#a3a3a3] py-1"
                  >
                    + Add todo
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {completedTodos.length > 0 && (
        <div className="border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            type="button"
            onClick={() => setCompletedExpanded(!completedExpanded)}
            className="text-xs text-[#525252] hover:text-[#a3a3a3]"
          >
            {completedExpanded ? "▼" : "▶"} Completed ({completedTodos.length})
          </button>
          {completedExpanded && (
            <div className="mt-2 space-y-1 opacity-70">
              {completedTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="text-sm line-through text-[#525252]"
                >
                  {todo.text} · {todo.dateCompleted ?? ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
