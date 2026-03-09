"use client";

import { useState } from "react";
import type { ParsedEntry, ParsedLayer } from "@/lib/parse-context";

const LAYER_COLORS: Record<string, string> = {
  PROJECTS: "#4af0c8",
  ADMIN: "#f0a84a",
  "VISION / IDEAS": "#c84af0",
  IDEAS: "#c84af0",
  LIFE: "#f04a7a",
};

interface LeftPanelProps {
  parsed: { layers: ParsedLayer[] } | null;
  activeView: "chat" | "entry" | "section" | "todos";
  activeEntry: { layer: string; name: string } | null;
  activeSection: string | null;
  onChatClick: () => void;
  onTodosClick: () => void;
  onEntryClick: (layer: string, name: string) => void;
  onSectionClick: (layer: string) => void;
}

function getRecentEntries(layer: ParsedLayer, limit: number): ParsedEntry[] {
  const withDate = layer.entries
    .map((e) => ({ ...e, sortDate: e.lastUpdated?.getTime() ?? 0 }))
    .sort((a, b) => b.sortDate - a.sortDate);
  return withDate.slice(0, limit);
}

export function LeftPanel({
  parsed,
  activeView,
  activeEntry,
  activeSection,
  onChatClick,
  onTodosClick,
  onEntryClick,
  onSectionClick,
}: LeftPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activityExpanded, setActivityExpanded] = useState(false);

  const activityItems = (() => {
    if (!parsed?.layers) return [];
    const flat = parsed.layers.flatMap((layer) =>
      layer.entries.map((e) => ({ entry: e, layerName: layer.name }))
    );
    return flat
      .filter(({ entry }) => entry.lastUpdated)
      .sort((a, b) => (b.entry.lastUpdated!.getTime() - a.entry.lastUpdated!.getTime()));
  })();

  const activityLimit = activityExpanded ? activityItems.length : 8;
  const activityToShow = activityItems.slice(0, activityLimit);
  const hasMoreActivity = activityItems.length > 8;

  const toggleSectionExpand = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sections = [
    { key: "PROJECTS", label: "PROJECTS", color: LAYER_COLORS.PROJECTS },
    { key: "ADMIN", label: "ADMIN", color: LAYER_COLORS.ADMIN },
    { key: "VISION / IDEAS", label: "IDEAS", color: LAYER_COLORS.IDEAS },
    { key: "LIFE", label: "LIFE", color: LAYER_COLORS.LIFE },
  ];

  return (
    <aside
      className="w-56 shrink-0 flex flex-col border-r"
      style={{
        backgroundColor: "#111111",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Chat — top item */}
      <button
        type="button"
        onClick={onChatClick}
        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
          activeView === "chat"
            ? "text-[#e8e8e8]"
            : "text-[#a3a3a3] hover:text-[#e8e8e8]"
        }`}
      >
        Chat
      </button>

      {/* Todos */}
      <button
        type="button"
        onClick={onTodosClick}
        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
          activeView === "todos"
            ? "text-[#e8e8e8]"
            : "text-[#a3a3a3] hover:text-[#e8e8e8]"
        }`}
      >
        Todos
      </button>

      <div className="flex-1 overflow-auto py-4">
        {sections.map(({ key, label, color }) => {
          const layer = parsed?.layers.find((l) => l.name === key);
          const totalCount = layer?.entries.length ?? 0;
          const limit = expandedSections.has(key) ? totalCount : 3;
          const items = layer ? getRecentEntries(layer, limit) : [];
          const hasMore = totalCount > 3;
          const isExpanded = expandedSections.has(key);
          const isSectionActive = activeSection === key;

          return (
            <div key={key} className="mb-6">
              <button
                type="button"
                onClick={() => onSectionClick(key)}
                className="w-full px-4 py-1.5 text-left text-sm font-medium"
                style={{ color }}
              >
                {label}
              </button>
              <div className="mt-1 space-y-0.5">
                {items.length > 0 ? (
                  items.map((entry) => {
                    const isActive =
                      activeEntry?.layer === key && activeEntry?.name === entry.name;
                    return (
                      <button
                        key={entry.name}
                        type="button"
                        onClick={() => onEntryClick(key, entry.name)}
                        className={`w-full px-4 py-1.5 text-left text-sm truncate ${
                          isActive ? "text-[#e8e8e8]" : "text-[#a3a3a3] hover:text-[#e8e8e8]"
                        }`}
                        style={
                          isActive
                            ? {
                                borderLeft: `3px solid ${color}`,
                                paddingLeft: "13px",
                              }
                            : { paddingLeft: "16px" }
                        }
                      >
                        · {entry.name}
                      </button>
                    );
                  })
                ) : (
                  <div
                    className="px-4 py-1.5 text-sm text-[#525252]"
                    style={{ paddingLeft: "16px" }}
                  >
                    · —
                  </div>
                )}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => toggleSectionExpand(key)}
                    className="w-full px-4 py-1.5 text-left text-xs hover:opacity-80"
                    style={{ color, paddingLeft: "16px" }}
                  >
                    {isExpanded ? "· less ←" : "· more →"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity log — bottom, read-only */}
      <div
        className="shrink-0 border-t py-4 px-4"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#666666" }}>
          RECENT ACTIVITY
        </div>
        <div className="space-y-2">
          {activityToShow.length > 0 ? (
            activityToShow.map(({ entry, layerName }) => {
              const color = LAYER_COLORS[layerName] ?? "#737373";
              const layerLabel = layerName === "VISION / IDEAS" ? "IDEAS" : layerName;
              const dateStr = entry.lastUpdated
                ? entry.lastUpdated.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : "";
              const timeStr = entry.lastUpdated
                ? entry.lastUpdated.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              return (
                <div key={`${layerName}-${entry.name}`} className="text-xs">
                  <div className="text-[#a3a3a3] truncate">
                    · {entry.name} — <span style={{ color }}>{layerLabel}</span>
                  </div>
                  <div className="text-[#525252] text-[10px] mt-0.5" style={{ paddingLeft: "1ch" }}>
                    {dateStr} {timeStr}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-[#525252]">· No recent activity</div>
          )}
          {hasMoreActivity && (
            <button
              type="button"
              onClick={() => setActivityExpanded(!activityExpanded)}
              className="text-xs text-[#666666] hover:text-[#a3a3a3] mt-1"
            >
              {activityExpanded ? "· less ←" : "· more →"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
