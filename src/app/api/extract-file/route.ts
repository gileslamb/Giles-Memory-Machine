import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "ANTHROPIC_API_KEY not configured for image extraction" },
          { status: 500 }
        );
      }
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: "Extract all text visible in this image. If it's a screenshot, document, or diagram, transcribe everything you can read. If it's a photo or visual with no text, describe the image concisely (what it shows, any relevant context). Output plain text only.",
              },
            ],
          },
        ],
      });

      const textBlock = response.content.find(
        (b): b is { type: "text"; text: string } => b.type === "text"
      );
      const text = textBlock?.text?.trim() ?? "(Could not extract from image)";
      return NextResponse.json({ text });
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
