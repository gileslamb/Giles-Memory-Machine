"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { ParsedContext, ParsedLayer, ParsedCategory } from "@/lib/parse-context";

const LAYER_PALETTES: Record<string, { bright: string; dark: string }> = {
  PROJECTS: { bright: "#4af0c8", dark: "#0a6644" },
  ADMIN: { bright: "#f0a84a", dark: "#7a4a00" },
  "VISION / IDEAS": { bright: "#c84af0", dark: "#5a0080" },
  LIFE: { bright: "#f04a7a", dark: "#800030" },
};

const OTHER_COLOR = "#333333";

function interpolateHex(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function getCategoryRecency(cat: ParsedCategory): number {
  const dates = cat.entries.map((e) => e.lastUpdated?.getTime() ?? 0).filter(Boolean);
  return dates.length ? Math.max(...dates) : 0;
}

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  fullName: string;
  lastUpdated: string | null;
  entryCount: number;
}

function getPieData(layer: ParsedLayer): PieDataItem[] {
  const total = layer.categories.reduce((s, c) => s + c.entries.length, 0) || 1;
  const palette = LAYER_PALETTES[layer.name] ?? { bright: "#737373", dark: "#333333" };

  const sorted = [...layer.categories].sort(
    (a, b) => getCategoryRecency(b) - getCategoryRecency(a)
  );

  const main: PieDataItem[] = [];
  let otherCount = 0;

  sorted.forEach((cat) => {
    const pct = (cat.entries.length / total) * 100;
    const lastEntry = cat.entries
      .filter((e) => e.lastUpdated)
      .sort((a, b) => (b.lastUpdated!.getTime() - a.lastUpdated!.getTime()))[0];
    const lastUpdatedStr = lastEntry?.lastUpdated
      ? lastEntry.lastUpdated.toLocaleDateString()
      : null;

    if (pct >= 10) {
      main.push({
        name: cat.name.length > 12 ? cat.name.slice(0, 11) + "…" : cat.name,
        fullName: cat.name,
        value: cat.entries.length,
        color: "", // assigned below
        lastUpdated: lastUpdatedStr,
        entryCount: cat.entries.length,
      });
    } else {
      otherCount += cat.entries.length;
    }
  });

  main.forEach((item, i) => {
    const t = main.length === 1 ? 0 : i / (main.length - 1);
    item.color = interpolateHex(palette.bright, palette.dark, t);
  });

  if (otherCount > 0) {
    main.push({
      name: "Other",
      fullName: "Other",
      value: otherCount,
      color: OTHER_COLOR,
      lastUpdated: null,
      entryCount: otherCount,
    });
  }

  return main;
}

interface PieChartsZoneProps {
  parsed: ParsedContext;
  onSliceClick?: (layer: ParsedLayer, category: string) => void;
}

const RADIAN = Math.PI / 180;

function renderLabel(props: {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  name?: string;
}) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0, name } = props;
  if (!name || name === "Other") return null;
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill="#000000"
      fontSize={9}
      fontWeight={500}
    >
      {name}
    </text>
  );
}

export function PieChartsZone({ parsed, onSliceClick }: PieChartsZoneProps) {
  const layers: ParsedLayer[] =
    parsed.layers.length >= 4
      ? parsed.layers
      : [
          ...parsed.layers,
          {
            name: "LIFE",
            entries: [],
            categories: [],
            lastUpdated: null,
            daysSinceUpdate: null,
            healthTier: 3 as const,
            entriesThisWeek: 0,
            minExpectedEntries: 2,
          },
        ].slice(0, 4);

  const handleSliceClick = (layer: ParsedLayer, entry: { fullName?: string }) => {
    if (onSliceClick && entry?.fullName && entry.fullName !== "Other") {
      const cat = layer.categories.find((c) => c.name === entry.fullName);
      if (cat) onSliceClick(layer, cat.name);
    }
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: { payload: PieDataItem }[];
  }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div
        className="px-3 py-2 rounded bg-[#1a1a1a] border text-xs text-[#e8e8e8]"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
      >
        <div className="font-medium">{p.fullName}</div>
        <div className="text-[#a3a3a3] mt-0.5">{p.entryCount} entries</div>
        {p.lastUpdated && (
          <div className="text-[#737373]">{p.lastUpdated}</div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {layers.map((layer) => {
        const data = getPieData(layer);
        const color = LAYER_PALETTES[layer.name]?.bright ?? "#737373";

        return (
          <div key={layer.name} className="flex flex-col items-center gap-2">
            <div className="w-full aspect-square max-w-[280px] min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="90%"
                    paddingAngle={1}
                    dataKey="value"
                    onClick={(entry: { fullName?: string }) => handleSliceClick(layer, entry)}
                    label={renderLabel}
                    labelLine={false}
                  >
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <span className="text-sm font-medium" style={{ color }}>
              {layer.name === "VISION / IDEAS" ? "IDEAS" : layer.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
