#!/usr/bin/env npx tsx
/**
 * Standalone inbox watcher — runs independently of the Next.js app.
 * Loads .env.local, processes existing files, then watches for new ones.
 * Use: npm run inbox-watcher
 * Or for launchd: run from project root with WorkingDirectory set.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filePath: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // File may not exist
  }
}

// Load env before any imports that use it
loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

// Ensure we run from project root so process.cwd() and config paths resolve
process.chdir(projectRoot);

async function main() {
  const { startInboxWatcher } = await import("../src/lib/inbox-watcher");
  console.log("[Memory Machine] Starting standalone inbox watcher...");
  await startInboxWatcher();
  console.log("[Memory Machine] Watcher running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("[Memory Machine] Fatal error:", err);
  process.exit(1);
});
