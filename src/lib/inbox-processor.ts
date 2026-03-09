/**
 * Process a file from the Memory Inbox: extract, merge, archive, move.
 */

import fs from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import {
  readMasterFile,
  writeMasterFile,
  ensureDataDirectory,
  getArchiveFilename,
  writeDomainFilesFromMaster,
} from "./file-system";
import { SCHEMA_PROMPT } from "./schema";
import { extractTextFromPath, isAcceptedFile } from "./extract-from-path";
import {
  MEMORY_INBOX_PATH,
  INBOX_FOLDERS,
  getLayerFromFolder,
  getProcessedDestPath,
  type InboxLayer,
} from "./inbox-structure";
import { readInboxStatus, writeInboxStatus } from "./inbox-status";

export async function processInboxFile(
  filePath: string,
  sourceFolder: string
): Promise<{ success: boolean; error?: string }> {
  const filename = path.basename(filePath);

  if (!isAcceptedFile(filename)) {
    await writeInboxStatus({
      lastError: `Unsupported file type: ${path.extname(filename)}`,
      lastErrorAt: new Date().toISOString(),
    });
    return { success: false, error: `Unsupported file type` };
  }

  try {
    const extractedText = await extractTextFromPath(filePath);
    if (!extractedText?.trim()) {
      await writeInboxStatus({
        lastError: `No extractable content: ${filename}`,
        lastErrorAt: new Date().toISOString(),
      });
      return { success: false, error: "No extractable content" };
    }

    const layerHint =
      sourceFolder === INBOX_FOLDERS.DROP
        ? null
        : getLayerFromFolder(sourceFolder);

    const mergedContent = await mergeIntoContext(extractedText, layerHint);
    const dir = await ensureDataDirectory();

    // Archive before overwrite
    const archivePath = path.join(dir, "archive", getArchiveFilename());
    const currentContent = await readMasterFile();
    await fs.writeFile(archivePath, currentContent, "utf-8");

    // Write master
    await writeMasterFile(mergedContent);

    // Write domain files
    await writeDomainFilesFromMaster(mergedContent);

    // Move to Processed
    const destLayer: InboxLayer | "unrouted" =
      layerHint ?? "unrouted";
    const destPath = getProcessedDestPath(destLayer, filename);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.rename(filePath, destPath);

    await writeInboxStatus({
      lastProcessedFile: filename,
      lastProcessedAt: new Date().toISOString(),
      lastError: null,
      lastErrorAt: null,
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Processing failed";
    await writeInboxStatus({
      lastError: `${filename}: ${msg}`,
      lastErrorAt: new Date().toISOString(),
    });
    return { success: false, error: msg };
  }
}

async function mergeIntoContext(
  extractedText: string,
  layerHint: InboxLayer | null
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const currentContext = await readMasterFile();
  const today = new Date().toISOString().slice(0, 10);

  const layerInstruction = layerHint
    ? `IMPORTANT: This content was dropped in the ${layerHint.toUpperCase()} folder. Merge it ONLY into the ## ${layerHint.toUpperCase()} section. Do not add to other layers.`
    : "The user dropped this in 00_DROP_HERE. Determine the correct layer (PROJECTS, ADMIN, VISION / IDEAS, or LIFE) and category automatically.";

  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: `You are a context manager. Merge incoming content into AI_CONTEXT.md.

${SCHEMA_PROMPT}

MERGE RULES:
1. NEVER overwrite existing content — always merge and update
2. If an entry exists, UPDATE it rather than duplicating
3. Add "Last updated: ${today}" to any changed section
4. Keep the file clean and concise — summarise, don't dump raw text
5. Preserve all four layers (PROJECTS, ADMIN, VISION / IDEAS, LIFE)
6. Output ONLY the complete merged markdown — no preamble`,
    messages: [
      {
        role: "user",
        content: `Current AI_CONTEXT.md:

\`\`\`markdown
${currentContext}
\`\`\`

---

${layerInstruction}

Content to merge:

\`\`\`
${extractedText}
\`\`\`

Output the complete merged AI_CONTEXT.md:`,
      },
    ],
  });

  const textBlock = response.content.find(
    (b): b is { type: "text"; text: string } => b.type === "text"
  );
  if (!textBlock) throw new Error("Claude did not return text");

  let merged = textBlock.text.trim();
  const codeMatch = merged.match(/```(?:markdown)?\s*([\s\S]*?)```/);
  if (codeMatch) merged = codeMatch[1].trim();

  merged = merged.replace(
    /\*?Last updated:\s*\d{4}-\d{2}-\d{2}\*?/gi,
    `*Last updated: ${today}*`
  );
  merged = merged.replace(
    /Last updated:\s*\d{4}-\d{2}-\d{2}/gi,
    `Last updated: ${today}`
  );

  return merged;
}

export async function countFilesWaiting(): Promise<number> {
  let count = 0;
  const folders = [
    INBOX_FOLDERS.DROP,
    INBOX_FOLDERS.PROJECTS,
    INBOX_FOLDERS.ADMIN,
    INBOX_FOLDERS.VISION,
    INBOX_FOLDERS.LIFE,
  ];
  try {
    for (const folder of folders) {
      const dir = path.join(MEMORY_INBOX_PATH, folder);
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isFile() && !e.name.startsWith(".") && isAcceptedFile(e.name)) {
          count++;
        }
      }
    }
  } catch {
    // Folder may not exist
  }
  return count;
}
