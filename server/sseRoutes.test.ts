import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "http";
import { registerSseRoutes } from "./sseRoutes";
import { resetAndSeed } from "./demoData";

// Force the SSE handlers down the deterministic fallback path so the test
// remains stable without relying on a live LLM endpoint.
vi.mock("./_core/llmStream", () => ({
  streamLLM: async function* () {
    // empty iterator → triggers fallback branch in sseRoutes
  },
}));

let server: Server;
let baseUrl = "";

beforeAll(async () => {
  await resetAndSeed();

  const app = express();
  app.use(express.json());
  registerSseRoutes(app);

  await new Promise<void>(resolve => {
    server = app.listen(0, () => resolve());
  });
  const addr = server.address();
  if (addr && typeof addr === "object") baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>(resolve => server.close(() => resolve()));
});

/** Drain the SSE stream into structured events for assertion. */
async function readSse(res: Response): Promise<{ events: { event: string; data: any }[] }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder("utf-8");
  let buf = "";
  const events: { event: string; data: any }[] = [];

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = "message";
      let data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      events.push({ event, data: data ? JSON.parse(data) : null });
    }
  }
  return { events };
}

describe("SSE /api/stream/deconstruct", () => {
  it("returns ready → delta(s) → done with proper Content-Type", async () => {
    const res = await fetch(`${baseUrl}/api/stream/deconstruct`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ videoUrl: "https://tiktok.com/x", productCode: "GLOWMAX" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const { events } = await readSse(res);

    const eventNames = events.map(e => e.event);
    expect(eventNames[0]).toBe("ready");
    expect(eventNames[eventNames.length - 1]).toBe("done");
    expect(eventNames.filter(n => n === "delta").length).toBeGreaterThan(0);

    const merged = events
      .filter(e => e.event === "delta")
      .map(e => e.data.text)
      .join("");
    // Fallback markdown must contain the four required sections
    expect(merged).toMatch(/## 钩子/);
    expect(merged).toMatch(/## 痛点/);
    expect(merged).toMatch(/## CTA/);
  }, 60_000);

  it("rejects requests with missing parameters", async () => {
    const res = await fetch(`${baseUrl}/api/stream/deconstruct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

describe("SSE /api/stream/diagnose", () => {
  it("streams a structured diagnosis report for a known video", async () => {
    // Pull a video id from the seeded demo data via API would require trpc
    // setup; instead reuse the known seed (resetAndSeed inserts ids 1..N).
    const res = await fetch(`${baseUrl}/api/stream/diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ videoId: 1 }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const { events } = await readSse(res);
    const eventNames = events.map(e => e.event);
    expect(eventNames[0]).toBe("ready");
    expect(eventNames.at(-1)).toBe("done");

    const merged = events
      .filter(e => e.event === "delta")
      .map(e => e.data.text)
      .join("");
    expect(merged).toMatch(/## 根因定位/);
    expect(merged).toMatch(/## 优化建议/);
    expect(merged).toMatch(/## 预期提升/);
  }, 60_000);

  it("returns 400 when videoId is missing", async () => {
    const res = await fetch(`${baseUrl}/api/stream/diagnose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
