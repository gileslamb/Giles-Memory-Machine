"use client";

import { apiUrl } from "@/lib/api";
import type { ParsedEntry, ParsedLayer } from "@/lib/parse-context";
import type { ParsedTodo } from "@/lib/parse-todos";

const STALE_DAYS = 14;

interface StaleAlertProps {
  parsed: { layers: ParsedLayer[] } | null;
  openTodos: ParsedTodo[];
  dismissedEntryNames: Set<string>;
  onDismiss: (entryName: string) => void;
  onArchive: () => void;
}

function entryHasOpenTodos(entry: ParsedEntry, todos: ParsedTodo[]): boolean {
  const nameLower = entry.name.toLowerCase();
  return todos.some((t) => {
    if (t.status === "done") return false;
    const cat = t.category.toLowerCase();
    return cat.includes(nameLower) || cat.endsWith(`> ${nameLower}`);
  });
}

export function StaleAlert({ parsed, openTodos, dismissedEntryNames, onDismiss, onArchive }: StaleAlertProps) {
  const staleEntry = (() => {
    if (!parsed?.layers) return null;
    const candidates: { entry: ParsedEntry; layer: ParsedLayer; score: number }[] = [];
    for (const layer of parsed.layers) {
      for (const entry of layer.entries) {
        if (dismissedEntryNames.has(entry.name)) continue;
        const days = entry.daysSinceUpdate ?? 999;
        if (days < STALE_DAYS) continue;
        const hasTodos = entryHasOpenTodos(entry, openTodos);
        const score = days * 10 + (hasTodos ? 100 : 0);
        candidates.push({ entry, layer, score });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  })();

  if (!staleEntry) return null;

  const handleYes = () => {
    onDismiss(staleEntry.entry.name);
  };

  const handleNo = async () => {
    try {
      const res = await fetch(apiUrl("/api/context/archive-entry"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layerName: staleEntry.layer.name,
          entryName: staleEntry.entry.name,
        }),
      });
      if (res.ok) onArchive();
    } catch {
      // Could show toast
    }
  };

  return (
    <div
      className="rounded-lg py-3 px-4"
      style={{
        border: "1px solid rgba(240, 165, 74, 0.4)",
        backgroundColor: "rgba(240, 165, 74, 0.08)",
      }}
    >
      <p className="text-sm text-[#e8e8e8] mb-3">
        <span className="font-medium">{staleEntry.entry.name}</span> hasn&apos;t been updated in a while — still relevant?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleYes}
          className="text-xs px-3 py-1.5 rounded bg-[#262626] text-[#a3a3a3] hover:text-[#e8e8e8]"
        >
          Yes
        </button>
        <button
          type="button"
          onClick={handleNo}
          className="text-xs px-3 py-1.5 rounded bg-[#262626] text-[#a3a3a3] hover:text-[#e8e8e8]"
        >
          No
        </button>
      </div>
    </div>
  );
}
