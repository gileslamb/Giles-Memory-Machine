import fs from "fs/promises";
import path from "path";

const CONFIG_FILE = "context-config.json";
const MASTER_FILE = "AI_CONTEXT.md";
const CHECKINS_FILE = "CHECKINS.md";
const ARCHIVE_FOLDER = "archive";

export interface ContextConfig {
  dataDirectory: string;
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
  const config: ContextConfig = { dataDirectory: resolved };
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

export async function readMasterFile(): Promise<string> {
  const dir = await ensureDataDirectory();
  const filePath = path.join(dir, MASTER_FILE);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return getEmptyContext();
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

`;
}
