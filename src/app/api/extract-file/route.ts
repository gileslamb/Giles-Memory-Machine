import { NextResponse } from "next/server";
import { generateWithImage } from "@/lib/ai-client";
import { PDFParse } from "pdf-parse";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "pdf") {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        await parser.destroy();
        const text = result.text?.trim() || "(No extractable text in PDF)";
        return NextResponse.json({ text });
      } catch (e) {
        await parser.destroy();
        throw e;
      }
    }

    if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext ?? "")) {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      const { text } = await generateWithImage({
        system: "Extract all text from images. Output plain text only.",
        messages: [
          {
            role: "user",
            content:
              "Extract all text visible in this image. If it's a screenshot, document, or diagram, transcribe everything you can read. If it's a photo or visual with no text, describe the image concisely (what it shows, any relevant context). Output plain text only.",
          },
        ],
        imageBase64: base64,
        imageMediaType: mediaType,
      });

      return NextResponse.json({ text: text.trim() || "(Could not extract from image)" });
    }

    return NextResponse.json(
      { error: `Unsupported file type: ${ext}. Use PDF or image (png, jpg, webp).` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Extract file failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
