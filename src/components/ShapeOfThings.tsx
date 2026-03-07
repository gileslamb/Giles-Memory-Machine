"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  HEALTH_COLORS,
  type ParsedContext,
  type ParsedEntry,
  type ParsedLayer,
  type ParsedCategory,
  type HealthTier,
} from "@/lib/parse-context";

// Distinct colors for categories (not tied to health)
const CATEGORY_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#06b6d4", "#6366f1", "#84cc16", "#f97316", "#14b8a6",
  "#a855f7", "#eab308", "#22c55e", "#0ea5e9", "#d946ef",
];
import { parseTodosSection } from "@/lib/parse-todos";

interface ShapeOfThingsProps {
  parsed: ParsedContext;
  rawContent: string;
  onCategoryClick?: (layer: ParsedLayer, category: ParsedCategory) => void;
  onLayerClick?: (layer: ParsedLayer) => void;
}

export function ShapeOfThings({ parsed, rawContent, onCategoryClick, onLayerClick }: ShapeOfThingsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openTodos = parseTodosSection(rawContent, { includeArchivedDone: false }).filter(
    (t) => t.status !== "done"
  );

  const hasOpenTodoForEntry = (entryName: string): boolean => {
    const entryLower = entryName.toLowerCase();
    return openTodos.some((t) => {
      const cat = t.category.toLowerCase();
      return cat.includes(entryLower) || cat.endsWith(`> ${entryLower}`);
    });
  };

  const getProcrastinationStatus = (entry: ParsedEntry): "active" | "stalled" => {
    const days = entry.daysSinceUpdate ?? 999;
    if (days >= 14 && hasOpenTodoForEntry(entry.name)) return "stalled";
    return "active";
  };

  const masterData = parsed.layers.map((l, i) => ({
    name: l.name,
    count: l.entries.length,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    layer: l,
  }));

  // Key to force Recharts to re-render when content changes (real-time updates)
  const chartKey = `${rawContent.length}-${parsed.totalEntries}-${parsed.layers.flatMap((l) => l.categories.map((c) => c.entries.length).join(",")).join("|")}`;

  return (
    <div className="rounded-lg border border-border bg-surface-muted/30 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-muted/50 transition-colors"
      >
        <span className="text-sm font-medium text-ink">Shape of things</span>
        <span className="text-ink-faint text-xs">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-5">
          {/* Master overview */}
          <div>
            <h4 className="text-sm font-medium text-ink mb-2">Overview by layer</h4>
            <div className="h-28 w-full min-h-[7rem]">
              <ResponsiveContainer key={chartKey} width="100%" height="100%">
                <BarChart
                  data={masterData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 13, fill: "var(--ink)", fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 14,
                    }}
                    formatter={(value) => [`${value ?? 0} entries`, "Count"]}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 4, 4, 0]}
                    barSize={24}
                    onClick={(data: { payload?: { layer?: ParsedLayer } }) => {
                      const p = data?.payload;
                      if (p?.layer && onLayerClick) onLayerClick(p.layer);
                    }}
                    cursor={onLayerClick ? "pointer" : undefined}
                  >
                    {masterData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Per-category breakdown — full names, distinct colors, larger */}
          {parsed.layers.map((layer) => (
            <div key={layer.name}>
              <h4 className="text-sm font-medium text-ink mb-2">
                {layer.name} — by category
              </h4>
              <div className="h-auto min-h-[120px]" style={{ width: "100%" }}>
                <ResponsiveContainer key={`${chartKey}-${layer.name}`} width="100%" height={Math.max(120, layer.categories.length * 36)}>
                  <BarChart
                    data={layer.categories.map((c, i) => ({
                      name: c.name,
                      fullName: c.name,
                      count: c.entries.length,
                      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                      layer,
                      category: c,
                    }))}
                    layout="vertical"
                    margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={180}
                      tick={{ fontSize: 13, fill: "var(--ink)", fontWeight: 500 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--surface-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 14,
                      }}
                      formatter={(value, _, props: { payload?: { fullName?: string } }) => [
                        `${value ?? 0} entries`,
                        props.payload?.fullName ?? "",
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      radius={[0, 4, 4, 0]}
                      barSize={22}
                      onClick={(data: { payload?: { layer?: ParsedLayer; category?: ParsedCategory } }) => {
                        const p = data?.payload;
                        if (p?.layer && p?.category && onCategoryClick) {
                          onCategoryClick(p.layer, p.category);
                        }
                      }}
                      cursor={onCategoryClick ? "pointer" : undefined}
                    >
                      {layer.categories.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}

          {/* Procrastination indicators for project entries */}
          {parsed.layers[0]?.entries.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-ink-muted mb-2">Project status</h4>
              <div className="flex flex-wrap gap-2">
                {parsed.layers[0].categories.flatMap((cat) =>
                  cat.entries.map((entry) => {
                    const status = getProcrastinationStatus(entry);
                    return (
                      <span
                        key={entry.name}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border"
                        style={{
                          borderColor: `${HEALTH_COLORS[entry.healthTier]}40`,
                          backgroundColor: `${HEALTH_COLORS[entry.healthTier]}10`,
                        }}
                      >
                        {status === "stalled" ? (
                          <span title="14+ days no update, has open todos">🔴 stalled</span>
                        ) : (
                          <span title="Recently updated">🟢 active</span>
                        )}
                        <span className="text-ink">{entry.name}</span>
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
