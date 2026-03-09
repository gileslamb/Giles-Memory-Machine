"use client";

import { formatRelativeDate, HEALTH_COLORS, type ParsedLayer, type ParsedEntry, type HealthTier } from "@/lib/parse-context";

const LAYER_COLORS: Record<string, string> = {
  PROJECTS: "#4af0c8",
  ADMIN: "#f0a84a",
  "VISION / IDEAS": "#c84af0",
  LIFE: "#f04a7a",
};

interface SectionViewProps {
  layer: ParsedLayer;
  onEntryClick: (entry: ParsedEntry) => void;
}

export function SectionView({ layer, onEntryClick }: SectionViewProps) {
  const color = LAYER_COLORS[layer.name] ?? "#737373";
  const entries = [...layer.entries].sort((a, b) => {
    const da = a.lastUpdated?.getTime() ?? 0;
    const db = b.lastUpdated?.getTime() ?? 0;
    return db - da;
  });

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-lg font-medium" style={{ color }}>
        {layer.name === "VISION / IDEAS" ? "IDEAS" : layer.name}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => {
          const healthColor = HEALTH_COLORS[entry.healthTier as HealthTier];
          return (
            <button
              key={entry.name}
              type="button"
              onClick={() => onEntryClick(entry)}
              className="text-left p-4 rounded-lg transition-colors hover:bg-white/5"
              style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#e8e8e8] truncate">
                  {entry.name}
                </span>
                <span
                  className="text-xs shrink-0 px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${healthColor}20`, color: healthColor }}
                >
                  {formatRelativeDate(entry.lastUpdated)}
                </span>
              </div>
              {entry.summary && (
                <p className="mt-1 text-xs text-[#a3a3a3] line-clamp-2">
                  {entry.summary}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
