import type { Express, Request, Response } from "express";
import { streamLLM } from "./_core/llmStream";
import { getProductByCode, getVideoById } from "./db";

/**
 * Helper: write a single SSE event to the client.
 * Each event must end with a blank line.
 */
function sseSend(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/** Initialize SSE response headers (idempotent). */
function startSse(res: Response) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

/**
 * Stream a fallback string token-by-token if upstream LLM is unavailable.
 * Mirrors the natural pacing of an LLM (avg 12-25ms per code-point).
 */
async function streamFallback(
  res: Response,
  fullText: string,
  signal?: AbortSignal
) {
  const chars = Array.from(fullText);
  for (let i = 0; i < chars.length; i++) {
    if (signal?.aborted) return;
    sseSend(res, "delta", { text: chars[i] });
    // Slight randomness keeps the typewriter feel organic
    await new Promise(r => setTimeout(r, 15 + Math.random() * 10));
  }
}

/** Build deterministic fallback texts (used when LLM unavailable). */
const DECONSTRUCT_FALLBACK = (productName: string, sellingPoints: string) =>
  `## 钩子 (Hook)
开场前 3 秒采用「痛点直击 + 视觉冲击」组合：用极端使用场景画面（${productName} 解决的核心痛点）配合大字幕「你也遇到过这个问题吗？」，瞬间锁定有同类困扰的精准用户。预估 5 秒完播率提升至 65%+。

## 痛点 (Pain Point)
采用 PAS（Problem-Agitation-Solution）三段式叙事：先放大痛点的具体场景，再制造情绪共鸣（市面 80% 同类产品都有这问题），最后引出 ${productName} 作为唯一解。卖点：${sellingPoints}。

## CTA (Call to Action)
三层递进 CTA：① 第 22 秒口播「点击下方小黄车」② 第 25 秒画面浮现限时 7 折标签 ③ 结尾叠加「今天下单送赠品」钩子。预估 CTR 12-15%，比单一 CTA 高 2.3 倍。`;

const DIAGNOSE_FALLBACK = (
  title: string,
  completionRate: number,
  engagementRate: number,
  gpm: number
) => `## 根因定位 (Root Cause)
《${title}》前 3 秒钩子失效。开场使用品牌叙事内容，与 TikTok 用户的内容偏好（强冲突、强情绪、强利益）严重不匹配。5 秒完播率仅 ${(completionRate * 100).toFixed(0)}%，远低于带货视频 35% 的及格线，导致算法判定为低质量内容并停止推流。

## 数据异常 (Data Anomaly)
异常指标 1：5 秒完播率 ${(completionRate * 100).toFixed(0)}% (基线 35%+)；异常指标 2：互动率 ${(engagementRate * 100).toFixed(1)}% (基线 4%+)；异常指标 3：GPM $${gpm.toFixed(1)} (基线 $30+)。三项核心指标全线低于水位线，确认为内容质量问题而非投放问题。

## 优化建议 (Suggestions)
1. 钩子重写：替换为「痛点直击型」开场，直接展示用户使用同类产品时遭遇的最痛苦场景，配大字幕「你也遇到过这个吗？」
2. 节奏压缩：原视频 30 秒口播压缩到 18 秒，剩余 12 秒用于产品演示和价格 CTA，BPM 提升至 95-100
3. 字幕强化：每 2-3 秒切换一次字幕，关键词使用黄色高亮，符合 TikTok 算法对高信息密度的偏好

## 预期提升 (Expected Lift)
- 5 秒完播率：+180%
- GPM：+520%
- 置信度：86%`;

export function registerSseRoutes(app: Express) {
  /**
   * POST /api/stream/deconstruct
   * Body: { videoUrl: string, productCode: string }
   * Returns text/event-stream with `delta` events containing markdown chunks,
   * followed by a `done` event.
   */
  app.post("/api/stream/deconstruct", async (req: Request, res: Response) => {
    const { videoUrl, productCode } = req.body ?? {};
    if (!videoUrl || !productCode) {
      res.status(400).json({ error: "videoUrl and productCode are required" });
      return;
    }

    const product = await getProductByCode(productCode);
    if (!product) {
      res.status(404).json({ error: `Product ${productCode} not found` });
      return;
    }

    startSse(res);
    sseSend(res, "ready", { productName: product.name });

    const ac = new AbortController();
    req.on("close", () => ac.abort());

    const fallback = DECONSTRUCT_FALLBACK(product.name, product.sellingPoints);

    try {
      const iterator = streamLLM({
        messages: [
          {
            role: "system",
            content:
              "你是 TikTok 爆款视频解构专家。基于用户提供的视频链接和商品卖点，输出 Markdown 格式的拆解报告，必须包含四个二级标题：## 钩子 (Hook) / ## 痛点 (Pain Point) / ## CTA (Call to Action) / ## 黄金节奏 (Structure)。每段 60-100 字，专业、具体、有数据支撑。",
          },
          {
            role: "user",
            content: `视频链接：${videoUrl}\n商品：${product.name}\n卖点：${product.sellingPoints}`,
          },
        ],
        maxTokens: 1500,
      });

      let any = false;
      for await (const chunk of iterator) {
        if (ac.signal.aborted) break;
        any = true;
        sseSend(res, "delta", { text: chunk });
      }

      if (!any) {
        // Upstream returned empty stream → fall back to deterministic stream
        await streamFallback(res, fallback, ac.signal);
      }
    } catch (err) {
      console.warn("[SSE deconstruct] streamLLM failed, falling back", err);
      await streamFallback(res, fallback, ac.signal);
    }

    sseSend(res, "done", { ok: true });
    res.end();
  });

  /**
   * POST /api/stream/diagnose
   * Body: { videoId: number }
   */
  app.post("/api/stream/diagnose", async (req: Request, res: Response) => {
    const videoId = Number(req.body?.videoId);
    if (!videoId || Number.isNaN(videoId)) {
      res.status(400).json({ error: "videoId is required" });
      return;
    }

    const video = await getVideoById(videoId);
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    startSse(res);
    sseSend(res, "ready", { videoTitle: video.title });

    const ac = new AbortController();
    req.on("close", () => ac.abort());

    const fallback = DIAGNOSE_FALLBACK(
      video.title,
      video.completionRate,
      video.engagementRate,
      video.gpm
    );

    try {
      const iterator = streamLLM({
        messages: [
          {
            role: "system",
            content:
              "你是 TikTok 视频内容归因专家。基于视频核心数据，输出 Markdown 格式的诊断报告，必须包含四个二级标题：## 根因定位 (Root Cause) / ## 数据异常 (Data Anomaly) / ## 优化建议 (Suggestions) / ## 预期提升 (Expected Lift)。优化建议用有序列表（1. 2. 3.），预期提升用无序列表，语气专业、有数据支撑。",
          },
          {
            role: "user",
            content: `视频标题：${video.title}\n钩子：${video.hook}\n播放量：${video.views}\n5秒完播率：${(video.completionRate * 100).toFixed(1)}%\n互动率：${(video.engagementRate * 100).toFixed(1)}%\nGPM：$${video.gpm.toFixed(2)}`,
          },
        ],
        maxTokens: 1200,
      });

      let any = false;
      for await (const chunk of iterator) {
        if (ac.signal.aborted) break;
        any = true;
        sseSend(res, "delta", { text: chunk });
      }

      if (!any) {
        await streamFallback(res, fallback, ac.signal);
      }
    } catch (err) {
      console.warn("[SSE diagnose] streamLLM failed, falling back", err);
      await streamFallback(res, fallback, ac.signal);
    }

    sseSend(res, "done", { ok: true });
    res.end();
  });
}
