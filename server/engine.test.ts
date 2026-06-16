import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as unknown as TrpcContext["res"],
  };
}

const caller = appRouter.createCaller(createPublicContext());

describe("数据驱动的 AI 内容自进化引擎 - 核心接口", () => {
  beforeAll(async () => {
    // Ensure deterministic dataset before tests
    const result = await caller.demo.seed();
    expect(result.ok).toBe(true);
    expect(result.productCount).toBe(3);
    expect(result.videoCount).toBe(12);
  }, 30000);

  it("demo.products 返回 3 个预置商品", async () => {
    const products = await caller.demo.products();
    expect(products).toHaveLength(3);
    const codes = products.map(p => p.code).sort();
    expect(codes).toEqual(["AIRPURE", "GLOWMAX", "SNAPMOUNT"]);
  });

  it("dashboard.overview 聚合 12 条视频指标", async () => {
    const overview = await caller.dashboard.overview();
    expect(overview.videoCount).toBe(12);
    expect(overview.totalViews).toBeGreaterThan(0);
    expect(overview.totalRevenue).toBeGreaterThan(0);
    expect(overview.avgGpm).toBeGreaterThan(0);
    expect(overview.avgCompletion).toBeGreaterThan(0);
    expect(overview.avgCompletion).toBeLessThan(1);
  });

  it("dashboard.videos 含 winner / underperform 分层", async () => {
    const videos = await caller.dashboard.videos();
    expect(videos.length).toBe(12);
    const statuses = new Set(videos.map(v => v.status));
    expect(statuses.has("winner")).toBe(true);
    expect(statuses.has("underperform")).toBe(true);
    expect(statuses.has("normal")).toBe(true);
    // Winners must outperform underperformers on GPM
    const winners = videos.filter(v => v.status === "winner");
    const losers = videos.filter(v => v.status === "underperform");
    const minWinnerGpm = Math.min(...winners.map(v => v.gpm));
    const maxLoserGpm = Math.max(...losers.map(v => v.gpm));
    expect(minWinnerGpm).toBeGreaterThan(maxLoserGpm);
  });

  it("deconstruct.scripts 返回 3 个差异化脚本变体", async () => {
    const scripts = await caller.deconstruct.scripts({ productCode: "GLOWMAX" });
    expect(scripts).toHaveLength(3);
    const variants = scripts.map(s => s.variant).sort();
    expect(variants).toEqual(["v1", "v2", "v3"]);
    for (const s of scripts) {
      expect(s.content.length).toBeGreaterThan(40);
      expect(s.strategy.length).toBeGreaterThan(0);
    }
  });

  it("deconstruct.analyze 输出含 hook/pain/cta/structure 四维结构", async () => {
    const result = (await caller.deconstruct.analyze({
      videoUrl: "https://www.tiktok.com/@demo/video/1",
      productCode: "GLOWMAX",
    })) as Record<string, { title: string; content: string; score: number }>;
    for (const key of ["hook", "pain", "cta", "structure"] as const) {
      expect(result[key]).toBeDefined();
      expect(result[key].title.length).toBeGreaterThan(0);
      expect(result[key].content.length).toBeGreaterThan(20);
      expect(result[key].score).toBeGreaterThan(0);
      expect(result[key].score).toBeLessThanOrEqual(100);
    }
  }, 30000);

  it("dashboard.diagnose 对低分视频输出根因 + 建议 + 预期提升", async () => {
    const videos = await caller.dashboard.videos();
    const target = videos.find(v => v.status === "underperform");
    expect(target).toBeDefined();
    const diag = (await caller.dashboard.diagnose({ videoId: target!.id })) as {
      rootCause: string;
      dataAnomaly: string;
      suggestions: string[];
      expectedLift: { completionRate: string; gpm: string; confidence: number };
    };
    expect(diag.rootCause.length).toBeGreaterThan(20);
    expect(diag.dataAnomaly.length).toBeGreaterThan(20);
    expect(diag.suggestions.length).toBeGreaterThanOrEqual(3);
    expect(diag.expectedLift.completionRate.length).toBeGreaterThan(0);
    expect(diag.expectedLift.gpm.length).toBeGreaterThan(0);
    expect(diag.expectedLift.confidence).toBeGreaterThan(0);
    expect(diag.expectedLift.confidence).toBeLessThanOrEqual(1);
  }, 30000);

  it("ads.triggerAuto 在 GPM 突破阈值时创建 Spark Ads 计划", async () => {
    const videos = await caller.dashboard.videos();
    const winner = videos.find(v => v.status === "winner")!;
    const before = await caller.ads.list();

    const campaign = await caller.ads.triggerAuto({
      videoId: winner.id,
      currentGpm: 78.5,
    });

    expect(campaign.campaignName).toContain("AUTO_");
    expect(campaign.dailyBudget).toBeGreaterThan(0);
    expect(campaign.bidStrategy).toBe("GMV Max - Auto Bid");
    expect(campaign.audience.ageRange).toBeDefined();
    expect(campaign.triggerGpm).toBeGreaterThanOrEqual(50);
    expect(campaign.status).toBe("ACTIVE");
    expect(campaign.mcpEndpoint).toContain("tiktok-ads-mcp");

    const after = await caller.ads.list();
    expect(after.length).toBe(before.length + 1);
  }, 30000);
});
