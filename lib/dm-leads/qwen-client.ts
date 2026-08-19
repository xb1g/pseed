/**
 * Server-only client for the DM-drafting chat-completions endpoint.
 *
 * Any OpenAI-compatible host works; pick one with QWEN_BASE_URL /
 * QWEN_API_KEY / QWEN_MODEL. The name is historical: the first host was a
 * tailnet Qwen box, which is still the fallback default below.
 *
 * `chat_template_kwargs.enable_thinking: false` is required by llama.cpp
 * hosts, which otherwise spend the token budget on `reasoning_content` and
 * return an empty `content`. Gateways that do not know the field ignore it.
 */

export const QWEN_DEFAULT_BASE_URL = "http://100.107.213.73:8765/v1";
export const QWEN_DEFAULT_MODEL = "qwen";

export interface QwenChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface QwenChatOptions {
  messages: QwenChatMessage[];
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export function getQwenConfig(): { baseUrl: string; apiKey: string; model: string } {
  const baseUrl = (process.env.QWEN_BASE_URL || QWEN_DEFAULT_BASE_URL).replace(/\/+$/, "");
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new Error("QWEN_API_KEY is not set");
  }
  const model = process.env.QWEN_MODEL || QWEN_DEFAULT_MODEL;
  return { baseUrl, apiKey, model };
}

function extractMessageText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";

  const first = choices[0] as {
    message?: { content?: unknown; reasoning_content?: unknown };
    text?: unknown;
  };
  const message = first.message ?? {};
  const content = typeof message.content === "string" ? message.content : "";
  if (content.trim()) return content;
  const reasoning =
    typeof message.reasoning_content === "string" ? message.reasoning_content : "";
  if (reasoning.trim()) return reasoning;
  return typeof first.text === "string" ? first.text : "";
}

/**
 * Completes a chat request against the Qwen endpoint. Throws on HTTP or
 * network failure so callers can fall back to the original template.
 */
export async function completeQwenChat(options: QwenChatOptions): Promise<string> {
  const { baseUrl, apiKey, model } = getQwenConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 25_000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: options.messages,
        stream: false,
        max_tokens: options.maxTokens ?? 512,
        temperature: options.temperature ?? 0.4,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Qwen HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
    }

    const payload = await response.json();
    return extractMessageText(payload);
  } finally {
    clearTimeout(timeout);
  }
}
