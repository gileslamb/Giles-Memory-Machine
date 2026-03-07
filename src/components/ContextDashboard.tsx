"use client";

import { useState, useMemo } from "react";
import {
  parseContextMarkdown,
  formatRelativeDate,
  formatUpdatedAgo,
  HEALTH_COLORS,
  type ParsedLayer,
  type ParsedEntry,
  type ParsedCategory,
  type HealthTier,
} from "@/lib/parse-context";
import { findEntryBlock } from "@/lib/entry-edit";
import { ShapeOfThings } from "@/components/ShapeOfThings";
import { SummaryBox, type SummaryTarget } from "@/components/SummaryBox";

interface ContextDashboardProps {
  rawContent: string;
  onViewRaw: () => void;
  onContentUpdated?: (content: string) => void;
  pendingReview?: boolean;
}

export function ContextDashboard({ rawContent, onViewRaw, onContentUpdated, pendingReview }: ContextDashboardProps) {
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [summaryTarget, setSummaryTarget] = useState<SummaryTarget | null>(null);

  const parsed = useMemo(() => {
    try {
      return parseContextMarkdown(rawContent ?? "");
    } catch {
      return {
        layers: [
          {
            name: "PROJECTS",
            entries: [],
            categories: [],
            lastUpdated: null,
            daysSinceUpdate: null,
            healthTier: 3 as HealthTier,
            entriesThisWeek: 0,
            minExpectedEntries: 3,
          },
          {
            name: "ADMIN",
            entries: [],
            categories: [],
            lastUpdated: null,
            daysSinceUpdate: null,
            healthTier: 3 as HealthTier,
            entriesThisWeek: 0,
            minExpectedEntries: 4,
          },
          {
            name: "VISION / IDEAS",
            entries: [],
            categories: [],
            lastUpdated: null,
            daysSinceUpdate: null,
            healthTier: 3 as HealthTier,
            entriesThisWeek: 0,
            minExpectedEntries: 2,
          },
        ],
        globalLastUpdated: null,
        totalEntries: 0,
        entriesNeedingAttention: 0,
        overallHealthTier: 3 as HealthTier,
      };
    }
  }, [rawContent]);

  const isEmpty = !rawContent?.trim();

  if (isEmpty) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 text-center">
        <p className="text-ink-muted text-sm">
          No content yet. Paste something to get started.
        </p>
        <button
          onClick={onViewRaw}
          className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
        >
          View raw
        </button>
      </div>
    );
  }

  const overallColor = HEALTH_COLORS[parsed.overallHealthTier as HealthTier];

  const handleCategoryClick = (layer: ParsedLayer, category: ParsedCategory) => {
    setSummaryTarget({ type: "category", layer, category });
  };

  const handleLayerClick = (layer: ParsedLayer) => {
    setSummaryTarget({ type: "layer", layer });
  };

  return (
    <div className="flex h-full gap-4 min-w-0">
      <div className="flex-1 flex flex-col min-w-0 gap-4">
      {/* Summary bar */}
      <div
        className="shrink-0 flex items-center justify-between gap-4 py-3 px-4 rounded-lg border"
        style={{
          backgroundColor: `${overallColor}08`,
          borderColor: `${overallColor}40`,
        }}
      >
        <div className="flex items-center gap-4">
          {pendingReview && (
            <>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Pending review
              </span>
              <span className="text-ink-faint">·</span>
            </>
          )}
          <span className="text-sm text-ink">
            <strong>{parsed.totalEntries}</strong> entries
          </span>
          <span className="text-ink-faint">·</span>
          <span className="text-sm text-ink-muted">
            Last updated {formatRelativeDate(parsed.globalLastUpdated)}
          </span>
          {parsed.entriesNeedingAttention > 0 && (
            <>
              <span className="text-ink-faint">·</span>
              <span
                className="text-sm"
                style={{ color: HEALTH_COLORS[3] }}
              >
                {parsed.entriesNeedingAttention} need attention
              </span>
            </>
          )}
        </div>
        <button
          onClick={onViewRaw}
          className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
        >
          View raw
        </button>
      </div>

      {/* Shape of things */}
      <ShapeOfThings
        parsed={parsed}
        rawContent={rawContent ?? ""}
        onCategoryClick={handleCategoryClick}
        onLayerClick={handleLayerClick}
      />

      {/* Layer cards */}
      <div className="flex-1 overflow-auto space-y-3">
        {parsed.layers.map((layer) => (
          <LayerCard
            key={layer.name}
            layer={layer}
            rawContent={rawContent}
            isExpanded={expandedLayer === layer.name}
            onToggle={() =>
              setExpandedLayer(expandedLayer === layer.name ? null : layer.name)
            }
            onContentUpdated={onContentUpdated}
            onCategoryClick={handleCategoryClick}
          />
        ))}
      </div>
      </div>

      {/* Summary box on the right */}
      <SummaryBox
        target={summaryTarget}
        onClose={() => setSummaryTarget(null)}
      />
    </div>
  );
}

function LayerCard({
  layer,
  rawContent,
  isExpanded,
  onToggle,
  onContentUpdated,
  onCategoryClick,
}: {
  layer: ParsedLayer;
  rawContent: string;
  isExpanded: boolean;
  onToggle: () => void;
  onContentUpdated?: (content: string) => void;
  onCategoryClick?: (layer: ParsedLayer, category: ParsedCategory) => void;
}) {
  const worstEntryTier = layer.entries.length > 0
    ? Math.max(...layer.entries.map((e) => e.healthTier))
    : layer.healthTier;
  const color = HEALTH_COLORS[worstEntryTier as HealthTier];
  const fillPercent = Math.min(
    100,
    (layer.entries.length / layer.minExpectedEntries) * 100
  );

  const layerLabel =
    layer.name === "PROJECTS"
      ? "projects"
      : layer.name === "ADMIN"
        ? "items"
        : "ideas";

  const deltaText =
    layer.entriesThisWeek > 0
      ? ` · +${layer.entriesThisWeek} this week`
      : "";

  return (
    <div
      className="rounded-lg border-2 transition-colors cursor-pointer"
      style={{
        borderColor: isExpanded ? `${color}80` : `${color}40`,
        backgroundColor: isExpanded ? `${color}06` : `${color}04`,
      }}
      onClick={onToggle}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-ink flex items-center gap-2">
              {layer.name}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              {layer.entries.length} {layerLabel}
              {deltaText}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {formatUpdatedAgo(layer.lastUpdated)}
            </p>
          </div>
        </div>

        {/* Completeness bar */}
        <div className="mt-3 h-1 rounded-full bg-surface-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${fillPercent}%`,
              backgroundColor: color,
            }}
          />
        </div>

        {/* Entry chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {layer.entries.map((entry) => (
            <span
              key={entry.name}
              className="px-2 py-0.5 rounded text-xs border"
              style={{
                color: HEALTH_COLORS[entry.healthTier],
                borderColor: `${HEALTH_COLORS[entry.healthTier]}50`,
                backgroundColor: `${HEALTH_COLORS[entry.healthTier]}12`,
              }}
            >
              {entry.name}
            </span>
          ))}
          {layer.entries.length === 0 && (
            <span className="text-xs text-ink-faint">—</span>
          )}
        </div>

        {/* Category tags — clickable */}
        {layer.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {layer.categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick?.(layer, cat);
                }}
                className="px-2 py-0.5 rounded text-xs border hover:opacity-80 transition-opacity cursor-pointer"
                style={{
                  color: HEALTH_COLORS[cat.healthTier],
                  borderColor: `${HEALTH_COLORS[cat.healthTier]}50`,
                  backgroundColor: `${HEALTH_COLORS[cat.healthTier]}12`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isExpanded && layer.entries.length > 0 && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-border/50 mt-2 pt-4">
          {layer.entries.map((entry) => (
            <EntryRow
              key={entry.name}
              entry={entry}
              layerName={layer.name}
              rawContent={rawContent}
              onContentUpdated={onContentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryRow({
  entry,
  layerName,
  rawContent,
  onContentUpdated,
}: {
  entry: ParsedEntry;
  layerName: string;
  rawContent: string;
  onContentUpdated?: (content: string) => void;
}) {
  const color = HEALTH_COLORS[entry.healthTier];
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleEdit = () => {
    const found = findEntryBlock(rawContent, layerName, entry.name);
    setEditValue(found?.block ?? `- **${entry.name}** — ${entry.summary}`);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!onContentUpdated || !editValue.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/context/entry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          layer: layerName,
          entryName: entry.name,
          newContent: editValue.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      onContentUpdated(data.content);
      setIsEditing(false);
    } catch {
      // Error could be shown via toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onContentUpdated) return;
    setIsRemoving(true);
    try {
      const res = await fetch("/api/context/entry", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          layer: layerName,
          entryName: entry.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove");
      onContentUpdated(data.content);
      setShowRemoveConfirm(false);
    } catch {
      // Error could be shown via toast
    } finally {
      setIsRemoving(false);
    }
  };

  if (isEditing) {
    return (
      <div
        className="p-3 rounded-lg border"
        style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
        onClick={(e) => e.stopPropagation()}
      >
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full min-h-[80px] p-2 rounded text-sm bg-surface border border-border text-ink focus:outline-none focus:ring-1 focus:ring-ink-faint resize-y"
          placeholder="Entry content (markdown)"
          autoFocus
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleSaveEdit}
            disabled={isSaving || !editValue.trim()}
            className="px-3 py-1.5 text-xs rounded bg-ink text-surface font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs rounded border border-border hover:bg-surface-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (showRemoveConfirm) {
    return (
      <div
        className="p-3 rounded-lg border border-red-500/40 bg-red-950/20"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-ink mb-2">Remove &quot;{entry.name}&quot; from context?</p>
        <div className="flex gap-2">
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="px-3 py-1.5 text-xs rounded bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
          <button
            onClick={() => setShowRemoveConfirm(false)}
            className="px-3 py-1.5 text-xs rounded border border-border hover:bg-surface-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 rounded-lg border flex items-start justify-between gap-2 group"
      style={{
        backgroundColor: `${color}06`,
        borderColor: `${color}30`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-medium text-ink">{entry.name}</h4>
          <span
            className="shrink-0 px-1.5 py-0.5 rounded text-xs border"
            style={{
              color,
              borderColor: `${color}50`,
              backgroundColor: `${color}15`,
            }}
          >
            {formatRelativeDate(entry.lastUpdated)}
          </span>
          <span
            className="shrink-0 w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
            title={entry.lastUpdated?.toLocaleDateString() ?? "No date"}
          />
        </div>
        {entry.summary && (
          <p className="mt-1 text-xs text-ink-muted line-clamp-2">{entry.summary}</p>
        )}
      </div>
      {onContentUpdated && (
        <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="px-2 py-1 text-xs rounded border border-border hover:bg-surface-muted"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRemoveConfirm(true);
            }}
            className="px-2 py-1 text-xs rounded border border-border hover:bg-red-950/30 hover:border-red-500/40"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
