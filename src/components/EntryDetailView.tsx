"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatRelativeDate,
  formatUpdatedAgo,
  HEALTH_COLORS,
  type ParsedEntry,
  type ParsedLayer,
  type ParsedContext,
  type HealthTier,
} from "@/lib/parse-context";

const LAYER_COLORS: Record<string, string> = {
  PROJECTS: "#4af0c8",
  ADMIN: "#f0a84a",
  "VISION / IDEAS": "#c84af0",
  LIFE: "#f04a7a",
};

interface EntryDetailViewProps {
  entry: ParsedEntry;
  layer: ParsedLayer;
  parsed: ParsedContext | null;
  onEntryClick?: (layer: string, name: string) => void;
  onContentUpdated?: () => void;
}

export function EntryDetailView({
  entry,
  layer,
  parsed,
  onEntryClick,
  onContentUpdated,
}: EntryDetailViewProps) {
  const color = LAYER_COLORS[layer.name] ?? "#737373";
  const healthColor = HEALTH_COLORS[entry.healthTier as HealthTier];
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const res = await fetch(
        `/api/context/entry?layer=${encodeURIComponent(layer.name)}&name=${encodeURIComponent(entry.name)}`
      );
      if (res.ok) {
        const { content } = await res.json();
        setFullContent(content);
        setEditValue(content);
      } else {
        setFullContent(entry.summary);
      }
    } catch {
      setFullContent(entry.summary);
    } finally {
      setContentLoading(false);
    }
  }, [layer.name, entry.name, entry.summary]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleSave = useCallback(async () => {
    if (editValue === fullContent || isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/context/entry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          layer: layer.name,
          entryName: entry.name,
          content: editValue,
        }),
      });
      if (res.ok) {
        setFullContent(editValue);
        onContentUpdated?.();
      }
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [editValue, fullContent, layer.name, entry.name, onContentUpdated]);

  const relatedEntries = (() => {
    if (!parsed) return [];
    const cat = layer.categories.find((c) =>
      c.entries.some((e) => e.name === entry.name)
    );
    if (!cat) return [];
    return cat.entries.filter((e) => e.name !== entry.name).slice(0, 5);
  })();

  const displayContent = fullContent ?? (contentLoading ? "Loading…" : entry.summary);

  return (
    <div className="p-6 space-y-6">
      {/* Header — entry name in layer colour */}
      <div>
        <h2 className="text-xl font-medium" style={{ color }}>
          {entry.name}
        </h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: `${healthColor}20`, color: healthColor }}
          >
            {formatRelativeDate(entry.lastUpdated)}
          </span>
          <span className="text-xs text-[#525252]">
            {formatUpdatedAgo(entry.lastUpdated)}
          </span>
        </div>
      </div>

      {/* Staleness indicator */}
      <div
        className="w-full h-1 rounded-full"
        style={{ backgroundColor: `${healthColor}40` }}
        title={`${entry.daysSinceUpdate ?? "?"} days since update`}
      />

      {/* Full content — inline edit */}
      <div>
        {isEditing ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditValue(fullContent ?? "");
                setIsEditing(false);
              }
            }}
            className="w-full min-h-[200px] px-4 py-3 rounded-lg bg-[#111111] border text-sm text-[#e8e8e8] placeholder-[#525252] focus:outline-none focus:ring-1 focus:ring-[#525252] resize-y"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
            autoFocus
          />
        ) : (
          <div className="relative">
            <div className="text-sm text-[#a3a3a3] leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-2 text-xs px-2 py-1 rounded border border-[#525252] text-[#a3a3a3] hover:text-[#e8e8e8] hover:border-[#737373]"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Related entries */}
      {relatedEntries.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-[#666666] uppercase tracking-wider mb-2">
            Related
          </h3>
          <div className="space-y-1">
            {relatedEntries.map((e) => (
              <button
                key={e.name}
                type="button"
                onClick={() => onEntryClick?.(layer.name, e.name)}
                className="block w-full text-left px-3 py-1.5 text-sm text-[#a3a3a3] hover:text-[#e8e8e8] truncate"
              >
                · {e.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
