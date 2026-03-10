/**
 * Track Claude API token usage for cost visibility.
 * Persists to data/claude_usage.json.
 */

import fs from "fs/promises";
import path from "path";
import { getDataDirectory } from "./file-system";

const USAGE_FILE = "claude_usage.json";

// Approximate Sonnet 4 pricing (USD per 1M tokens) — update if Anthropic changes
const INPUT_PRICE_PER_1M = 3;
const OUTPUT_PRICE_PER_1M = 15;

export interface ClaudeUsageStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  dailyInputTokens: number;
  dailyOutputTokens: number;
  dateKey: string; // YYYY-MM-DD for daily reset
  lastUpdated: string;
}

async function getUsagePath(): Promise<string> {
  const dir = await getDataDirectory();
  return path.join(dir, USAGE_FILE);
}

async function loadUsage(): Promise<ClaudeUsageStats> {
  try {
    const p = await getUsagePath();
    const data = await fs.readFile(p, "utf-8");
    return JSON.parse(data) as ClaudeUsageStats;
  } catch {
    return {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      dailyInputTokens: 0,
      dailyOutputTokens: 0,
      dateKey: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString(),
    };
  }
}

async function saveUsage(stats: ClaudeUsageStats): Promise<void> {
  const p = await getUsagePath();
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(stats, null, 2), "utf-8");
}

export async function recordClaudeUsage(
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const stats = await loadUsage();
  const today = new Date().toISOString().slice(0, 10);

  // Reset daily if new day
  if (stats.dateKey !== today) {
    stats.dailyInputTokens = 0;
    stats.dailyOutputTokens = 0;
    stats.dateKey = today;
  }

  stats.totalInputTokens += inputTokens;
  stats.totalOutputTokens += outputTokens;
  stats.dailyInputTokens += inputTokens;
  stats.dailyOutputTokens += outputTokens;
  stats.lastUpdated = new Date().toISOString();

  await saveUsage(stats);
}

export async function getClaudeUsage(): Promise<ClaudeUsageStats> {
  return loadUsage();
}

export function estimateCost(stats: ClaudeUsageStats): {
  totalUsd: number;
  dailyUsd: number;
} {
  const totalUsd =
    (stats.totalInputTokens / 1_000_000) * INPUT_PRICE_PER_1M +
    (stats.totalOutputTokens / 1_000_000) * OUTPUT_PRICE_PER_1M;
  const dailyUsd =
    (stats.dailyInputTokens / 1_000_000) * INPUT_PRICE_PER_1M +
    (stats.dailyOutputTokens / 1_000_000) * OUTPUT_PRICE_PER_1M;
  return { totalUsd, dailyUsd };
}
