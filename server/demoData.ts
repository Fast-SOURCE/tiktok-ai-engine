import {
  bulkInsertProducts,
  bulkInsertScripts,
  bulkInsertVideos,
  clearDemoData,
  getAllProducts,
} from "./db";

/**
 * Seed deterministic demo data so any client demo replay produces
 * the same dramatic narrative: clear winners, mediocre middle, and
 * underperformers ready to be diagnosed.
 */
export async function seedDemoData() {
  await clearDemoData();

  // ---------- Products ----------
  await bulkInsertProducts([
    {
      code: "GLOWMAX",
      name: "GlowMax 维C精华液",
      category: "美妆个护",
      price: 24.99,
      sellingPoints: "20% 高浓度活性维C｜真空锁鲜不易氧化｜28 天淡斑提亮｜敏感肌可用",
      thumbnailUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80",
    },
    {
      code: "AIRPURE",
      name: "AirPure 桌面空气净化器",
      category: "家居好物",
      price: 49.99,
      sellingPoints: "USB 即插即用｜HEPA 13 级滤网｜<25dB 超静音｜过滤 99.97% PM2.5",
      thumbnailUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
    },
    {
      code: "SNAPMOUNT",
      name: "SnapMount 磁吸车载手机支架",
      category: "3C 数码",
      price: 19.99,
      sellingPoints: "N52 钕铁硼强磁｜出风口 3 秒安装｜兼容全部品牌手机｜过弯不掉落",
      thumbnailUrl: "https://images.unsplash.com/photo-1601972602288-3be527b4f18c?w=600&q=80",
    },
  ]);

  const productList = await getAllProducts();
  const productByCode = new Map(productList.map(p => [p.code, p]));
  const glow = productByCode.get("GLOWMAX")!;
  const air = productByCode.get("AIRPURE")!;
  const snap = productByCode.get("SNAPMOUNT")!;

  // ---------- Videos: 12 entries with crafted narrative ----------
  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  await bulkInsertVideos([
    // Winners (high GPM)
    {
      productId: glow.id,
      variant: "v3",
      title: "GlowMax · 28天对比变化｜效果对比版",
      hook: "左脸用了28天，右脸什么都没用",
      thumbnailUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
      views: 1842000,
      completionRate: 0.62,
      engagementRate: 0.087,
      gpm: 78.4,
      ctr: 0.142,
      revenue: 14437.28,
      status: "winner",
      publishedAt: new Date(now - 6 * day),
    },
    {
      productId: snap.id,
      variant: "v2",
      title: "SnapMount · 山路急转弯不掉落｜悬念反转版",
      hook: "山路过弯手机像粘在支架上",
      thumbnailUrl: "https://images.unsplash.com/photo-1606293459308-c40dd8a6f47a?w=600&q=80",
      views: 1235000,
      completionRate: 0.58,
      engagementRate: 0.092,
      gpm: 65.2,
      ctr: 0.131,
      revenue: 8052.2,
      status: "winner",
      publishedAt: new Date(now - 4 * day),
    },
    {
      productId: air.id,
      variant: "v1",
      title: "AirPure · 阳光灰尘对比｜痛点前置版",
      hook: "你办公桌的灰尘比马桶还多",
      thumbnailUrl: "https://images.unsplash.com/photo-1617104678098-de229db51175?w=600&q=80",
      views: 968000,
      completionRate: 0.55,
      engagementRate: 0.078,
      gpm: 56.8,
      ctr: 0.118,
      revenue: 5498.24,
      status: "winner",
      publishedAt: new Date(now - 5 * day),
    },
    // Normal middle band
    {
      productId: glow.id,
      variant: "v1",
      title: "GlowMax · 维C精华开封变黄｜痛点前置版",
      hook: "你买的维C精华开封一周就变黄了？",
      thumbnailUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80",
      views: 412000,
      completionRate: 0.41,
      engagementRate: 0.052,
      gpm: 38.5,
      ctr: 0.086,
      revenue: 1586.2,
      status: "normal",
      publishedAt: new Date(now - 8 * day),
    },
    {
      productId: glow.id,
      variant: "v2",
      title: "GlowMax · 皮肤科医生用错维C｜悬念反转版",
      hook: "90% 的人维C精华都用错了",
      thumbnailUrl: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80",
      views: 387000,
      completionRate: 0.43,
      engagementRate: 0.061,
      gpm: 42.1,
      ctr: 0.094,
      revenue: 1629.27,
      status: "normal",
      publishedAt: new Date(now - 7 * day),
    },
    {
      productId: air.id,
      variant: "v2",
      title: "AirPure · 卧室空气检测仪测试｜场景演示版",
      hook: "卧室 PM2.5 比你想象的高 5 倍",
      thumbnailUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80",
      views: 298000,
      completionRate: 0.39,
      engagementRate: 0.048,
      gpm: 31.4,
      ctr: 0.072,
      revenue: 935.72,
      status: "normal",
      publishedAt: new Date(now - 9 * day),
    },
    {
      productId: snap.id,
      variant: "v1",
      title: "SnapMount · 旧支架掉落集锦｜痛点前置版",
      hook: "普通车载支架颠簸两下就掉",
      thumbnailUrl: "https://images.unsplash.com/photo-1574023456501-0c478b3a4f63?w=600&q=80",
      views: 256000,
      completionRate: 0.36,
      engagementRate: 0.041,
      gpm: 28.9,
      ctr: 0.069,
      revenue: 739.84,
      status: "normal",
      publishedAt: new Date(now - 10 * day),
    },
    {
      productId: snap.id,
      variant: "v3",
      title: "SnapMount · 多机型测试｜效果对比版",
      hook: "iPhone / 三星 / 小米 同时挂上",
      thumbnailUrl: "https://images.unsplash.com/photo-1604335078822-e4d8aafc7da5?w=600&q=80",
      views: 198000,
      completionRate: 0.34,
      engagementRate: 0.039,
      gpm: 25.6,
      ctr: 0.061,
      revenue: 506.88,
      status: "normal",
      publishedAt: new Date(now - 6 * day),
    },
    // Underperformers
    {
      productId: glow.id,
      variant: "v4",
      title: "GlowMax · 品牌故事介绍",
      hook: "我们是来自法国的护肤品牌",
      thumbnailUrl: "https://images.unsplash.com/photo-1522335789203-aaa39e74efc1?w=600&q=80",
      views: 24000,
      completionRate: 0.18,
      engagementRate: 0.012,
      gpm: 6.4,
      ctr: 0.021,
      revenue: 153.6,
      status: "underperform",
      publishedAt: new Date(now - 3 * day),
    },
    {
      productId: air.id,
      variant: "v3",
      title: "AirPure · 拆机讲解滤网结构",
      hook: "今天给大家拆机看一下内部",
      thumbnailUrl: "https://images.unsplash.com/photo-1597858520171-563a8e8b9925?w=600&q=80",
      views: 18500,
      completionRate: 0.16,
      engagementRate: 0.009,
      gpm: 5.2,
      ctr: 0.018,
      revenue: 96.2,
      status: "underperform",
      publishedAt: new Date(now - 2 * day),
    },
    {
      productId: air.id,
      variant: "v4",
      title: "AirPure · CEO 致辞 30 秒",
      hook: "大家好，我是 AirPure 的 CEO",
      thumbnailUrl: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80",
      views: 12300,
      completionRate: 0.14,
      engagementRate: 0.007,
      gpm: 3.8,
      ctr: 0.014,
      revenue: 46.74,
      status: "underperform",
      publishedAt: new Date(now - 1 * day),
    },
    {
      productId: snap.id,
      variant: "v4",
      title: "SnapMount · 工厂生产线纪录片",
      hook: "深圳工厂一天生产 10 万件",
      thumbnailUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80",
      views: 9800,
      completionRate: 0.12,
      engagementRate: 0.005,
      gpm: 2.9,
      ctr: 0.011,
      revenue: 28.42,
      status: "underperform",
      publishedAt: new Date(now - 1 * day),
    },
  ]);

  // ---------- Pre-baked script variants for GlowMax (used in deconstruct demo) ----------
  await bulkInsertScripts([
    {
      productId: glow.id,
      variant: "v1",
      strategy: "痛点前置",
      content:
        "[0-3s] 你买的维C精华，是不是开封一周就变黄了？\n[3-8s] 市面上 80% 的维C精华都有这个问题——浓度不够，还容易氧化。\n[8-22s] GlowMax 真空锁鲜技术 + 20% 高浓度活性维C，28 天淡斑提亮，敏感肌可用。\n[22-30s] 点击下方小黄车，今天下单 $24.99 限时 7 折。",
      hook: "开封变黄痛点直击",
      pain: "维C精华氧化失效",
      cta: "$24.99 限时 7 折下单",
    },
    {
      productId: glow.id,
      variant: "v2",
      strategy: "悬念反转",
      content:
        "[0-3s] 皮肤科医生说，90% 的人维C精华都用错了。\n[3-10s] 不是浓度越高越好，关键是活性维C能不能渗透到肌底。\n[10-24s] GlowMax 真空锁鲜 + 纳米渗透技术，直达肌底，敏感肌不刺痛。\n[24-30s] 评论区扣『想要』或直接点小黄车 $24.99。",
      hook: "皮肤科医生身份背书",
      pain: "活性维C无法渗透",
      cta: "评论区互动 + 小黄车下单",
    },
    {
      productId: glow.id,
      variant: "v3",
      strategy: "效果对比",
      content:
        "[0-3s] 左脸用了 28 天 GlowMax，右脸什么都没用。\n[3-13s] Day 1 看不出区别 → Day 14 暗沉开始褪 → Day 28 色差肉眼可见。\n[13-28s] 20% 维C + 真空锁鲜，不是玄学是化学，10 万姐妹验证。\n[28-32s] 点击小黄车，今天下单送化妆棉。",
      hook: "左右脸 28 天对比",
      pain: "暗沉色斑提亮慢",
      cta: "下单赠送化妆棉",
    },
  ]);

  return { ok: true, productCount: 3, videoCount: 12, scriptCount: 3 };
}
