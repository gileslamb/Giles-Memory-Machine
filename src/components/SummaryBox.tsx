"use client";

import { formatRelativeDate, HEALTH_COLORS, type ParsedContext, type ParsedLayer, type ParsedCategory, type HealthTier } from "@/lib/parse-context";

export type SummaryTarget =
  | { type: "layer"; layer: ParsedLayer }
  | { type: "category"; layer: ParsedLayer; category: ParsedCategory };

interface SummaryBoxProps {
  target: SummaryTarget | null;
  onClose?: () => void;
}

export function SummaryBox({ target, onClose }: SummaryBoxProps) {
  if (!target) {
    return (
      <div className="w-80 shrink-0 rounded-lg border border-border bg-surface-muted/30 p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
        <p className="text-sm text-ink-faint">
          Click a category bar or tag to see its summary
        </p>
      </div>
    );
  }

  const isLayer = target.type === "layer";
  const layer = target.layer;
  const category = target.type === "category" ? target.category : null;
  const entries = category ? category.entries : layer.entries;
  const title = category ? category.name : layer.name;
  const color = category
    ? HEALTH_COLORS[category.healthTier as HealthTier]
    : HEALTH_COLORS[layer.healthTier as HealthTier];

  return (
    <div
      className="w-80 shrink-0 rounded-lg border overflow-hidden flex flex-col"
      style={{
        borderColor: `${color}50`,
        backgroundColor: `${color}08`,
      }}
    >
      <div className="px-4 py-3 border-b flex items-start justify-between gap-2" style={{ borderColor: `${color}30` }}>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">{layer.name}</p>
          <h3 className="text-sm font-semibold text-ink mt-0.5">{title}</h3>
          <p className="text-xs text-ink-muted mt-1">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-ink-faint hover:text-ink text-sm shrink-0"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="p-3 rounded-lg border text-left"
            style={{
              borderColor: `${HEALTH_COLORS[entry.healthTier as HealthTier]}40`,
              backgroundColor: `${HEALTH_COLORS[entry.healthTier as HealthTier]}10`,
            }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-ink">{entry.name}</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  color: HEALTH_COLORS[entry.healthTier as HealthTier],
                  backgroundColor: `${HEALTH_COLORS[entry.healthTier as HealthTier]}20`,
                }}
              >
                {formatRelativeDate(entry.lastUpdated)}
              </span>
            </div>
            {entry.summary && (
              <p className="mt-1.5 text-xs text-ink-muted line-clamp-3">{entry.summary}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
