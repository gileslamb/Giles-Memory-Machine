#!/usr/bin/env node
/**
 * Test Anthropic API key directly (no server needed).
 * Run: node scripts/test-api-key.mjs
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// Load from .env.local or .env
function loadKey(path) {
  try {
    const env = readFileSync(path, "utf-8");
    for (const line of env.split("\n")) {
      const match = line.match(/^ANTHROPIC_API_KEY=(.+)$/);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    return null;
  }
  return null;
}

const apiKey = loadKey(join(projectRoot, ".env.local")) ?? loadKey(join(projectRoot, ".env"));
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY not found in .env or .env.local");
  process.exit(1);
}

console.log("Key loaded:", apiKey.slice(0, 15) + "..." + apiKey.slice(-4));
console.log("Calling Anthropic API...\n");

try {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 10,
    messages: [{ role: "user", content: "Reply with exactly: OK" }],
  });
  const text = response.content.find((b) => b.type === "text");
  console.log("✓ SUCCESS — API key works. Response:", text?.text || response);
} catch (err) {
  console.error("✗ FAILED — Anthropic error:");
  console.error("  ", err.message);
  if (err.message?.toLowerCase().includes("credit") || err.message?.toLowerCase().includes("balance")) {
    console.error("\n  → Go to console.anthropic.com → Settings → Plans & Billing");
    console.error("  → Add credits. Ensure the key in .env.local matches the account you topped up.");
  } else if (err.message?.toLowerCase().includes("invalid") || err.message?.toLowerCase().includes("authentication")) {
    console.error("\n  → Create a new API key at console.anthropic.com");
    console.error("  → Replace the key in .env.local and restart the dev server.");
  }
  process.exit(1);
}
