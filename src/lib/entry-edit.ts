/**
 * Utilities for extracting and modifying individual entries in AI_CONTEXT.md.
 */

const LAYER_HEADERS = ["## PROJECTS", "## ADMIN", "## VISION / IDEAS", "## LIFE"] as const;

const EDITED_REGEX = /\s*\*edited at [^*]+\*\s*\n?/g;

/**
 * Find the raw markdown block for an entry within a layer section.
 * Returns { block, start, end } or null if not found.
 */
export function findEntryBlock(
  content: string,
  layerName: string,
  entryName: string
): { block: string; start: number; end: number } | null {
  const header = `## ${layerName}`;
  const headerIdx = content.indexOf(header);
  if (headerIdx < 0) return null;

  const nextHeaderIdx = LAYER_HEADERS.findIndex((h) => h === header);
  const nextHeader =
    nextHeaderIdx >= 0 && nextHeaderIdx < LAYER_HEADERS.length - 1
      ? LAYER_HEADERS[nextHeaderIdx + 1]
      : null;
  const sectionEnd = nextHeader ? content.indexOf(nextHeader, headerIdx) : content.length;
  const section = content.slice(headerIdx, sectionEnd);

  // Entry pattern: - **EntryName** — or - **EntryName** —
  const entryPrefix = `- **${entryName}**`;
  const prefixIdx = section.indexOf(entryPrefix);
  if (prefixIdx < 0) return null;

  const blockStart = headerIdx + prefixIdx;
  const afterPrefix = content.slice(blockStart);
  const lines = afterPrefix.split("\n");

  let i = 0;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0) continue; // First line is the entry line
    // Stop at next entry or ###
    if (line.match(/^-\s+\*\*(.+?)\*\*\s*[—–-]/) || line.match(/^###\s/)) {
      break;
    }
    // Include *Last updated* when it immediately follows (single-entry block)
    if (line.match(/^\*?Last updated:/i)) {
      i++;
      break;
    }
    // Also stop at empty line that precedes a ### (category boundary)
    if (line.trim() === "" && lines[i + 1]?.match(/^###\s/)) break;
  }

  const blockLines = lines.slice(0, i);
  const block = blockLines.join("\n").replace(EDITED_REGEX, "").trimEnd();
  const blockEnd = blockStart + blockLines.join("\n").length;

  return { block, start: blockStart, end: blockEnd };
}

/**
 * Strip any existing "edited at" marker from a block.
 */
function stripEditedMarker(text: string): string {
  return text.replace(EDITED_REGEX, "").trimEnd();
}

/**
 * Add "edited at" marker to an entry block.
 */
function addEditedMarker(block: string): string {
  const stripped = stripEditedMarker(block);
  const now = new Date();
  const ts = now.toISOString().slice(0, 19).replace("T", " ");
  return `${stripped}\n*edited at ${ts}*`;
}

/**
 * Replace an entry's block with new content. Adds edited marker and updates Last updated.
 */
export function replaceEntryBlock(
  content: string,
  layerName: string,
  entryName: string,
  newBlock: string
): string {
  const found = findEntryBlock(content, layerName, entryName);
  if (!found) return content;

  const withEdited = addEditedMarker(newBlock);
  const today = new Date().toISOString().slice(0, 10);

  // Ensure the new block has a Last updated line if the original had one
  // For single-entry blocks, we add *Last updated: today* after the block
  const hasLastUpdated = content.slice(found.start, found.end).match(/Last updated:/i);
  let finalBlock = withEdited;
  if (hasLastUpdated && !withEdited.match(/Last updated:/i)) {
    finalBlock = `${withEdited}\n*Last updated: ${today}*`;
  } else if (withEdited.match(/Last updated:\s*\d{4}-\d{2}-\d{2}/i)) {
    finalBlock = withEdited.replace(
      /Last updated:\s*\d{4}-\d{2}-\d{2}/i,
      `Last updated: ${today}`
    );
  }

  return content.slice(0, found.start) + finalBlock + content.slice(found.end);
}

/**
 * Remove an entry from the content.
 */
export function removeEntryFromContent(
  content: string,
  layerName: string,
  entryName: string
): string {
  const found = findEntryBlock(content, layerName, entryName);
  if (!found) return content;

  const newContent = content.slice(0, found.start) + content.slice(found.end);
  return newContent.replace(/\n{3,}/g, "\n\n");
}
