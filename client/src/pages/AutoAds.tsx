import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  Rocket,
  Target,
  Wallet,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { toast } from "sonner";

const GPM_THRESHOLD = 50;

type GpmPoint = { t: number; gpm: number; label: string };

function buildSeed(): GpmPoint[] {
  // 16 历史点，趋势上升但仍在阈值附近徘徊
  const now = Date.now();
  const seed: GpmPoint[] = [];
  let v = 28;
  for (let i = 15; i >= 0; i--) {
    v += Math.random() * 2.6 - 0.4;
    seed.push({
      t: now - i * 4000,
      gpm: Math.max(20, +v.toFixed(2)),
      label: new Date(now - i * 4000).toLocaleTimeString("zh-CN", { hour12: false }).slice(3),
    });
  }
  return seed;
}

export default function AutoAdsPage() {
  const overviewQuery = trpc.dashboard.overview.useQuery();
  const videosQuery = trpc.dashboard.videos.useQuery();
  const adsQuery = trpc.ads.list.useQuery();

  const triggerMutation = trpc.ads.triggerAuto.useMutation({
    onSuccess: data => {
      setCampaign(data);
      setAlertOpen(true);
      void adsQuery.refetch();
    },
    onError: err => toast.error(`投流创建失败：${err.message}`),
  });

  const winnerVideo = useMemo(() => {
    const list = videosQuery.data ?? [];
    return list.find(v => v.status === "winner") ?? list[0];
  }, [videosQuery.data]);

  const [series, setSeries] = useState<GpmPoint[]>(buildSeed);
  const [running, setRunning] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const triggeredRef = useRef(false);

  const currentGpm = series[series.length - 1]?.gpm ?? 0;

  // Real-time push effect
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeries(prev => {
        const last = prev[prev.length - 1];
        const accel = last.gpm < 40 ? 1.6 : last.gpm < 50 ? 2.4 : 1.2;
        const noise = Math.random() * 1.2 - 0.4;
        const next = +(last.gpm + accel + noise).toFixed(2);
        const point: GpmPoint = {
          t: Date.now(),
          gpm: next,
          label: new Date().toLocaleTimeString("zh-CN", { hour12: false }).slice(3),
        };
        const arr = [...prev.slice(-23), point];
        // Auto-trigger when crossing threshold
        if (next >= GPM_THRESHOLD && !triggeredRef.current && winnerVideo) {
          triggeredRef.current = true;
          triggerMutation.mutate({ videoId: winnerVideo.id, currentGpm: next });
          setRunning(false);
        }
        return arr;
      });
    }, 850);
    return () => clearInterval(interval);
  }, [running, winnerVideo, triggerMutation]);

  const handleStart = () => {
    if (!winnerVideo) {
      toast.error("请先初始化演示数据");
      return;
    }
    triggeredRef.current = false;
    setSeries(buildSeed());
    setCampaign(null);
    setAlertOpen(false);
    setRunning(true);
  };

  const handleStop = () => setRunning(false);

  const ads = adsQuery.data ?? [];
  const overview = overviewQuery.data;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-chart-3 mb-2">
            Scene 03 · Auto Ads Pipeline
          </div>
          <h1 className="text-3xl font-bold mb-2">高潜视频自动投流引擎</h1>
          <p className="text-muted-foreground">
            实时监控 GPM，突破 ${GPM_THRESHOLD} 阈值时自动调用 TikTok Ads MCP 创建 Spark Ads 计划，全程零人工。
          </p>
        </div>

        {/* Status strip */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/60 bg-card/70 backdrop-blur p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              监控视频
            </div>
            <div className="text-sm font-semibold truncate">
              {winnerVideo?.title ?? "—"}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              {winnerVideo?.hook ?? ""}
            </div>
          </Card>
          <Card className="border-border/60 bg-card/70 backdrop-blur p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 rounded-full blur-3xl opacity-30 bg-primary/40" />
            <div className="relative">
              <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                实时 GPM
              </div>
              <div
                className={`text-3xl font-bold font-display ${
                  currentGpm >= GPM_THRESHOLD ? "text-chart-3" : "text-primary"
                } text-glow-cyan`}
              >
                ${currentGpm.toFixed(2)}
              </div>
              <div className="text-[11px] text-muted-foreground font-mono mt-1">
                阈值 ${GPM_THRESHOLD}.00
              </div>
            </div>
          </Card>
          <Card className="border-border/60 bg-card/70 backdrop-blur p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              MCP 通道
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-chart-3" />
              <span className="text-sm font-semibold text-chart-3">CONNECTED</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              tiktok-ads-mcp · v2026.05
            </div>
          </Card>
          <Card className="border-border/60 bg-card/70 backdrop-blur p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              已创建广告
            </div>
            <div className="text-3xl font-bold font-display text-accent text-glow-magenta">
              {ads.length}
            </div>
            <div className="text-[11px] text-muted-foreground font-mono mt-1">
              累计自动投放计划数
            </div>
          </Card>
        </div>

        {/* Live chart + control */}
        <Card className="border-border/60 bg-card/70 backdrop-blur p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-semibold">GPM 实时数据流</h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                来源：TikTok Analytics API · 推送频率 1s
              </p>
            </div>
            <div className="flex items-center gap-2">
              {running ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-chart-3/40 bg-chart-3/10 text-chart-3 text-[11px] font-mono uppercase">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3" />
                  </span>
                  STREAMING
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/60 bg-secondary/40 text-muted-foreground text-[11px] font-mono uppercase">
                  IDLE
                </div>
              )}
              {!running ? (
                <Button
                  onClick={handleStart}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan gap-2"
                >
                  <Play className="h-4 w-4" />
                  开始实时监控
                </Button>
              ) : (
                <Button onClick={handleStop} variant="outline" className="gap-2">
                  暂停
                </Button>
              )}
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gpmFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.78 0.18 200)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 260 / 0.4)" />
                <XAxis dataKey="label" stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                <YAxis
                  stroke="oklch(0.68 0.03 250)"
                  tick={{ fontSize: 11 }}
                  domain={[20, 70]}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.17 0.025 260)",
                    border: "1px solid oklch(0.78 0.18 200 / 0.4)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine
                  y={GPM_THRESHOLD}
                  stroke="oklch(0.7 0.25 340)"
                  strokeDasharray="6 4"
                  label={{
                    value: `阈值 $${GPM_THRESHOLD}`,
                    fill: "oklch(0.7 0.25 340)",
                    fontSize: 11,
                    position: "right",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="gpm"
                  stroke="oklch(0.78 0.18 200)"
                  strokeWidth={2.4}
                  fill="url(#gpmFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ads history */}
        <Card className="border-border/60 bg-card/70 backdrop-blur overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-semibold">自动创建的 Spark Ads 计划</h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              所有计划均通过 MCP 通道由系统自动创建，无人工介入
            </p>
          </div>
          {ads.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground font-mono">
              暂无投流记录，点击「开始实时监控」让 GPM 突破阈值即可自动创建
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {ads.map(c => (
                <div key={c.id} className="px-5 py-4 grid md:grid-cols-[1fr_120px_140px_140px_120px] gap-3 items-center">
                  <div>
                    <div className="text-sm font-mono text-primary truncate">
                      {c.campaignName}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {new Date(c.createdAt).toLocaleString("zh-CN", { hour12: false })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">
                      日预算
                    </div>
                    <div className="text-sm font-semibold">${c.dailyBudget}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">
                      触发 GPM
                    </div>
                    <div className="text-sm font-semibold text-chart-3">
                      ${c.triggerGpm.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted-foreground font-mono uppercase">
                      策略
                    </div>
                    <div className="text-xs font-mono">{c.bidStrategy}</div>
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-chart-3/15 text-chart-3 border border-chart-3/40">
                      <CheckCircle2 className="h-3 w-3" />
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Threshold breakthrough alert - 全屏覆盖 */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent
          className="!max-w-none !w-screen !h-screen !rounded-none !top-0 !left-0 !translate-x-0 !translate-y-0 bg-background/95 backdrop-blur-xl border-0 p-0 overflow-y-auto flex flex-col items-center justify-center bg-tech-gradient"
        >
          <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
          <div className="relative w-full max-w-3xl mx-auto px-6 py-12">
          <div className="rounded-2xl border border-accent/60 glow-magenta overflow-hidden">
          <div className="bg-gradient-to-br from-accent/30 via-primary/20 to-transparent p-6 border-b border-accent/40">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-accent/20 border border-accent/60 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-accent animate-pulse" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent">
                  THRESHOLD BREACH · AUTO ACTION TAKEN
                </div>
                <div className="text-2xl font-bold font-display text-glow-magenta text-accent">
                  GPM 突破阈值，已自动创建 Spark Ads
                </div>
              </div>
            </div>
            <p className="text-sm text-foreground/90">
              系统检测到 <span className="font-mono text-chart-3">${campaign?.triggerGpm?.toFixed(2)}</span> 突破阈值 ${GPM_THRESHOLD}，无需人工介入，已通过 MCP 通道自动创建 Spark Ads 投流计划：
            </p>
          </div>

          {campaign && (
            <div className="p-6 space-y-4 bg-card/80">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      Campaign Name
                    </span>
                  </div>
                  <div className="text-sm font-mono text-primary truncate">
                    {campaign.campaignName}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-3.5 w-3.5 text-chart-3" />
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      Daily Budget
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-chart-3">
                    ${campaign.dailyBudget}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-3.5 w-3.5 text-accent" />
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      Bid Strategy
                    </span>
                  </div>
                  <div className="text-sm font-mono">{campaign.bidStrategy}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-3.5 w-3.5 text-chart-4" />
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      Trigger GPM
                    </span>
                  </div>
                  <div className="text-sm font-semibold">
                    ${campaign.triggerGpm?.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <div className="text-[10px] font-mono uppercase text-primary mb-2">
                  Audience Targeting
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Age: </span>
                    <span>{campaign.audience?.ageRange}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lookalike: </span>
                    <span>{campaign.audience?.lookalike}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Interests: </span>
                    <span>{campaign.audience?.interests?.join(", ")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Device: </span>
                    <span>{campaign.audience?.deviceTier}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-[11px] font-mono text-muted-foreground">
                  via {campaign.mcpEndpoint}
                </div>
                <Button
                  onClick={() => setAlertOpen(false)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  确认已知晓
                </Button>
              </div>
            </div>
          )}

          {!campaign && (
            <div className="p-12 flex justify-center bg-card/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
