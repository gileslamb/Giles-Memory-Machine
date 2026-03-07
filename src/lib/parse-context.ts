/**
 * Parse AI_CONTEXT.md into structured data for the dashboard.
 */

export type HealthTier = 0 | 1 | 2 | 3; // 0=fresh, 1=amber, 2=orange, 3=red

export const HEALTH_COLORS: Record<HealthTier, string> = {
  0: "#c8f04a", // 0–7 days
  1: "#f0c84a", // 8–14 days
  2: "#f0844a", // 15–30 days
  3: "#f04a4a", // 30+ days
};

export interface ParsedEntry {
  name: string;
  summary: string;
  lastUpdated: Date | null;
  daysSinceUpdate: number | null;
  healthTier: HealthTier;
}

export interface ParsedCategory {
  name: string;
  entries: ParsedEntry[];
  healthTier: HealthTier;
}

export interface ParsedLayer {
  name: string;
  entries: ParsedEntry[];
  categories: ParsedCategory[];
  lastUpdated: Date | null;
  daysSinceUpdate: number | null;
  healthTier: HealthTier;
  entriesThisWeek: number;
  minExpectedEntries: number;
}

export interface ParsedContext {
  layers: ParsedLayer[];
  globalLastUpdated: Date | null;
  totalEntries: number;
  entriesNeedingAttention: number;
  overallHealthTier: HealthTier;
}

const LAYER_HEADERS = ["## PROJECTS", "## ADMIN", "## VISION / IDEAS"] as const;
const MIN_ENTRIES: Record<string, number> = {
  PROJECTS: 3,
  ADMIN: 4,
  "VISION / IDEAS": 2,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDate(str: string | null): Date | null {
  if (!str) return null;
  const iso = str.match(/(\d{4}-\d{2}-\d{2})/);
  if (iso) {
    const d = new Date(iso[1]);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function getHealthTier(date: Date | null): { tier: HealthTier; days: number | null } {
  if (!date) return { tier: 3, days: null };
  const days = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
  if (days <= 7) return { tier: 0, days };
  if (days <= 14) return { tier: 1, days };
  if (days <= 30) return { tier: 2, days };
  return { tier: 3, days };
}

function extractEntriesFromSection(
  section: string,
  sectionFallbackDate: Date | null
): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  const lines = section.split("\n");
  let lastSeenDate: Date | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lu = line.match(/\*?Last updated:\s*(\d{4}-\d{2}-\d{2})\*?/i);
    if (lu) lastSeenDate = parseDate(lu[1]);

    // Match "- **Name** — summary" or "- **Name:** summary" (colon used in Finance, Admin, etc.)
    const boldMatch = line.match(/^-\s+\*\*(.+?)\*\*\s*(?:—|–|-|:)\s*(.*)$/);
    if (boldMatch) {
      const name = boldMatch[1].trim();
      let summary = boldMatch[2].trim();
      let lastUpdated: Date | null = lastSeenDate;

      // Collect multi-line summary until next entry or Last updated
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j];
        if (next.match(/^-\s+\*\*/)) break;
        const nextLu = next.match(/\*?Last updated:\s*(\d{4}-\d{2}-\d{2})\*?/i);
        if (nextLu) {
          lastUpdated = parseDate(nextLu[1]);
          lastSeenDate = lastUpdated;
          j++;
          break;
        }
        if (next.trim() && !next.startsWith("#")) {
          summary += " " + next.trim();
        }
        j++;
      }

      summary = summary.replace(/\s+/g, " ").trim().slice(0, 120);
      if (summary.length === 120) summary += "…";

      const resolvedDate = lastUpdated ?? sectionFallbackDate;
      const { tier, days } = getHealthTier(resolvedDate);
      entries.push({
        name,
        summary,
        lastUpdated: resolvedDate,
        daysSinceUpdate: days,
        healthTier: tier,
      });
    }
  }

  return entries;
}

function extractCategoriesFromSection(
  section: string,
  sectionFallbackDate: Date | null
): ParsedCategory[] {
  const categories: ParsedCategory[] = [];
  const h3Regex = /\n###\s+(.+?)(?=\n|$)/g;
  let match;
  const splits: { name: string; contentStart: number; nextMatchStart?: number }[] = [];
  while ((match = h3Regex.exec(section)) !== null) {
    const prev = splits[splits.length - 1];
    if (prev) prev.nextMatchStart = match.index;
    splits.push({ name: match[1].trim(), contentStart: match.index + match[0].length });
  }
  for (const s of splits) {
    const end = s.nextMatchStart ?? section.length;
    const catSection = section.slice(s.contentStart, end);
    const entries = extractEntriesFromSection(catSection, sectionFallbackDate);
    const worstTier = entries.length > 0
      ? (Math.max(...entries.map((e) => e.healthTier)) as HealthTier)
      : (3 as HealthTier);
    categories.push({ name: s.name, entries, healthTier: worstTier });
  }
  return categories;
}

export function parseContextMarkdown(raw: string): ParsedContext {
  const layerName = (h: string) => h.replace("## ", "").trim();

  if (!raw?.trim()) {
    return {
      layers: LAYER_HEADERS.map((h) => ({
        name: layerName(h),
        entries: [],
        categories: [],
        lastUpdated: null,
        daysSinceUpdate: null,
        healthTier: 3 as HealthTier,
        entriesThisWeek: 0,
        minExpectedEntries: MIN_ENTRIES[layerName(h)] ?? 2,
      })),
      globalLastUpdated: null,
      totalEntries: 0,
      entriesNeedingAttention: 0,
      overallHealthTier: 3,
    };
  }

  const globalMatch = raw.match(/\*?Last updated:\s*(\d{4}-\d{2}-\d{2})\*?/i);
  const globalLastUpdated = globalMatch ? parseDate(globalMatch[1]) : null;

  const layers: ParsedLayer[] = [];
  let totalEntries = 0;
  let entriesNeedingAttention = 0;
  let worstTier: HealthTier = 0;

  const now = Date.now();
  const oneWeekAgo = now - 7 * MS_PER_DAY;

  for (let i = 0; i < LAYER_HEADERS.length; i++) {
    const header = LAYER_HEADERS[i];
    const nextHeader = LAYER_HEADERS[i + 1];
    const startIdx = raw.indexOf(header);
    const endIdx = nextHeader ? raw.indexOf(nextHeader) : raw.length;
    const section =
      startIdx >= 0
        ? raw.slice(startIdx + header.length, endIdx >= 0 ? endIdx : undefined)
        : "";

    const sectionDates = section.match(/\*?Last updated:\s*(\d{4}-\d{2}-\d{2})\*?/gi);
    const sectionFallbackDate = sectionDates?.length
      ? parseDate(sectionDates[sectionDates.length - 1].match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null)
      : null;

    const entries = extractEntriesFromSection(section, sectionFallbackDate);
    const categories = extractCategoriesFromSection(section, sectionFallbackDate);
    const lastUpdated =
      sectionFallbackDate ??
      entries.reduce<Date | null>((acc, e) => {
        if (!e.lastUpdated) return acc;
        if (!acc || e.lastUpdated > acc) return e.lastUpdated;
        return acc;
      }, null);

    const { tier: layerTier } = getHealthTier(lastUpdated);
    if (layerTier > worstTier) worstTier = layerTier;

    const entriesThisWeek = entries.filter(
      (e) => e.lastUpdated && e.lastUpdated.getTime() >= oneWeekAgo
    ).length;

    const layerMin = MIN_ENTRIES[layerName(header)] ?? 2;

    for (const e of entries) {
      totalEntries++;
      if (e.healthTier >= 2) entriesNeedingAttention++; // 15+ days
    }

    layers.push({
      name: layerName(header),
      entries,
      categories,
      lastUpdated,
      daysSinceUpdate: lastUpdated ? Math.floor((now - lastUpdated.getTime()) / MS_PER_DAY) : null,
      healthTier: layerTier,
      entriesThisWeek,
      minExpectedEntries: layerMin,
    });
  }

  return {
    layers,
    globalLastUpdated,
    totalEntries,
    entriesNeedingAttention,
    overallHealthTier: worstTier,
  };
}

export function formatRelativeDate(date: Date | null): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function formatUpdatedAgo(date: Date | null): string {
  if (!date) return "Never updated";
  const days = Math.floor((Date.now() - date.getTime()) / MS_PER_DAY);
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;
  if (days < 30) return `Updated ${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `Updated ${Math.floor(days / 30)} months ago`;
  return `Updated ${Math.floor(days / 365)} years ago`;
}
