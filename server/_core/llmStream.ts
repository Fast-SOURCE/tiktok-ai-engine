import { ENV } from "./env";
import type { Message, ResponseFormat } from "./llm";

/**
 * Stream chat completion tokens from the underlying LLM provider.
 * Uses OpenAI compatible Server-Sent Events streaming protocol.
 *
 * Each yielded value is a delta text chunk (possibly empty between events).
 * The async generator finishes when the upstream sends `data: [DONE]`.
 */
export async function* streamLLM(params: {
  messages: Message[];
  responseFormat?: ResponseFormat;
  maxTokens?: number;
}): AsyncGenerator<string, void, void> {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const url =
    (ENV.forgeApiUrl?.replace(/\/$/, "") ?? "https://forge.manus.im") +
    "/v1/chat/completions";

  const payload: Record<string, unknown> = {
    model: "gemini-2.5-flash",
    stream: true,
    max_tokens: params.maxTokens ?? 4096,
    messages: params.messages.map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : m.content,
    })),
  };

  if (params.responseFormat) {
    payload.response_format = params.responseFormat;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `streamLLM failed: ${response.status} ${response.statusText} ${errText}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by double newlines
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!rawEvent) continue;

      // Each event may contain multiple `data:` lines, but we only care about the JSON payload
      for (const line of rawEvent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        if (!data) continue;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            yield delta;
          }
        } catch {
          // ignore malformed chunk
        }
      }
    }
  }
}
