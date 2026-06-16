import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  createAdCampaign,
  getAllAdCampaigns,
  getAllProducts,
  getAllVideos,
  getProductByCode,
  getScriptsByProduct,
  getVideoById,
  updateVideoGpm,
} from "./db";
import { seedDemoData } from "./demoData";

/**
 * Helper: produce a deterministic LLM-style streaming response.
 * If invokeLLM throws (e.g. quota), we still stream a fallback so the
 * demo remains reliable in front of strategic clients.
 */
async function safeInvokeLLM(opts: Parameters<typeof invokeLLM>[0], fallback: string) {
  try {
    const resp = await invokeLLM(opts);
    const content = resp?.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim().length > 0) return content;
    return fallback;
  } catch (err) {
    console.warn("[LLM] invoke failed, using fallback", err);
    return fallback;
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /** Demo data management */
  demo: router({
    seed: publicProcedure.mutation(async () => {
      const result = await seedDemoData();
      return result;
    }),
    products: publicProcedure.query(async () => await getAllProducts()),
  }),

  /** Scene 1: Bestseller deconstruction & script generation */
  deconstruct: router({
    /**
     * Analyze a competitor video URL and return a structured breakdown.
     * For demo determinism we use a curated prompt + deterministic fallback.
     */
    analyze: publicProcedure
      .input(
        z.object({
          videoUrl: z.string().min(1),
          productCode: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        const product = await getProductByCode(input.productCode);
        if (!product) throw new Error(`Product ${input.productCode} not found`);

        const fallback = JSON.stringify({
          hook: {
            title: "前 3 秒钩子",
            content:
              "采用「痛点直击 + 视觉冲击」组合：开场用极端痛点画面（如维C精华液变黄、灰尘飞舞、手机掉落）配合大字幕「你也遇到过这个问题吗？」瞬间锁定有同类困扰的精准用户，停留率提升至 65%。",
            score: 92,
          },
          pain: {
            title: "痛点叙事结构",
            content:
              "采用 PAS（Problem-Agitation-Solution）三段式：先放大痛点的具体场景（市面 80% 同类产品都有这问题），再制造情绪共鸣（花了几百块等于涂糖水），最后引出产品作为唯一解（真空锁鲜+20% 高浓度）。",
            score: 88,
          },
          cta: {
            title: "CTA 转化设计",
            content:
              "三层递进 CTA：①第 22 秒口播「点击下方小黄车」②第 25 秒画面浮现限时 7 折标签 ③结尾叠加「今天下单送化妆棉」赠品钩子。CTR 预估 12-15%，比单一 CTA 高 2.3 倍。",
            score: 85,
          },
          structure: {
            title: "黄金叙事节奏",
            content:
              "0-3s 钩子 → 3-8s 痛点放大 → 8-12s 转折引出产品 → 12-22s 卖点轰炸 → 22-30s CTA 收口。BPM 90，转场硬切，符合 TikTok 算法偏好的高密度信息节奏。",
            score: 90,
          },
        });

        const content = await safeInvokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  "你是 TikTok 爆款视频解构专家。基于用户提供的视频链接和商品卖点，输出 JSON 格式的拆解结果，字段必须是 hook / pain / cta / structure，每个字段含 title / content / score(0-100)。content 用中文，每段 60-100 字，要专业、具体、有数据支撑。",
              },
              {
                role: "user",
                content: `视频链接：${input.videoUrl}\n商品：${product.name}\n卖点：${product.sellingPoints}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "deconstruction_result",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    hook: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        score: { type: "integer" },
                      },
                      required: ["title", "content", "score"],
                      additionalProperties: false,
                    },
                    pain: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        score: { type: "integer" },
                      },
                      required: ["title", "content", "score"],
                      additionalProperties: false,
                    },
                    cta: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        score: { type: "integer" },
                      },
                      required: ["title", "content", "score"],
                      additionalProperties: false,
                    },
                    structure: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                        score: { type: "integer" },
                      },
                      required: ["title", "content", "score"],
                      additionalProperties: false,
                    },
                  },
                  required: ["hook", "pain", "cta", "structure"],
                  additionalProperties: false,
                },
              },
            },
          },
          fallback
        );

        try {
          return JSON.parse(content);
        } catch {
          return JSON.parse(fallback);
        }
      }),

    /** Return three pre-baked script variants for a product. */
    scripts: publicProcedure
      .input(z.object({ productCode: z.string().min(1) }))
      .query(async ({ input }) => {
        const product = await getProductByCode(input.productCode);
        if (!product) return [];
        return await getScriptsByProduct(product.id);
      }),
  }),

  /** Scene 2: Dashboard & AI diagnosis */
  dashboard: router({
    overview: publicProcedure.query(async () => {
      const videos = await getAllVideos();
      const totalViews = videos.reduce((acc, v) => acc + v.views, 0);
      const totalRevenue = videos.reduce((acc, v) => acc + v.revenue, 0);
      const avgCompletion =
        videos.length > 0
          ? videos.reduce((acc, v) => acc + v.completionRate, 0) / videos.length
          : 0;
      const avgGpm =
        videos.length > 0 ? videos.reduce((acc, v) => acc + v.gpm, 0) / videos.length : 0;
      return {
        totalViews,
        totalRevenue,
        avgCompletion,
        avgGpm,
        videoCount: videos.length,
      };
    }),

    videos: publicProcedure.query(async () => await getAllVideos()),

    /** Diagnose an underperforming video with structured AI output. */
    diagnose: publicProcedure
      .input(z.object({ videoId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const video = await getVideoById(input.videoId);
        if (!video) throw new Error("Video not found");

        const fallback = JSON.stringify({
          rootCause:
            "前 3 秒钩子失效：开场使用品牌/CEO/工厂等品牌叙事内容，与 TikTok 用户的内容偏好（强冲突、强情绪、强利益）严重不匹配。5 秒完播率仅 " +
            (video.completionRate * 100).toFixed(0) +
            "%，远低于带货视频 35% 的及格线，导致算法判定为低质量内容并停止推流。",
          dataAnomaly:
            "异常指标 1：5 秒完播率 " +
            (video.completionRate * 100).toFixed(0) +
            "% (基线 35%+)；异常指标 2：互动率 " +
            (video.engagementRate * 100).toFixed(1) +
            "% (基线 4%+)；异常指标 3：GPM $" +
            video.gpm.toFixed(1) +
            " (基线 $30+)。三项核心指标全线低于水位线，确认为内容质量问题非投放问题。",
          suggestions: [
            "钩子重写：将开场替换为「痛点直击型」开场——直接展示用户使用同类产品时遭遇的最痛苦场景（如灰尘飞舞、手机掉落），配大字幕「你也遇到过这个吗？」",
            "节奏压缩：将原视频的 30 秒口播压缩到 18 秒，剩余 12 秒用于产品演示和价格 CTA，BPM 提升至 95-100",
            "字幕强化：每 2-3 秒切换一次字幕，关键词使用黄色高亮，遵循 TikTok 算法对高信息密度的偏好",
          ],
          expectedLift: {
            completionRate: "+180%",
            gpm: "+520%",
            confidence: 0.86,
          },
        });

        const content = await safeInvokeLLM(
          {
            messages: [
              {
                role: "system",
                content:
                  "你是 TikTok 视频内容归因专家。基于视频核心数据，输出 JSON 格式的诊断报告，字段：rootCause（问题根因）/ dataAnomaly（数据异常分析）/ suggestions（3 条优化建议数组）/ expectedLift（预期提升 含 completionRate, gpm, confidence）。语气专业、具体、有数据。",
              },
              {
                role: "user",
                content: `视频标题：${video.title}\n钩子：${video.hook}\n播放量：${video.views}\n5秒完播率：${(video.completionRate * 100).toFixed(1)}%\n互动率：${(video.engagementRate * 100).toFixed(1)}%\nGPM：$${video.gpm.toFixed(2)}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "diagnosis_report",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    rootCause: { type: "string" },
                    dataAnomaly: { type: "string" },
                    suggestions: { type: "array", items: { type: "string" } },
                    expectedLift: {
                      type: "object",
                      properties: {
                        completionRate: { type: "string" },
                        gpm: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["completionRate", "gpm", "confidence"],
                      additionalProperties: false,
                    },
                  },
                  required: ["rootCause", "dataAnomaly", "suggestions", "expectedLift"],
                  additionalProperties: false,
                },
              },
            },
          },
          fallback
        );

        try {
          return JSON.parse(content);
        } catch {
          return JSON.parse(fallback);
        }
      }),
  }),

  /** Scene 3: Auto ads triggering */
  ads: router({
    list: publicProcedure.query(async () => await getAllAdCampaigns()),

    /** Simulate the GPM crossing threshold and auto-creating a Spark Ads campaign. */
    triggerAuto: publicProcedure
      .input(
        z.object({
          videoId: z.number().int().positive(),
          currentGpm: z.number().positive(),
        })
      )
      .mutation(async ({ input }) => {
        const video = await getVideoById(input.videoId);
        if (!video) throw new Error("Video not found");

        // Update video metric in DB
        await updateVideoGpm(input.videoId, input.currentGpm, video.revenue);

        const campaignName = `AUTO_${video.title.slice(0, 20)}_${Date.now().toString().slice(-6)}`;
        const dailyBudget = Math.round(input.currentGpm * 6);
        const audience = JSON.stringify({
          ageRange: "18-35",
          interests: ["beauty", "shopping", "lifestyle"],
          lookalike: "1% Top GMV Buyers (US)",
          deviceTier: "mid-high",
        });

        await createAdCampaign({
          videoId: input.videoId,
          campaignName,
          dailyBudget,
          bidStrategy: "GMV Max - Auto Bid",
          audience,
          triggerGpm: input.currentGpm,
        });

        return {
          campaignName,
          dailyBudget,
          bidStrategy: "GMV Max - Auto Bid",
          audience: JSON.parse(audience),
          triggerGpm: input.currentGpm,
          videoTitle: video.title,
          status: "ACTIVE",
          mcpEndpoint: "tiktok-ads-mcp://campaigns.create",
          createdAt: new Date().toISOString(),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
