"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { CoachZone } from "@/components/CoachZone";
import { EntryDetailView } from "@/components/EntryDetailView";
import { SectionView } from "@/components/SectionView";
import { ChatBox } from "@/components/ChatBox";
import { AIStatusIndicator } from "@/components/AIStatusIndicator";
import { PastePanel } from "@/components/PastePanel";
import { TodosView } from "@/components/TodosView";
import { StaleAlert } from "@/components/StaleAlert";
import { AdvisorChatPanel } from "@/components/AdvisorChatPanel";
import { apiUrl } from "@/lib/api";
import { parseContextMarkdown, formatRelativeDate } from "@/lib/parse-context";
import type { ParsedEntry, ParsedLayer } from "@/lib/parse-context";
import type { ParsedTodo } from "@/lib/parse-todos";

type MainViewState = "chat" | "entry" | "section" | "todos";

const HOME_TODOS_LIMIT = 10;

export default function Home() {
  const [content, setContent] = useState<string>("");
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [settingsInput, setSettingsInput] = useState("");
  const [aiProvider, setAIProvider] = useState<"auto" | "light_local" | "full_local" | "claude">("auto");
  const [claudeUsage, setClaudeUsage] = useState<{
    dailyInputTokens: number;
    dailyOutputTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    dailyUsd: number;
    totalUsd: number;
  } | null>(null);
  const [claudeUsageLoading, setClaudeUsageLoading] = useState(false);
  const [activeView, setActiveView] = useState<MainViewState>("chat");
  const [activeEntry, setActiveEntry] = useState<{ layer: string; name: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [todos, setTodos] = useState<ParsedTodo[]>([]);
  const [dismissedStaleEntries, setDismissedStaleEntries] = useState<Set<string>>(new Set());
  const [newTodoText, setNewTodoText] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [isProcessingInbox, setIsProcessingInbox] = useState(false);
  const [activityRefreshTrigger, setActivityRefreshTrigger] = useState(0);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTodoText, setEditTodoText] = useState("");

  const parsed = useMemo(() => {
    try {
      return parseContextMarkdown(content ?? "");
    } catch {
      return null;
    }
  }, [content]);

  const selectedEntry = useMemo((): ParsedEntry | null => {
    if (!activeEntry || !parsed) return null;
    const layer = parsed.layers.find((l) => l.name === activeEntry.layer);
    return layer?.entries.find((e) => e.name === activeEntry.name) ?? null;
  }, [activeEntry, parsed]);

  const selectedLayer = useMemo((): ParsedLayer | null => {
    if (!parsed) return null;
    if (activeEntry) return parsed.layers.find((l) => l.name === activeEntry.layer) ?? null;
    if (activeSection) return parsed.layers.find((l) => l.name === activeSection) ?? null;
    return null;
  }, [parsed, activeEntry, activeSection]);

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/context"), { cache: "no-store" });
      if (!res.ok) throw new Error("Server error");
      const { content: c, lastModified: lm } = await res.json();
      setContent(c ?? "");
      setLastModified(lm ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(
        msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")
          ? "Can't reach server. Check the terminal for the port (often 3001 if 3000 is busy) and open that URL."
          : msg
      );
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/context/todos?includeArchived=true"));
      const data = await res.json();
      if (data.todos) setTodos(data.todos);
    } catch {
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Bootstrap inbox watcher on load (starts processing of MEMORY_INBOX files)
  useEffect(() => {
    fetch(apiUrl("/api/inbox-status"), { cache: "no-store" }).catch(() => {});
  }, []);

  const todosContext = useMemo(() => {
    if (activeView !== "todos") return null;
    const open = todos.filter((t) => t.status !== "done");
    const overdue = open.filter((t) => {
      const days = Math.floor((Date.now() - new Date(t.dateAdded).getTime()) / (24 * 60 * 60 * 1000));
      return days >= 7;
    });
    const firstOverdue = overdue[0]?.text ?? null;
    return {
      openCount: open.length,
      overdueCount: overdue.length,
      overdueNames: overdue.map((t) => t.text),
      firstOverdue,
    };
  }, [activeView, todos]);

  useEffect(() => {
    if (showSettings) {
      fetch(apiUrl("/api/settings"))
        .then((r) => r.json())
        .then((d) => {
          setSettingsInput(d.dataDirectory ?? "");
          setAIProvider((d.aiProvider === "local" ? "full_local" : d.aiProvider) ?? "auto");
        })
        .catch(() => {});
      setClaudeUsageLoading(true);
      fetch(apiUrl("/api/claude-usage"))
        .then((r) => r.json())
        .then((d) => setClaudeUsage(d))
        .catch(() => setClaudeUsage(null))
        .finally(() => setClaudeUsageLoading(false));
    }
  }, [showSettings]);

  const handleSaveSettings = async () => {
    try {
      const body: { dataDirectory?: string; aiProvider?: string } = { aiProvider };
      if (settingsInput.trim()) body.dataDirectory = settingsInput.trim();
      const res = await fetch(apiUrl("/api/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      setShowSettings(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setError(null);
    } catch {
      setError("Copy failed");
    }
  };

  const handleChatClick = () => {
    setActiveView("chat");
    setActiveEntry(null);
    setActiveSection(null);
  };

  const handleTodosClick = () => {
    setActiveView("todos");
    setActiveEntry(null);
    setActiveSection(null);
  };

  const handleEntryClick = (layer: string, name: string) => {
    setActiveView("entry");
    setActiveEntry({ layer, name });
    setActiveSection(null);
  };

  const handleSectionClick = (layer: string) => {
    setActiveView("section");
    setActiveEntry(null);
    setActiveSection(layer);
  };

  const handleAddTodo = useCallback(async () => {
    const text = newTodoText.trim();
    if (!text || isAddingTodo) return;
    setIsAddingTodo(true);
    try {
      const res = await fetch(apiUrl("/api/context/todos"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, category: "Projects > General" }),
      });
      if (res.ok) {
        setNewTodoText("");
        fetchTodos();
        fetchContent();
      }
    } catch {
      // Could show toast
    } finally {
      setIsAddingTodo(false);
    }
  }, [newTodoText, isAddingTodo, fetchTodos, fetchContent]);

  const handleTodoToggle = useCallback(
    async (todo: ParsedTodo) => {
      const newStatus = todo.status === "done" ? "todo" : "done";
      const today = new Date().toISOString().slice(0, 10);
      const updated = todos.map((t) =>
        t.id === todo.id
          ? {
              ...t,
              status: newStatus as ParsedTodo["status"],
              dateCompleted: newStatus === "done" ? today : undefined,
            }
          : t
      );
      setTodos(updated);
      if (newStatus === "done") {
        setCompletingIds((prev) => new Set(prev).add(todo.id));
        setTimeout(() => setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(todo.id);
          return next;
        }), 1500);
      }
      try {
        const res = await fetch(apiUrl("/api/context/todos"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todos: updated }),
        });
        if (res.ok) {
          fetchTodos();
          fetchContent();
        }
      } catch {
        setTodos(todos);
      }
    },
    [todos, fetchTodos, fetchContent]
  );

  const handleTodoEdit = useCallback(
    async (todo: ParsedTodo, newText: string) => {
      setEditingTodoId(null);
      const trimmed = newText.trim();
      if (!trimmed || trimmed === todo.text) return;
      const updated = todos.map((t) =>
        t.id === todo.id ? { ...t, text: trimmed } : t
      );
      setTodos(updated);
      try {
        const res = await fetch(apiUrl("/api/context/todos"), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todos: updated }),
        });
        if (res.ok) {
          fetchTodos();
          fetchContent();
        }
      } catch {
        setTodos(todos);
      }
    },
    [todos, fetchTodos, fetchContent]
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Left panel — fixed */}
      <LeftPanel
        parsed={parsed}
        activeView={activeView}
        activeEntry={activeEntry}
        activeSection={activeSection}
        onChatClick={handleChatClick}
        onTodosClick={handleTodosClick}
        onEntryClick={handleEntryClick}
        onSectionClick={handleSectionClick}
        activityRefreshTrigger={activityRefreshTrigger}
      />

      {/* Main area */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Slim header */}
        <header
          className="shrink-0 px-6 py-6 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-6 shrink-0">
            <img
              src="/logo.png?v=2"
              alt="Giles Memory Machine"
              style={{ height: 200, width: "auto", flexShrink: 0 }}
              className="object-contain"
            />
            <h1 className="text-3xl font-bold tracking-tight text-[#e8e8e8] shrink-0">
              Giles Memory Machine
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {(lastModified || parsed?.globalLastUpdated) != null && (
              <span className="text-xs text-[#737373]">
                Last updated {formatRelativeDate(lastModified ? new Date(lastModified) : parsed!.globalLastUpdated)}
              </span>
            )}
            <AIStatusIndicator />
            <button onClick={handleCopy} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Copy
            </button>
            <button
              onClick={() => { setError(null); fetchContent(); }}
              className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]"
            >
              Refresh
            </button>
            <button onClick={() => setShowPaste(true)} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Paste
            </button>
            <button
              onClick={async () => {
                if (isProcessingInbox) return;
                setIsProcessingInbox(true);
                setError(null);
                try {
                  const res = await fetch(apiUrl("/api/inbox-process-now"), { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    fetchContent();
                    fetchTodos();
                    setActivityRefreshTrigger((t) => t + 1);
                    if (data.errors?.length) {
                      setError(data.errors.join("; "));
                    }
                  } else {
                    setError(data.error ?? "Failed to process inbox");
                  }
                } catch {
                  setError("Failed to process inbox");
                } finally {
                  setIsProcessingInbox(false);
                }
              }}
              disabled={isProcessingInbox}
              className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8] disabled:opacity-50"
            >
              {isProcessingInbox ? "Processing…" : "Process inbox now"}
            </button>
            <button onClick={() => setShowSettings(true)} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Settings
            </button>
          </div>
        </header>

        {/* Chat input — first thing visible on chat view */}
        {activeView === "chat" && (
          <div className="shrink-0 w-full" style={{ backgroundColor: "#0a0a0a" }}>
            <ChatBox rawContent={content} onContentUpdated={(c) => { setContent(c); fetchContent(); }} />
          </div>
        )}

        {/* Todos — below chat */}
        {activeView === "chat" && (
          <div className="shrink-0 border-b py-4 px-6" style={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.06)" }}>
            <h3 className="mb-3 font-medium uppercase" style={{ color: "#666666", letterSpacing: "0.1em", fontSize: "0.75rem" }}>
              Todos
            </h3>
            <div className="flex flex-col gap-2 mb-3">
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const open = todos.filter(
                  (t) => t.status !== "done" || (t.status === "done" && completingIds.has(t.id))
                );
                const recentlyComplete = todos.filter(
                  (t) =>
                    t.status === "done" &&
                    t.dateCompleted === today &&
                    !completingIds.has(t.id)
                );
                if (open.length === 0 && recentlyComplete.length === 0) {
                  return <p className="text-sm text-[#525252]">No todos yet. Add one below.</p>;
                }
                const sorted = [...open]
                  .sort((a, b) => {
                    const daysA = Math.floor((Date.now() - new Date(a.dateAdded).getTime()) / (24 * 60 * 60 * 1000));
                    const daysB = Math.floor((Date.now() - new Date(b.dateAdded).getTime()) / (24 * 60 * 60 * 1000));
                    if (daysA >= 7 && daysB < 7) return -1;
                    if (daysA < 7 && daysB >= 7) return 1;
                    if (daysA >= 7 && daysB >= 7) return daysA - daysB;
                    return daysB - daysA;
                  })
                  .slice(0, HOME_TODOS_LIMIT);
                return (
                  <>
                    {sorted.map((t) => {
                      const isChecked = t.status === "done" || completingIds.has(t.id);
                      const isEditing = editingTodoId === t.id;
                      return (
                        <div key={t.id} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleTodoToggle(t)}
                            className="shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-sm border cursor-pointer hover:border-[#525252] transition-colors"
                            style={{
                              borderColor: "#333333",
                              backgroundColor: isChecked ? "#4af0c8" : "transparent",
                            }}
                          >
                            {isChecked ? <span style={{ color: "#0a0a0a", fontSize: 10 }}>✓</span> : null}
                          </button>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editTodoText}
                              onChange={(e) => setEditTodoText(e.target.value)}
                              onBlur={() => handleTodoEdit(t, editTodoText)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleTodoEdit(t, editTodoText);
                                if (e.key === "Escape") {
                                  setEditingTodoId(null);
                                  setEditTodoText("");
                                }
                              }}
                              autoFocus
                              className="flex-1 min-w-0 px-2 py-1 text-sm bg-[#111111] border rounded text-[#e8e8e8] focus:outline-none focus:ring-1"
                              style={{ borderColor: "rgba(255,255,255,0.2)" }}
                            />
                          ) : (
                            <span
                              onClick={() => {
                                setEditingTodoId(t.id);
                                setEditTodoText(t.text);
                              }}
                              style={{
                                color: isChecked ? "#737373" : "#e8e8e8",
                                fontSize: 14,
                                textDecoration: isChecked ? "line-through" : "none",
                                cursor: "pointer",
                              }}
                              className="hover:underline"
                            >
                              {t.text}
                            </span>
                          )}
                          {t.category && !isEditing && (
                            <span style={{ color: "#737373", fontSize: 12 }}>· {t.category}</span>
                          )}
                        </div>
                      );
                    })}
                    {recentlyComplete.length > 0 && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                        <div className="text-xs text-[#525252] mb-2 uppercase tracking-wide">Recently complete</div>
                        {recentlyComplete.map((t) => {
                          const isEditing = editingTodoId === t.id;
                          return (
                            <div key={t.id} className="flex items-center gap-3 py-1">
                              <button
                                type="button"
                                onClick={() => handleTodoToggle(t)}
                                className="shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-sm border cursor-pointer hover:border-[#525252]"
                                style={{ borderColor: "#333333", backgroundColor: "#4af0c8" }}
                              >
                                <span style={{ color: "#0a0a0a", fontSize: 10 }}>✓</span>
                              </button>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTodoText}
                                  onChange={(e) => setEditTodoText(e.target.value)}
                                  onBlur={() => handleTodoEdit(t, editTodoText)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleTodoEdit(t, editTodoText);
                                    if (e.key === "Escape") {
                                      setEditingTodoId(null);
                                      setEditTodoText("");
                                    }
                                  }}
                                  autoFocus
                                  className="flex-1 min-w-0 px-2 py-1 text-sm bg-[#111111] border rounded text-[#e8e8e8] focus:outline-none focus:ring-1"
                                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                                />
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingTodoId(t.id);
                                    setEditTodoText(t.text);
                                  }}
                                  style={{ color: "#737373", fontSize: 14, textDecoration: "line-through", cursor: "pointer" }}
                                  className="hover:underline"
                                >
                                  {t.text}
                                </span>
                              )}
                              {t.category && !isEditing && (
                                <span style={{ color: "#525252", fontSize: 12 }}>· {t.category}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder="New todo…"
                className="flex-1 min-w-0 px-3 py-2 rounded bg-[#111111] border text-[#e8e8e8] placeholder-[#525252] text-sm"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
              <button
                type="button"
                onClick={handleAddTodo}
                disabled={!newTodoText.trim() || isAddingTodo}
                className="text-xs px-3 py-2 rounded bg-[#262626] text-[#e8e8e8] hover:bg-[#333333] disabled:opacity-50"
              >
                + Add todo
              </button>
            </div>
            {todos.filter((t) => t.status !== "done").length > HOME_TODOS_LIMIT && (
              <button type="button" onClick={handleTodosClick} className="mt-2 text-xs text-[#666666] hover:text-[#a3a3a3]">
                View all {todos.filter((t) => t.status !== "done").length} todos →
              </button>
            )}
          </div>
        )}

        {/* Coach Notes — below todos on chat view */}
        {activeView === "chat" && (
          <div className="shrink-0">
            <CoachZone
              hasContent={!!content?.trim()}
              contentVersion={lastModified ? new Date(lastModified).getTime() : content.length}
              compact={false}
              entryContext={null}
              todosContext={null}
            />
          </div>
        )}

        {/* Entry/ Todos context coach when viewing entry or todos */}
        {(activeView === "entry" || activeView === "todos") && (
          <CoachZone
            hasContent={!!content?.trim()}
            contentVersion={content.length}
            compact={true}
            entryContext={
              activeView === "entry" && activeEntry
                ? { layer: activeEntry.layer, entryName: activeEntry.name }
                : null
            }
            todosContext={todosContext}
          />
        )}

        {/* Main content — Stale alert, scrollable + Advisor chat when on chat view */}
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 overflow-auto min-h-0 py-6" style={{ backgroundColor: "#0a0a0a", paddingLeft: 48, paddingRight: 48 }}>
            {activeView === "chat" && (
              <div className="max-w-2xl flex flex-col" style={{ gap: 24 }}>
                {/* One stale alert at a time */}
                <StaleAlert
                  parsed={parsed}
                  openTodos={todos.filter((t) => t.status !== "done")}
                  dismissedEntryNames={dismissedStaleEntries}
                  onDismiss={(name) => setDismissedStaleEntries((prev) => new Set(prev).add(name))}
                  onArchive={() => { fetchContent(); fetchTodos(); }}
                />
              </div>
            )}
          {activeView === "entry" && selectedEntry && selectedLayer && (
            <EntryDetailView
              entry={selectedEntry}
              layer={selectedLayer}
              parsed={parsed}
              onEntryClick={handleEntryClick}
              onContentUpdated={fetchContent}
            />
          )}
          {activeView === "section" && selectedLayer && (
            <SectionView
              layer={selectedLayer}
              onEntryClick={(e) => handleEntryClick(selectedLayer.name, e.name)}
            />
          )}
          {activeView === "todos" && (
            <TodosView
              onContentUpdated={() => { fetchTodos(); fetchContent(); }}
            />
          )}
          </div>
          {activeView === "chat" && (
            <div className="shrink-0 py-6 pr-6 pl-2" style={{ backgroundColor: "#0a0a0a", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
              <AdvisorChatPanel rawContent={content} />
            </div>
          )}
        </div>
      </main>

      {/* Paste modal */}
      {showPaste && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-lg p-6"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#e8e8e8]">Paste or upload</h3>
              <button onClick={() => setShowPaste(false)} className="text-[#a3a3a3] hover:text-[#e8e8e8]">
                ✕
              </button>
            </div>
            <PastePanel
              onContentUpdated={(c) => { setContent(c); fetchContent(); setShowPaste(false); }}
              onError={(msg) => setError(typeof msg === "string" || msg === null ? msg : "An error occurred")}
            />
          </div>
        </div>
      )}

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className="p-6 w-full max-w-md rounded-lg my-auto"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <h3 className="text-lg font-medium text-[#e8e8e8] mb-4">Settings</h3>
            <div className="mb-4">
              <label className="block text-sm text-[#a3a3a3] mb-1">Data directory</label>
              <input
                type="text"
                value={settingsInput}
                onChange={(e) => setSettingsInput(e.target.value)}
                placeholder="/path/to/data"
                className="w-full px-4 py-2 rounded bg-[#0a0a0a] border text-[#e8e8e8] placeholder-[#525252]"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm text-[#a3a3a3] mb-2">AI provider</label>
              <div className="flex flex-wrap gap-2">
                {(["auto", "light_local", "full_local", "claude"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAIProvider(mode)}
                    className={`px-3 py-1.5 rounded text-sm ${
                      aiProvider === mode
                        ? "bg-[#e8e8e8] text-[#0a0a0a]"
                        : "bg-[#262626] text-[#a3a3a3] hover:text-[#e8e8e8]"
                    }`}
                  >
                    {mode === "auto"
                      ? "Auto"
                      : mode === "light_local"
                        ? "Light local"
                        : mode === "full_local"
                          ? "Full local"
                          : "Claude only"}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#737373] mt-1">
                Auto: 3-tier router (8b → 32b → Claude). Light: 8b only. Full: 8b+32b. Claude: cloud only.
              </p>
            </div>
            <div className="mb-4 p-3 rounded bg-[#0a0a0a] border" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <label className="block text-sm text-[#a3a3a3] mb-2">Claude API usage</label>
              {claudeUsageLoading ? (
                <div className="text-xs text-[#737373]">Loading…</div>
              ) : claudeUsage ? (
                <>
                  <div className="text-xs text-[#e8e8e8] space-y-1">
                    <div>Today: {claudeUsage.dailyInputTokens.toLocaleString()} in / {claudeUsage.dailyOutputTokens.toLocaleString()} out ≈ ${(claudeUsage.dailyUsd ?? 0).toFixed(2)}</div>
                    <div>Total: {claudeUsage.totalInputTokens.toLocaleString()} in / {claudeUsage.totalOutputTokens.toLocaleString()} out ≈ ${(claudeUsage.totalUsd ?? 0).toFixed(2)}</div>
                  </div>
                  <p className="text-[10px] text-[#737373] mt-1">Cost is estimated — Sonnet 4 pricing</p>
                </>
              ) : (
                <div className="text-xs text-[#737373]">No usage recorded yet</div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 rounded text-[#a3a3a3] hover:text-[#e8e8e8]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded font-medium text-[#0a0a0a]"
                style={{ backgroundColor: "#e8e8e8" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "rgba(127,29,29,0.9)", color: "#fecaca" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
