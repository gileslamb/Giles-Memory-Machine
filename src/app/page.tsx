"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LeftPanel } from "@/components/LeftPanel";
import { CoachZone } from "@/components/CoachZone";
import { PieChartsZone } from "@/components/PieChartsZone";
import { EntryDetailView } from "@/components/EntryDetailView";
import { SectionView } from "@/components/SectionView";
import { ChatBox } from "@/components/ChatBox";
import { InboxStatusIndicator } from "@/components/InboxStatusIndicator";
import { PastePanel } from "@/components/PastePanel";
import { TodosView } from "@/components/TodosView";
import { parseContextMarkdown } from "@/lib/parse-context";
import type { ParsedEntry, ParsedLayer } from "@/lib/parse-context";
import type { ParsedTodo } from "@/lib/parse-todos";

type MainViewState = "chat" | "entry" | "section" | "todos";

export default function Home() {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [settingsInput, setSettingsInput] = useState("");
  const [activeView, setActiveView] = useState<MainViewState>("chat");
  const [activeEntry, setActiveEntry] = useState<{ layer: string; name: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [todos, setTodos] = useState<ParsedTodo[]>([]);

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
      const res = await fetch("/api/context");
      if (!res.ok) throw new Error("Failed to fetch");
      const { content: c } = await res.json();
      setContent(c ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load context");
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/context/todos?includeArchived=true");
      const data = await res.json();
      if (data.todos) setTodos(data.todos);
    } catch {
      setTodos([]);
    }
  }, []);

  useEffect(() => {
    if (activeView === "todos") fetchTodos();
  }, [activeView, fetchTodos]);

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
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setSettingsInput(d.dataDirectory ?? ""))
      .catch(() => {});
  }, []);

  const handleSaveSettings = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataDirectory: settingsInput.trim() }),
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
      />

      {/* Main area */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Slim header */}
        <header
          className="shrink-0 px-6 py-3 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-medium text-[#e8e8e8]">Giles Memory Machine</h1>
          </div>
          <div className="flex items-center gap-2">
            <InboxStatusIndicator />
            <button onClick={handleCopy} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Copy
            </button>
            <button onClick={fetchContent} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Refresh
            </button>
            <button onClick={() => setShowPaste(true)} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Paste
            </button>
            <button onClick={() => setShowSettings(true)} className="text-xs text-[#a3a3a3] hover:text-[#e8e8e8]">
              Settings
            </button>
          </div>
        </header>

        {/* Chat box — top of main area */}
        <div className="shrink-0 w-full" style={{ backgroundColor: "#0a0a0a" }}>
          <ChatBox rawContent={content} onContentUpdated={(c) => { setContent(c); fetchContent(); }} />
        </div>

        {/* Coach */}
        <CoachZone
          hasContent={!!content?.trim()}
          contentVersion={content.length}
          compact={activeView !== "chat"}
          entryContext={
            activeView === "entry" && activeEntry
              ? { layer: activeEntry.layer, entryName: activeEntry.name }
              : null
          }
          todosContext={todosContext}
        />

        {/* Dynamic content — pie charts, entry detail, section view */}
        <div className="flex-1 overflow-auto min-h-0" style={{ backgroundColor: "#0a0a0a" }}>
          {activeView === "chat" && parsed && (
            <div className="pt-12">
              <PieChartsZone parsed={parsed} />
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
            <div className="pt-12">
              <TodosView
                onContentUpdated={() => { fetchTodos(); fetchContent(); }}
              />
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div
            className="p-6 w-full max-w-md rounded-lg"
            style={{ backgroundColor: "#111111", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <h3 className="text-lg font-medium text-[#e8e8e8] mb-4">Data directory</h3>
            <input
              type="text"
              value={settingsInput}
              onChange={(e) => setSettingsInput(e.target.value)}
              placeholder="/path/to/data"
              className="w-full px-4 py-2 rounded bg-[#0a0a0a] border text-[#e8e8e8] placeholder-[#525252]"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
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
