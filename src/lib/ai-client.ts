/**
 * Claude-only AI client. No routing, no Ollama.
 * claude-sonnet-4-20250514 for everything.
 */

import Anthropic, {
  RateLimitError,
  BadRequestError,
  APIError,
} from "@anthropic-ai/sdk";
import { recordClaudeUsage } from "./claude-usage";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

export interface GenerateOptions {
  system: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  maxTokens?: number;
}

export interface GenerateWithImageOptions extends GenerateOptions {
  imageBase64: string;
  imageMediaType: string;
}

export type GenerateResult = { text: string };

function isClaudeCreditsError(err: unknown): boolean {
  if (err instanceof RateLimitError || err instanceof BadRequestError) return true;
  if (err instanceof APIError && (err.status === 400 || err.status === 429))
    return true;
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.toLowerCase().includes("credit") ||
    msg.toLowerCase().includes("insufficient") ||
    msg.toLowerCase().includes("balance")
  );
}

export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey, timeout: 300000 });
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      messages: options.messages,
    });
    const usage = response.usage;
    if (usage?.input_tokens != null && usage?.output_tokens != null) {
      recordClaudeUsage(usage.input_tokens, usage.output_tokens).catch(() => {});
    }
    const textBlock = response.content.find(
      (b): b is { type: "text"; text: string } => b.type === "text"
    );
    const text = textBlock?.text?.trim() ?? "";
    if (!text) throw new Error("Claude did not return text");
    return { text };
  } catch (err) {
    if (isClaudeCreditsError(err)) {
      throw new Error(
        "Check Claude credits — go to console.anthropic.com → Settings → Plans & Billing"
      );
    }
    throw err;
  }
}

export async function generateWithImage(
  options: GenerateWithImageOptions
): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey, timeout: 300000 });
  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: options.imageMediaType as "image/png" | "image/jpeg" | "image/webp",
                data: options.imageBase64,
              },
            },
            {
              type: "text",
              text: options.messages[0]?.content ?? "Extract all text from this image.",
            },
          ],
        },
      ],
    });
    const usage = response.usage;
    if (usage?.input_tokens != null && usage?.output_tokens != null) {
      recordClaudeUsage(usage.input_tokens, usage.output_tokens).catch(() => {});
    }
    const textBlock = response.content.find(
      (b): b is { type: "text"; text: string } => b.type === "text"
    );
    const text = textBlock?.text?.trim() ?? "";
    return { text };
  } catch (err) {
    if (isClaudeCreditsError(err)) {
      throw new Error(
        "Check Claude credits — go to console.anthropic.com → Settings → Plans & Billing"
      );
    }
    throw err;
  }
}
