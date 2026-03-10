#!/usr/bin/env node
/**
 * Print full absolute paths for AI_CONTEXT.md and domain context files.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function getDataDirectory() {
  const envDir = process.env.DATA_DIR;
  if (envDir?.trim()) {
    return path.resolve(envDir);
  }
  try {
    const configPath = path.join(projectRoot, "context-config.json");
    const data = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(data);
    if (config.dataDirectory) {
      return path.resolve(config.dataDirectory);
    }
  } catch {
    // Config doesn't exist or is invalid
  }
  return path.join(projectRoot, "data");
}

const dir = getDataDirectory();
const domainFiles = [
  "projects_context.md",
  "admin_context.md",
  "vision_context.md",
  "life_context.md",
];

console.log("AI_CONTEXT.md:");
console.log(path.join(dir, "AI_CONTEXT.md"));
console.log("");
console.log("Domain context files:");
for (const f of domainFiles) {
  console.log(path.join(dir, f));
}
