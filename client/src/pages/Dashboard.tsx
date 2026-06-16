import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSseStream } from "@/hooks/useSseStream";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Radio,
  Stethoscope,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur p-5 relative overflow-hidden">
      <div className={`absolute top-0 right-0 h-24 w-24 rounded-full blur-3xl opacity-30 ${color}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-3xl font-bold font-display text-glow-cyan text-primary">
          {value}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 font-mono">{sub}</div>
      </div>
    </Card>
  );
}

function DiagnosisDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  videoId: number | null;
  videoTitle: string;
}) {
  const sse = useSseStream();

  // Kick off the SSE stream once when the dialog is first opened with a video.
  useEffect(() => {
    if (open && videoId && sse.state === "idle") {
      sse.start("/api/stream/diagnose", { videoId });
    }
  }, [open, videoId, sse]);

  const handleOpenChange = (v: boolean) => {
    if (!v) sse.reset();
    onOpenChange(v);
  };

  const isStreaming = sse.state === "streaming";
  const empty = sse.text.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl bg-card/95 backdrop-blur border-primary/40 glow-cyan">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span>AI 归因诊断 · {videoTitle}</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              <Radio className={`h-3 w-3 ${isStreaming ? "animate-pulse text-primary" : "text-chart-3"}`} />
              {isStreaming ? "SSE LIVE" : sse.state === "done" ? "COMPLETED" : sse.state === "error" ? "ERROR" : "WAITING"}
            </span>
          </DialogTitle>
        </DialogHeader>

        {empty && isStreaming ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground font-mono">
              AI Analyst 正在接收首个 token...
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] text-muted-foreground font-mono">
              <span>· 拉取核心指标</span>
              <span>· 对比基线水位</span>
              <span>· 生成优化方案</span>
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:tracking-wider prose-h2:text-primary prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-strong:text-accent prose-li:my-0.5">
              <Streamdown>{sse.text}</Streamdown>
              {isStreaming && <span className="caret-blink ml-0.5" />}
            </div>
            {sse.state === "error" && (
              <div className="mt-3 text-xs text-destructive font-mono">{sse.error}</div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function DashboardPage() {
  const overviewQuery = trpc.dashboard.overview.useQuery();
  const videosQuery = trpc.dashboard.videos.useQuery();

  const [diagOpen, setDiagOpen] = useState(false);
  const [diagVideo, setDiagVideo] = useState<{ id: number; title: string } | null>(null);

  const videos = videosQuery.data ?? [];
  const overview = overviewQuery.data;

  const gpmTrend = videos
    .slice()
    .sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime())
    .map((v, i) => ({
      name: `V${i + 1}`,
      gpm: v.gpm,
      revenue: v.revenue,
    }));

  const ratesData = videos.slice(0, 8).map(v => ({
    name: v.title.split("·")[0]?.trim().slice(0, 6) ?? `V${v.id}`,
    completion: Math.round(v.completionRate * 100),
    engagement: Math.round(v.engagementRate * 1000) / 10,
  }));

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent mb-2">
            Scene 02 · Performance Dashboard
          </div>
          <h1 className="text-3xl font-bold mb-2">视频数据看板与 AI 诊断</h1>
          <p className="text-muted-foreground">
            12 条视频核心指标实时监控，点击 GPM 偏低的视频可触发 AI 归因诊断。
          </p>
        </div>

        {/* KPI Strip */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard
            icon={Eye}
            label="总播放量"
            value={overview ? formatNumber(overview.totalViews) : "—"}
            sub="累计 7 日"
            color="bg-primary/40"
          />
          <KpiCard
            icon={Activity}
            label="平均完播率"
            value={overview ? `${(overview.avgCompletion * 100).toFixed(1)}%` : "—"}
            sub="基线 35%"
            color="bg-accent/40"
          />
          <KpiCard
            icon={TrendingUp}
            label="平均 GPM"
            value={overview ? `$${overview.avgGpm.toFixed(2)}` : "—"}
            sub="基线 $30"
            color="bg-chart-3/40"
          />
          <KpiCard
            icon={DollarSign}
            label="累计销售额"
            value={overview ? `$${formatNumber(overview.totalRevenue)}` : "—"}
            sub={`${overview?.videoCount ?? 0} 条视频`}
            color="bg-chart-4/40"
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/70 backdrop-blur p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">GPM 时序趋势</h3>
                <p className="text-[11px] text-muted-foreground font-mono">
                  按发布时间顺序展示 12 条视频 GPM
                </p>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary">
                LIVE
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpmTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 260 / 0.4)" />
                  <XAxis dataKey="name" stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.17 0.025 260)",
                      border: "1px solid oklch(0.78 0.18 200 / 0.4)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="gpm"
                    stroke="oklch(0.78 0.18 200)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.78 0.18 200)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/70 backdrop-blur p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">完播率 vs 互动率</h3>
              <p className="text-[11px] text-muted-foreground font-mono">
                Top 8 视频对比
              </p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 260 / 0.4)" />
                  <XAxis dataKey="name" stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="oklch(0.68 0.03 250)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.17 0.025 260)",
                      border: "1px solid oklch(0.78 0.18 200 / 0.4)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="completion" fill="oklch(0.78 0.18 200)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="engagement" fill="oklch(0.7 0.25 340)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Video table */}
        <Card className="border-border/60 bg-card/70 backdrop-blur overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">12 条视频实时表现</h3>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                点击「AI 诊断」可对低 GPM 视频生成根因分析报告
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-5 py-3 font-normal">视频</th>
                  <th className="text-right px-3 py-3 font-normal">播放量</th>
                  <th className="text-right px-3 py-3 font-normal">5s 完播</th>
                  <th className="text-right px-3 py-3 font-normal">互动率</th>
                  <th className="text-right px-3 py-3 font-normal">GPM</th>
                  <th className="text-right px-3 py-3 font-normal">销售额</th>
                  <th className="text-center px-5 py-3 font-normal">状态</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(v => {
                  const isUnder = v.status === "underperform";
                  const isWinner = v.status === "winner";
                  return (
                    <tr
                      key={v.id}
                      onClick={() => {
                        if (isUnder) {
                          setDiagVideo({ id: v.id, title: v.title });
                          setDiagOpen(true);
                        }
                      }}
                      className={`border-t border-border/40 transition-colors ${
                        isUnder
                          ? "cursor-pointer hover:bg-destructive/10"
                          : "hover:bg-secondary/20"
                      }`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.thumbnailUrl ?? ""}
                            alt=""
                            className="h-10 w-10 rounded object-cover bg-secondary shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-foreground truncate max-w-md">
                              {v.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono truncate">
                              {v.hook}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-3 py-3 font-mono text-xs">
                        {formatNumber(v.views)}
                      </td>
                      <td
                        className={`text-right px-3 py-3 font-mono text-xs ${
                          v.completionRate >= 0.5
                            ? "text-chart-3"
                            : v.completionRate < 0.25
                              ? "text-destructive"
                              : "text-foreground"
                        }`}
                      >
                        {(v.completionRate * 100).toFixed(1)}%
                      </td>
                      <td className="text-right px-3 py-3 font-mono text-xs">
                        {(v.engagementRate * 100).toFixed(1)}%
                      </td>
                      <td
                        className={`text-right px-3 py-3 font-mono text-xs font-semibold ${
                          v.gpm >= 50
                            ? "text-chart-3"
                            : v.gpm < 15
                              ? "text-destructive"
                              : "text-foreground"
                        }`}
                      >
                        ${v.gpm.toFixed(1)}
                      </td>
                      <td className="text-right px-3 py-3 font-mono text-xs">
                        ${v.revenue.toFixed(0)}
                      </td>
                      <td className="text-center px-5 py-3">
                        {isWinner ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-chart-3/15 text-chart-3 border border-chart-3/40">
                            <CheckCircle2 className="h-3 w-3" />
                            WINNER
                          </span>
                        ) : isUnder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-destructive/15 text-destructive border border-destructive/40">
                            <Stethoscope className="h-3 w-3" />
                            AI 诊断
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-secondary/40 text-muted-foreground border border-border/60">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <DiagnosisDialog
          open={diagOpen}
          onOpenChange={setDiagOpen}
          videoId={diagVideo?.id ?? null}
          videoTitle={diagVideo?.title ?? ""}
        />
      </div>
    </AppShell>
  );
}
