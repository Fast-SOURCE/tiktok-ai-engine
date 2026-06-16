import { useCallback, useRef, useState } from "react";

export type SseStreamState = "idle" | "streaming" | "done" | "error";

export interface SseStreamHandle {
  /** Concatenated text built from all `delta` events. */
  text: string;
  state: SseStreamState;
  error: string | null;
  /** Begin a new POST SSE request. Cancels any ongoing stream first. */
  start: (path: string, body: unknown) => Promise<void>;
  /** Manually abort the current stream. */
  cancel: () => void;
  /** Clear text + reset state to idle. */
  reset: () => void;
}

/**
 * Consume a POST SSE endpoint. Each `delta` event payload (`{ text }`) is
 * appended to local state. The hook intentionally exposes `text` directly so
 * callers can render a typewriter-style update without extra buffering.
 */
export function useSseStream(): SseStreamHandle {
  const [text, setText] = useState("");
  const [state, setState] = useState<SseStreamState>("idle");
  const [error, setError] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    ctrlRef.current?.abort();
    ctrlRef.current = null;
  }, []);

  const reset = useCallback(() => {
    cancel();
    setText("");
    setState("idle");
    setError(null);
  }, [cancel]);

  const start = useCallback(async (path: string, body: unknown) => {
    cancel();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    setText("");
    setError(null);
    setState("streaming");

    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(`SSE failed ${res.status}: ${errText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          let eventName = "message";
          let dataLine = "";
          for (const line of rawEvent.split("\n")) {
            if (line.startsWith("event:")) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLine += line.slice(5).trim();
            }
          }

          if (!dataLine) continue;

          try {
            const payload = JSON.parse(dataLine);
            if (eventName === "delta" && typeof payload?.text === "string") {
              // Functional setState avoids stale closures during fast updates
              setText(prev => prev + payload.text);
            } else if (eventName === "done") {
              setState("done");
            }
          } catch {
            // ignore malformed event
          }
        }
      }

      setState(prev => (prev === "streaming" ? "done" : prev));
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // user-initiated cancel: state already managed by reset/cancel callers
        return;
      }
      console.error("[useSseStream]", err);
      setError((err as Error).message);
      setState("error");
    } finally {
      if (ctrlRef.current === ctrl) ctrlRef.current = null;
    }
  }, [cancel]);

  return { text, state, error, start, cancel, reset };
}
