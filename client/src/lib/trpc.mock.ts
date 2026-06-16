/**
 * Mock tRPC - replaces real tRPC for static Vercel deployment.
 * All queries return demo data; mutations are no-ops.
 */

// ── Mock data ──────────────────────────────────────────────────────────────
const mockUser = { id: 1, username: "demo", email: "demo@tiktok-ai.com" };

const mockProducts = [
  { id: 1, code: "P001", name: "美白精华液", category: "护肤", price: 199 },
  { id: 2, code: "P002", name: "玻尿酸面膜", category: "护肤", price: 89 },
  { id: 3, code: "P003", name: "防晒霜SPF50+", category: "护肤", price: 129 },
];

const mockVideos = [
  { id: 1, title: "28天美白挑战·真实对比", hook: "你还在用错方法美白吗？", views: 128400, completionRate: 0.62, engagementRate: 0.089, gpm: 67.3, revenue: 8640, status: "winner", thumbnailUrl: "https://picsum.photos/seed/v1/80/80" },
  { id: 2, title: "皮肤科医生推荐的护肤顺序", hook: "医生都在用的护肤秘诀", views: 89200, completionRate: 0.48, engagementRate: 0.072, gpm: 41.2, revenue: 3670, status: "normal", thumbnailUrl: "https://picsum.photos/seed/v2/80/80" },
  { id: 3, title: "为什么你的面膜没效果", hook: "90%的人都用错了面膜", views: 34600, completionRate: 0.21, engagementRate: 0.031, gpm: 8.7, revenue: 301, status: "underperform", thumbnailUrl: "https://picsum.photos/seed/v3/80/80" },
  { id: 4, title: "夏日防晒必备清单", hook: "晒黑晒老全靠这一步", views: 67800, completionRate: 0.55, engagementRate: 0.064, gpm: 53.1, revenue: 3600, status: "winner", thumbnailUrl: "https://picsum.photos/seed/v4/80/80" },
  { id: 5, title: "油皮救星·控油不假白", hook: "油皮女生的逆袭之路", views: 22100, completionRate: 0.19, engagementRate: 0.028, gpm: 6.4, revenue: 141, status: "underperform", thumbnailUrl: "https://picsum.photos/seed/v5/80/80" },
];

const mockOverview = {
  totalViews: 342100,
  totalRevenue: 16352,
  avgGpm: 35.3,
  winnerCount: 2,
};

const mockAds = [
  { id: 1, name: "Spark Ads · 美白精华液-Winner", status: "active", budget: 500, spent: 312, impressions: 48200, clicks: 1840, conversions: 67 },
  { id: 2, name: "Spark Ads · 防晒霜SPF50+", status: "active", budget: 300, spent: 198, impressions: 29400, clicks: 1120, conversions: 41 },
];

const mockScripts = [
  {
    id: 1,
    variant: "A",
    strategy: "痛点切入",
    hook: "你还在用错方法美白吗？",
    pain: "美白产品用了一堆，效果全无",
    cta: "点击链接，28天见证蜕变",
    content: `[开场 0-3s]\n你还在用错方法美白吗？\n\n[痛点 3-8s]\n花了几千块买美白产品，\n皮肤还是暗沉发黄，\n根本原因是你的护肤顺序错了！\n\n[解决方案 8-18s]\n正确步骤：\n① 洁面后先用精华液\n② 再叠加面膜锁水\n③ 最后防晒隔离\n\n[社会证明 18-25s]\n28天真实对比，\n素颜也能白到发光！\n\n[CTA 25-30s]\n点击链接，限时7折，\n28天美白挑战，现在开始！`,
  },
  {
    id: 2,
    variant: "B",
    strategy: "权威背书",
    hook: "皮肤科医生不会告诉你的秘密",
    pain: "普通护肤品效果慢，成分不透明",
    cta: "立即了解成分配方",
    content: `[开场 0-3s]\n皮肤科医生不会告诉你的美白秘密！\n\n[权威 3-8s]\n作为执业皮肤科医生，\n我每天都被问：\n"为什么我的美白产品没效果？"\n\n[核心内容 8-18s]\n关键在于3个成分：\n① 烟酰胺——抑制黑色素\n② 维C衍生物——氧化还原\n③ 熊果苷——温和淡斑\n\n[产品植入 18-25s]\n这款精华液3种成分全包含，\n临床测试28天亮白率提升40%！\n\n[CTA 25-30s]\n评论区留言"美白"，\n获取专属优惠码！`,
  },
  {
    id: 3,
    variant: "C",
    strategy: "对比反转",
    hook: "花200和花2000的美白效果",
    pain: "不知道该选哪款，怕踩雷",
    cta: "看完再买不踩雷",
    content: `[开场 0-3s]\n花200块和花2000块的美白效果，\n差距到底有多大？\n\n[对比 3-12s]\n我测试了市面上12款美白产品，\n价格从99到3800不等。\n\n结果让我很意外——\n有3款200以内的，\n效果完全不输大牌！\n\n[揭晓 12-22s]\n其中排名第一的就是这款，\n烟酰胺浓度5%，\n28天使用后，\n暗沉改善明显，毛孔也细了！\n\n[CTA 22-30s]\n链接在主页，\n今天下单立减50，\n不好用包退！`,
  },
];

// ── Helper: create a mock query result ────────────────────────────────────
function mockQuery<T>(data: T) {
  return {
    data,
    isLoading: false,
    isPending: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve({ data }),
  };
}

// ── Helper: create a mock mutation ────────────────────────────────────────
function mockMutation<TData = unknown>(returnValue?: TData) {
  return {
    mutate: (_input?: unknown, opts?: { onSuccess?: (data: TData) => void }) => {
      if (opts?.onSuccess) opts.onSuccess(returnValue as TData);
    },
    mutateAsync: async (_input?: unknown) => returnValue as TData,
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    reset: () => {},
  };
}

// ── Mock trpc object ───────────────────────────────────────────────────────
export const trpc = {
  useUtils: () => ({
    auth: {
      me: {
        setData: () => {},
        invalidate: async () => {},
      },
    },
  }),

  auth: {
    me: {
      useQuery: () => mockQuery(mockUser),
    },
    logout: {
      useMutation: (opts?: { onSuccess?: () => void }) =>
        mockMutation<{ success: true }>({ success: true }),
    },
  },

  demo: {
    seed: {
      useMutation: (opts?: { onSuccess?: (data: { productCount: number; videoCount: number; scriptCount: number }) => void; onError?: (err: Error) => void }) =>
        mockMutation({ productCount: 3, videoCount: 5, scriptCount: 9 }),
    },
    products: {
      useQuery: () => mockQuery(mockProducts),
    },
  },

  dashboard: {
    overview: {
      useQuery: () => mockQuery(mockOverview),
    },
    videos: {
      useQuery: () => mockQuery(mockVideos),
    },
  },

  deconstruct: {
    scripts: {
      useQuery: (_input?: unknown, _opts?: unknown) => mockQuery(mockScripts),
    },
    analyze: {
      useMutation: (opts?: { onSuccess?: (data: unknown) => void; onError?: (err: Error) => void }) =>
        mockMutation({
          hook: "你还在用错方法美白吗？",
          pain: "花了几千块，效果全无",
          cta: "点击链接，28天见证蜕变",
          structure: "痛点 → 解决方案 → 社会证明 → CTA",
        }),
    },
  },

  ads: {
    list: {
      useQuery: () => mockQuery(mockAds),
    },
    triggerAuto: {
      useMutation: (opts?: { onSuccess?: (data: unknown) => void; onError?: (err: Error) => void }) =>
        mockMutation({
          id: 3,
          name: "Spark Ads · 自动投流-Demo",
          status: "active",
          budget: 500,
          spent: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
        }),
    },
  },

  // Provider component (no-op wrapper)
  Provider: ({ children }: { client?: unknown; queryClient?: unknown; children: React.ReactNode }) => children,
};
