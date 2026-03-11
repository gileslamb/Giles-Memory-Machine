"use client";

import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import type { ParsedEntry, ParsedLayer } from "@/lib/parse-context";

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

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
  activityRefreshTrigger?: number;
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
  activityRefreshTrigger = 0,
}: LeftPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activityItems, setActivityItems] = useState<{ label: string; timestamp: number }[]>([]);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/recent-activity"), { cache: "no-store" });
      const data = await res.json();
      if (data.items) setActivityItems(data.items);
    } catch {
      setActivityItems([]);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchActivity, activityRefreshTrigger]);

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
                className="w-full px-4 py-2 text-left text-sm font-semibold"
                style={{ color, letterSpacing: "0.08em" }}
              >
                {label}
              </button>
              <div className="mt-1 flex flex-col" style={{ gap: 6 }}>
                {items.length > 0 ? (
                  items.map((entry) => {
                    const isActive =
                      activeEntry?.layer === key && activeEntry?.name === entry.name;
                    return (
                      <button
                        key={entry.name}
                        type="button"
                        onClick={() => onEntryClick(key, entry.name)}
                        className={`w-full px-4 py-2 text-left text-sm truncate transition-colors ${
                          isActive ? "text-[#e8e8e8]" : "text-[#aaaaaa] hover:text-[#e8e8e8]"
                        }`}
                        style={
                          isActive
                            ? {
                                borderLeft: `2px solid ${color}`,
                                paddingLeft: 14,
                              }
                            : { paddingLeft: 16 }
                        }
                      >
                        · {entry.name}
                      </button>
                    );
                  })
                ) : (
                  <div
                    className="px-4 py-2 text-sm text-[#525252]"
                    style={{ paddingLeft: 16 }}
                  >
                    · —
                  </div>
                )}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => toggleSectionExpand(key)}
                    className="w-full px-4 py-2 text-left text-xs hover:opacity-80"
                    style={{ color, paddingLeft: 16 }}
                  >
                    {isExpanded ? "· less ←" : "· more →"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity log — archive + Processed, refreshes every 30s */}
      <div
        className="shrink-0 border-t py-4 px-4"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: "#666666" }}>
          RECENT ACTIVITY
        </div>
        <div className="space-y-2">
          {activityItems.length > 0 ? (
            activityItems.map((item, i) => (
              <div key={`${item.label}-${item.timestamp}-${i}`} className="text-xs text-[#a3a3a3] truncate">
                · {item.label} · {formatTimeAgo(item.timestamp)}
              </div>
            ))
          ) : (
            <div className="text-xs text-[#525252]">· No recent activity</div>
          )}
        </div>
      </div>
    </aside>
  );
}
