/**
 * Recent activity from archive + Processed inbox.
 * Used by the left panel to show live proof the system is working.
 */

import fs from "fs/promises";
import path from "path";
import { getDataDirectory } from "./file-system";
import { MEMORY_INBOX_PATH, INBOX_FOLDERS, PROCESSED_SUBFOLDERS } from "./inbox-structure";

export interface ActivityItem {
  label: string;
  timestamp: number; // ms since epoch
  source: "archive" | "processed";
}

const ARCHIVE_PATTERN = /^AI_CONTEXT_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})\.md$/;

function parseArchiveTimestamp(filename: string): number | null {
  const m = filename.match(ARCHIVE_PATTERN);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  const date = new Date(parseInt(y!, 10), parseInt(mo!, 10) - 1, parseInt(d!, 10), parseInt(h!, 10), parseInt(mi!, 10));
  return date.getTime();
}

async function listArchiveActivity(limit: number): Promise<ActivityItem[]> {
  try {
    const dir = await getDataDirectory();
    const archiveDir = path.join(dir, "archive");
    const entries = await fs.readdir(archiveDir, { withFileTypes: true });
    const mdFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".md"));
    const withTimestamp: { name: string; timestamp: number; label: string }[] = [];

    for (const e of mdFiles) {
      const fullPath = path.join(archiveDir, e.name);
      let ts = parseArchiveTimestamp(e.name);
      if (ts == null) {
        try {
          const stat = await fs.stat(fullPath);
          ts = stat.mtime.getTime();
        } catch {
          continue;
        }
      } else {
        try {
          const stat = await fs.stat(fullPath);
          ts = Math.max(ts, stat.mtime.getTime());
        } catch {
          // use parsed ts
        }
      }
      let label = e.name.replace(/\.md$/, "");
      try {
        const previewPath = fullPath.replace(/\.md$/, ".preview");
        const preview = await fs.readFile(previewPath, "utf-8");
        const trimmed = preview.trim().slice(0, 35);
        if (trimmed) label = trimmed;
      } catch {
        // No preview file — extract from content: first **Entry Name** or friendly date
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          const boldMatch = content.match(/\*\*([^*]{2,}?)\*\*/);
          if (boldMatch) {
            const entry = boldMatch[1].trim().replace(/\s+/g, " ").slice(0, 35);
            if (entry && !/^(AI Context|Last updated)/i.test(entry)) label = entry;
          }
          if (label === e.name.replace(/\.md$/, "")) {
            const m = e.name.match(/AI_CONTEXT_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})/);
            if (m) label = `Context ${parseInt(m[3], 10)} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m[2], 10) - 1]} ${m[4]}:${m[5]}`;
          }
        } catch {
          // Keep filename-based label
        }
      }
      withTimestamp.push({ name: e.name, timestamp: ts, label });
    }

    return withTimestamp
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map((f) => ({
        label: f.label,
        timestamp: f.timestamp,
        source: "archive" as const,
      }));
  } catch {
    return [];
  }
}

async function listProcessedActivity(limit: number): Promise<ActivityItem[]> {
  const processedDir = path.join(MEMORY_INBOX_PATH, INBOX_FOLDERS.PROCESSED);
  const result: ActivityItem[] = [];

  try {
    for (const sub of PROCESSED_SUBFOLDERS) {
      const subDir = path.join(processedDir, sub);
      try {
        const entries = await fs.readdir(subDir, { withFileTypes: true });
        for (const e of entries) {
          if (!e.isFile() || e.name.startsWith(".")) continue;
          const fullPath = path.join(subDir, e.name);
          const stat = await fs.stat(fullPath);
          // Strip date prefix: 2026-03-10_foo.pdf → foo
          const label = e.name.replace(/^\d{4}-\d{2}-\d{2}_/, "").replace(/\.[^.]+$/, "");
          const displayLabel = label.replace(/_/g, " ").toUpperCase() || e.name;
          result.push({
            label: displayLabel,
            timestamp: stat.mtime.getTime(),
            source: "processed",
          });
        }
      } catch {
        // Subfolder may not exist
      }
    }

    return result
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getRecentActivity(): Promise<ActivityItem[]> {
  let archive: ActivityItem[] = [];
  let processed: ActivityItem[] = [];
  try {
    [archive, processed] = await Promise.all([
      listArchiveActivity(8),
      listProcessedActivity(5),
    ]);
  } catch {
    // One or both failed — return what we have
  }
  const merged = [...archive, ...processed].sort((a, b) => b.timestamp - a.timestamp);
  return merged.slice(0, 8);
}
