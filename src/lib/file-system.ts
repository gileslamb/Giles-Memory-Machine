import fs from "fs/promises";
import path from "path";

const CONFIG_FILE = "context-config.json";
const MASTER_FILE = "AI_CONTEXT.md";
const CHECKINS_FILE = "CHECKINS.md";
const ARCHIVE_FOLDER = "archive";
const PRIORITY_OVERRIDES_FILE = "priority-overrides.json";

export const DOMAIN_FILES = {
  projects: "projects_context.md",
  admin: "admin_context.md",
  vision: "vision_context.md",
  life: "life_context.md",
} as const;

export type DomainKey = keyof typeof DOMAIN_FILES;

export type AIProviderMode = "auto" | "light_local" | "full_local" | "claude";

export interface ContextConfig {
  dataDirectory: string;
  aiProvider?: AIProviderMode;
}

function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILE);
}

export async function getDataDirectory(): Promise<string> {
  // Render: use persistent disk path (set in render.yaml)
  const envDir = process.env.DATA_DIR;
  if (envDir?.trim()) {
    return path.resolve(envDir);
  }
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, "utf-8");
    const config: ContextConfig = JSON.parse(data);
    if (config.dataDirectory) {
      return path.resolve(config.dataDirectory);
    }
  } catch {
    // Config doesn't exist or is invalid
  }
  // Default: data folder within project
  return path.join(process.cwd(), "data");
}

export async function setDataDirectory(dir: string): Promise<void> {
  const resolved = path.resolve(dir);
  const configPath = getConfigPath();
  const existing = await getConfig();
  const config: ContextConfig = { ...existing, dataDirectory: resolved };
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

async function getConfig(): Promise<ContextConfig> {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, "utf-8");
    return JSON.parse(data) as ContextConfig;
  } catch {
    return { dataDirectory: path.join(process.cwd(), "data") };
  }
}

export async function getAIProvider(): Promise<AIProviderMode> {
  const config = await getConfig();
  const raw = (config.aiProvider ?? "auto") as string;
  if (raw === "local") return "full_local";
  if (["auto", "light_local", "full_local", "claude"].includes(raw)) return raw as AIProviderMode;
  return "auto";
}

export async function setAIProvider(mode: AIProviderMode): Promise<void> {
  const configPath = getConfigPath();
  const existing = await getConfig();
  const config: ContextConfig = { ...existing, aiProvider: mode };
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

export async function ensureDataDirectory(): Promise<string> {
  const dir = await getDataDirectory();
  await fs.mkdir(dir, { recursive: true });
  await fs.mkdir(path.join(dir, ARCHIVE_FOLDER), { recursive: true });
  return dir;
}

export function getArchiveFilename(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(":", "-");
  return `AI_CONTEXT_${date}_${time}.md`;
}

let _nextArchivePreview: string | null = null;

/** Set a short label for the next archive (e.g. filename or first words of input). Used by Recent Activity. */
export function setNextArchivePreview(preview: string): void {
  const trimmed = preview.trim().slice(0, 40);
  _nextArchivePreview = trimmed ? trimmed.replace(/\s+/g, " ") : null;
}

export async function readMasterFile(): Promise<string> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, MASTER_FILE);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return getEmptyContext();
  }
}

/** Read master file content and its last-modified time (for accurate "Last updated" display). */
export async function readMasterFileWithStats(): Promise<{
  content: string;
  lastModified: string | null;
}> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, MASTER_FILE);
  try {
    const [content, stat] = await Promise.all([
      fs.readFile(filePath, "utf-8"),
      fs.stat(filePath),
    ]);
    return {
      content,
      lastModified: stat.mtime.toISOString(),
    };
  } catch {
    return { content: getEmptyContext(), lastModified: null };
  }
}

export async function writeMasterFile(content: string): Promise<void> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, MASTER_FILE);
  const archivePath = path.join(dir, ARCHIVE_FOLDER, getArchiveFilename());

  // Read current content for archive (before overwrite)
  let currentContent: string;
  try {
    currentContent = await fs.readFile(filePath, "utf-8");
  } catch {
    currentContent = getEmptyContext();
  }

  // Archive current state (silent, never lose anything)
  await fs.writeFile(archivePath, currentContent, "utf-8");

  if (_nextArchivePreview) {
    const previewPath = archivePath.replace(/\.md$/, ".preview");
    await fs.writeFile(previewPath, _nextArchivePreview, "utf-8");
    _nextArchivePreview = null;
  }

  // Write new content
  await fs.writeFile(filePath, content, "utf-8");
}

export async function readCheckinsFile(): Promise<string> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, CHECKINS_FILE);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

export async function appendToCheckins(content: string): Promise<void> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, CHECKINS_FILE);
  const existing = await readCheckinsFile();
  const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const block = `\n---\n## ${timestamp}\n\n${content}\n`;
  await fs.writeFile(filePath, existing + block, "utf-8");
}

export interface PriorityOverrides {
  projectNames: string[];
  inactiveProjectNames?: string[];
}

export async function readPriorityOverrides(): Promise<PriorityOverrides | null> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, PRIORITY_OVERRIDES_FILE);
  try {
    const data = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(data) as {
      projectNames?: string[];
      inactiveProjectNames?: string[];
    };
    const result: PriorityOverrides = {
      projectNames: Array.isArray(parsed.projectNames) ? parsed.projectNames : [],
      inactiveProjectNames: Array.isArray(parsed.inactiveProjectNames) ? parsed.inactiveProjectNames : [],
    };
    return result;
  } catch {
    // File doesn't exist or invalid
  }
  return { projectNames: [], inactiveProjectNames: [] };
}

export async function writePriorityOverrides(overrides: PriorityOverrides): Promise<void> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, PRIORITY_OVERRIDES_FILE);
  await fs.writeFile(filePath, JSON.stringify(overrides, null, 2), "utf-8");
}

export async function appendTodosToContext(
  todos: Array<{ text: string; status: "open" | "in_progress" | "done"; category: string }>
): Promise<void> {
  if (todos.length === 0) return;
  const content = await readMasterFile();
  const today = new Date().toISOString().slice(0, 10);

  const todoLines = todos.map((t) => {
    const char = t.status === "done" ? "x" : t.status === "in_progress" ? "~" : " ";
    const datePart =
      t.status === "done" ? `completed ${today}` : t.status === "in_progress" ? `started ${today}` : `added ${today}`;
    return `- [${char}] ${t.text} · ${datePart} · ${t.category}`;
  });

  const todosHeaderIdx = content.indexOf("## CURRENT TODOS");
  let newContent: string;
  if (todosHeaderIdx >= 0) {
    const afterTodosHeader = content.slice(todosHeaderIdx);
    const nextH2 = afterTodosHeader.indexOf("\n## ", 1);
    const sectionEnd = nextH2 >= 0 ? todosHeaderIdx + nextH2 : content.length;
    const before = content.slice(0, sectionEnd);
    const rest = content.slice(sectionEnd);
    newContent = before + "\n" + todoLines.join("\n") + "\n" + rest;
  } else {
    const todosSection = `\n\n---\n\n## CURRENT TODOS\n${todoLines.join("\n")}\n`;
    newContent = content.trimEnd() + todosSection;
  }

  await writeMasterFile(newContent);
}

/**
 * Extract layer section from master content (e.g. ## PROJECTS ... ## ADMIN)
 */
function extractLayerSection(content: string, layerHeader: string, nextHeader: string | null): string {
  const start = content.indexOf(layerHeader);
  if (start < 0) return "";
  const searchFrom = start + layerHeader.length;
  const end = nextHeader ? content.indexOf(nextHeader, searchFrom) : content.length;
  return content.slice(start, end >= 0 ? end : content.length).trim();
}

/**
 * Write domain files from master content. Used after inbox merge.
 */
export async function writeDomainFilesFromMaster(masterContent: string): Promise<void> {
  const dir = await ensureDataDirectory();
  const layers: { key: DomainKey; header: string; next: string | null }[] = [
    { key: "projects", header: "## PROJECTS", next: "## ADMIN" },
    { key: "admin", header: "## ADMIN", next: "## VISION / IDEAS" },
    { key: "vision", header: "## VISION / IDEAS", next: "## LIFE" },
    { key: "life", header: "## LIFE", next: null },
  ];
  for (const { key, header, next } of layers) {
    const section = extractLayerSection(masterContent, header, next);
    if (section) {
      const filePath = path.join(dir, DOMAIN_FILES[key]);
      await fs.writeFile(filePath, `# ${header.replace("## ", "")}\n\n${section}\n`, "utf-8");
    }
  }
}

function getEmptyContext(): string {
  return `# AI Context

*Last updated: never*

---

## PROJECTS

### Live generative visual works
### Live AV performance
### Music albums / releases
### Commission work
### Web / interactive builds
### Residencies / grants / applications

---

## ADMIN

### Finance & invoicing
### Contacts & collaborators
### Scheduling & travel
### Legal & IP
### Tools & systems
### Outreach & marketing

---

## VISION / IDEAS

### Aesthetic & artistic direction
### Future projects & concepts
### Research & references
### Business & practice strategy
### Notes from conversations / reading

---

## LIFE

### Health & energy
### Personal reflections
### Habits & routines
### Family
### Personal goals

`;
}
