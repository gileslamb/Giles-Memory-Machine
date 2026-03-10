/**
 * Parse uploaded files (Excel, CSV, PDF, images) to plain text for Claude merge.
 */

import { apiUrl } from "./api";

export async function parseFileToText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    return parseCsv(await file.text());
  }
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    return parseXlsx(await file.arrayBuffer(), XLSX);
  }
  if (ext === "txt" || ext === "md") {
    return file.text();
  }
  if (ext === "pdf" || ["png", "jpg", "jpeg", "webp", "gif"].includes(ext ?? "")) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(apiUrl("/api/extract-file"), {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      const errMsg = typeof data.error === "string" ? data.error : "Extraction failed";
      throw new Error(errMsg);
    }
    return data.text ?? "";
  }
  throw new Error(`Unsupported file type: ${ext}. Use PDF, Excel, CSV, image, or text.`);
}

function parseCsv(csv: string): string {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return "";
  const rows = lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === "," || c === "\t") && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
    cells.push(current.trim());
    return cells;
  });
  return formatAsTable(rows);
}

function parseXlsx(buffer: ArrayBuffer, XLSX: { read: (b: ArrayBuffer, o: object) => { SheetNames: string[]; Sheets: Record<string, object> }; utils: { sheet_to_json: (s: object, o: object) => string[][] } }): string {
  const workbook = XLSX.read(buffer, { type: "array" });
  const parts: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as string[][];
    if (data.length > 0) {
      parts.push(`## ${sheetName}\n\n${formatAsTable(data)}`);
    }
  }
  return parts.join("\n\n");
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
