/**
 * Extract text from files on disk (for inbox watcher).
 * Supports: PDF, .md, .txt, .docx, .xlsx, .csv, images
 */

import fs from "fs/promises";
import path from "path";

const ACCEPTED_EXTENSIONS = [
  "pdf",
  "md",
  "txt",
  "docx",
  "xlsx",
  "xls",
  "csv",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
];

export function isAcceptedFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? ACCEPTED_EXTENSIONS.includes(ext) : false;
}

export async function extractTextFromPath(filePath: string): Promise<string> {
  const ext = path.extname(filePath).slice(1).toLowerCase();

  if (ext === "txt" || ext === "md") {
    return fs.readFile(filePath, "utf-8");
  }

  if (ext === "csv") {
    const raw = await fs.readFile(filePath, "utf-8");
    return formatCsvAsTable(raw);
  }

  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const parts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];
      if (data.length > 0) {
        parts.push(`## ${sheetName}\n\n${formatAsTable(data)}`);
      }
    }
    return parts.join("\n\n");
  }

  if (ext === "docx") {
    const mammoth = await import("mammoth");
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() ?? "";
  }

  if (ext === "pdf") {
    const { PDFParse } = await import("pdf-parse");
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      await parser.destroy();
      return result.text?.trim() ?? "(No extractable text in PDF)";
    } finally {
      await parser.destroy();
    }
  }

  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return extractFromImage(filePath, ext);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

function formatCsvAsTable(csv: string): string {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return "";
  const rows = lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') inQuotes = !inQuotes;
      else if ((c === "," || c === "\t") && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else current += c;
    }
    cells.push(current.trim());
    return cells;
  });
  return formatAsTable(rows);
}

function formatAsTable(rows: string[][]): string {
  if (rows.length === 0) return "";
  const colWidths = rows[0].map((_, i) =>
    Math.max(...rows.map((r) => (r[i] ?? "").toString().length), 2)
  );
  return rows
    .map((row) =>
      row
        .map((cell, i) =>
          (cell ?? "")
            .toString()
            .slice(0, 80)
            .padEnd(colWidths[i] ?? 2)
        )
        .join(" | ")
    )
    .join("\n");
}

async function extractFromImage(filePath: string, ext: string): Promise<string> {
  const { generateWithImage } = await import("@/lib/ai-client");
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  const mediaType =
    ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

  try {
    const { text } = await generateWithImage({
      system: "Extract all text from images. Output plain text only.",
      messages: [
        {
          role: "user",
          content:
            "Extract all text visible in this image. If it's a screenshot, document, or diagram, transcribe everything you can read. If it's a photo with no text, describe it concisely. Output plain text only.",
        },
      ],
      imageBase64: base64,
      imageMediaType: mediaType,
    });
    return text?.trim() ?? "(Could not extract from image)";
  } catch {
    return "(Could not extract from image)";
  }
}
