import { Link, useLocation } from "wouter";
import {
  Sparkles,
  LineChart,
  Rocket,
  Activity,
  Cpu,
} from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "爆款解构",
    path: "/deconstruct",
    icon: Sparkles,
    description: "AI 拆解 + 脚本生成",
  },
  {
    label: "数据看板",
    path: "/dashboard",
    icon: LineChart,
    description: "12 条视频归因诊断",
  },
  {
    label: "自动投流",
    path: "/auto-ads",
    icon: Rocket,
    description: "高潜视频自动放大",
  },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-tech-gradient text-foreground">
      <div className="bg-grid min-h-screen flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-72 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur sticky top-0 h-screen">
          <Link href="/">
            <div className="flex items-center gap-3 px-6 h-20 border-b border-sidebar-border cursor-pointer">
              <div className="relative">
                <div className="absolute inset-0 rounded-md blur-md bg-primary/40" />
                <div className="relative h-9 w-9 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-background" />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  TIKTOK AI ENGINE
                </span>
                <span className="font-display font-semibold text-base text-glow-cyan">
                  自进化引擎
                </span>
              </div>
            </div>
          </Link>

          <nav className="flex-1 px-4 py-6 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground px-3 mb-3">
              核心模块
            </p>
            {navItems.map(item => {
              const active = location === item.path;
              const Icon = item.icon;
              return (
                <Link href={item.path} key={item.path}>
                  <div
                    className={cn(
                      "group flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer transition-all duration-200",
                      active
                        ? "bg-primary/10 border border-primary/40 glow-cyan"
                        : "border border-transparent hover:bg-sidebar-accent/40 hover:border-sidebar-border"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 mt-0.5 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          active ? "text-primary" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="px-4 pb-6">
            <div className="rounded-lg border border-border/60 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  System Online
                </span>
              </div>
              <div className="text-sm text-foreground/90">
                MCP Bridge Connected
              </div>
              <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                tiktok-ads-mcp · v2026.05
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {/* Top status bar */}
          <header className="h-14 border-b border-border/60 bg-background/40 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-6">
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>realtime stream · {new Date().toLocaleString("zh-CN", { hour12: false })}</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/30 text-primary font-mono">
                MVP · v0.1
              </div>
              <div className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-accent font-mono">
                STRATEGIC DEMO
              </div>
            </div>
          </header>
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
