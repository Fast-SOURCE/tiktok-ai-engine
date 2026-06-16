import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Database, Rocket, Sparkles, LineChart, Zap, Cpu } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const seedMutation = trpc.demo.seed.useMutation({
    onSuccess: data => {
      toast.success(
        `演示数据已就绪 · ${data.productCount} 商品 / ${data.videoCount} 视频 / ${data.scriptCount} 脚本`
      );
    },
    onError: err => toast.error(`初始化失败：${err.message}`),
  });

  const modules = [
    {
      icon: Sparkles,
      title: "爆款解构与脚本生成",
      desc: "粘贴竞品视频链接，AI 实时拆解钩子 / 痛点 / CTA 三维结构，并自动生成 3 个差异化脚本变体。",
      to: "/deconstruct",
      tag: "Scene 01",
      color: "from-primary/30 to-primary/0",
    },
    {
      icon: LineChart,
      title: "视频数据看板与归因",
      desc: "12 条视频核心指标全景展示，AI 一键诊断低 GPM 视频，输出根因 + 优化建议 + 预期提升。",
      to: "/dashboard",
      tag: "Scene 02",
      color: "from-accent/30 to-accent/0",
    },
    {
      icon: Rocket,
      title: "高潜视频自动投流",
      desc: "GPM 实时监控，突破阈值自动调用 TikTok Ads MCP 创建 Spark Ads 计划，全流程零人工。",
      to: "/auto-ads",
      tag: "Scene 03",
      color: "from-chart-3/30 to-chart-3/0",
    },
  ];

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/50 backdrop-blur p-10 mb-10">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-accent/20 blur-3xl pointer-events-none" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 bg-primary/10 text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-6">
              <Cpu className="h-3 w-3" />
              <span>Data-Driven AI Content Self-Evolution Engine</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
              不是更快的视频生成器，
              <br />
              是<span className="text-glow-cyan text-primary"> 更懂转化算法 </span>
              的<span className="text-glow-magenta text-accent"> AI 编导 </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mb-8 leading-relaxed">
              通过「爆款解构 → 数据归因 → 自动投流」闭环，把 TikTok 内容生产从玄学创作升级为可复制、可优化、可放大的科学引擎。
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/deconstruct">
                <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan">
                  开始拆解爆款 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                <Database className="h-4 w-4" />
                {seedMutation.isPending ? "初始化中..." : "一键初始化演示数据"}
              </Button>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-8 border-t border-border/60">
              {[
                { v: "12×", k: "ROI 提升" },
                { v: "$2", k: "单条视频成本" },
                { v: "15%", k: "爆款命中率" },
                { v: "0", k: "人工投流操作" },
              ].map(s => (
                <div key={s.k}>
                  <div className="text-3xl font-bold font-display text-glow-cyan text-primary">
                    {s.v}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono uppercase tracking-wider">
                    {s.k}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modules */}
        <div className="grid gap-5 md:grid-cols-3">
          {modules.map(m => {
            const Icon = m.icon;
            return (
              <Link href={m.to} key={m.to}>
                <Card className="relative overflow-hidden border-border/60 bg-card/60 backdrop-blur p-6 cursor-pointer h-full group hover:border-primary/50 transition-all duration-300 hover:-translate-y-1">
                  <div
                    className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${m.color} pointer-events-none`}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/40 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        {m.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {m.desc}
                    </p>
                    <div className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                      进入模块
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Footer hint */}
        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
          <Zap className="h-3 w-3 text-primary" />
          首次访问请先点击「一键初始化演示数据」以填充真实演示数据
        </div>
      </div>
    </AppShell>
  );
}
