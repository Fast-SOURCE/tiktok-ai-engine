import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTypewriter } from "@/hooks/useTypewriter";
import { useSseStream } from "@/hooks/useSseStream";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import {
  CheckCircle2,
  Loader2,
  Play,
  Radio,
  Sparkles,
  Film,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";



function ScriptCard({
  variant,
  strategy,
  hook,
  pain,
  cta,
  content,
  index,
}: {
  variant: string;
  strategy: string;
  hook: string | null;
  pain: string | null;
  cta: string | null;
  content: string;
  index: number;
}) {
  // Stagger reveal so each card looks independently generated
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), index * 700);
    return () => clearTimeout(t);
  }, [index]);

  const { shown, done } = useTypewriter(started ? content : "", 12, true);

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary/60 text-secondary-foreground">
            VARIANT {variant.toUpperCase()}
          </span>
          <span className="text-sm font-semibold">{strategy}</span>
        </div>
        {!started ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : done ? (
          <CheckCircle2 className="h-4 w-4 text-chart-3" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
      </div>
      <pre className="font-mono text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap min-h-[180px]">
        {started ? shown : "等待生成..."}
        {started && !done && <span className="caret-blink" />}
      </pre>
      {done && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-[11px]">
          <div>
            <div className="text-muted-foreground">钩子</div>
            <div className="text-primary truncate">{hook}</div>
          </div>
          <div>
            <div className="text-muted-foreground">痛点</div>
            <div className="text-accent truncate">{pain}</div>
          </div>
          <div>
            <div className="text-muted-foreground">CTA</div>
            <div className="text-chart-3 truncate">{cta}</div>
          </div>
        </div>
      )}
    </Card>
  );
}

function VideoPreviewCard({
  variant,
  strategy,
  thumbnailUrl,
  delay,
}: {
  variant: string;
  strategy: string;
  thumbnailUrl: string;
  delay: number;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <Card className="relative overflow-hidden border-border/60 bg-card/70 group">
      <div className="aspect-[9/16] relative overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={strategy}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        {!ready ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-xs text-muted-foreground font-mono">
                Seedance 2.0 渲染中...
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-14 w-14 rounded-full bg-primary/90 flex items-center justify-center glow-cyan">
              <Play className="h-6 w-6 text-background fill-background" />
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background/80 backdrop-blur text-primary border border-primary/30">
            {variant.toUpperCase()}
          </span>
        </div>
        {ready && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-chart-3/20 backdrop-blur text-chart-3 border border-chart-3/40 flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" />
              READY
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-sm font-semibold mb-1">{strategy}</div>
          <div className="text-[10px] text-muted-foreground font-mono">
            1080×1920 · 30s · MP4
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function DeconstructPage() {
  const [productCode, setProductCode] = useState("GLOWMAX");
  const [videoUrl, setVideoUrl] = useState("https://www.tiktok.com/@beautyguru/video/7234561234567891234");
  const [scriptStage, setScriptStage] = useState(false);
  const [videoStage, setVideoStage] = useState(false);

  const productsQuery = trpc.demo.products.useQuery();
  const scriptsQuery = trpc.deconstruct.scripts.useQuery(
    { productCode },
    { enabled: scriptStage }
  );

  // Real Server-Sent Events stream from Express endpoint /api/stream/deconstruct
  const sse = useSseStream();

  // When the SSE finishes, automatically reveal scripts then videos.
  useEffect(() => {
    if (sse.state === "done") {
      const t1 = setTimeout(() => setScriptStage(true), 800);
      const t2 = setTimeout(() => setVideoStage(true), 5000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [sse.state]);

  const handleAnalyze = () => {
    if (!videoUrl) {
      toast.error("请先填入视频链接");
      return;
    }
    setScriptStage(false);
    setVideoStage(false);
    sse.start("/api/stream/deconstruct", { videoUrl, productCode });
  };

  const products = productsQuery.data ?? [];
  const scripts = scriptsQuery.data ?? [];
  const selectedProduct = products.find(p => p.code === productCode);

  const isStreaming = sse.state === "streaming";
  const hasContent = sse.text.length > 0;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-2">
            Scene 01 · Deconstruction
          </div>
          <h1 className="text-3xl font-bold mb-2">爆款视频解构与脚本生成</h1>
          <p className="text-muted-foreground">
            粘贴竞品视频链接 + 选择目标商品，AI 实时拆解爆款基因并生成 3 个差异化带货脚本，最终输出可投放视频。
          </p>
        </div>

        {/* Input panel */}
        <Card className="border-border/60 bg-card/70 backdrop-blur p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_320px_auto] items-end">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                竞品视频链接
              </Label>
              <Input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@username/video/..."
                className="font-mono text-sm bg-input/60"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                目标商品
              </Label>
              <Select value={productCode} onValueChange={setProductCode}>
                <SelectTrigger className="bg-input/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isStreaming}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan gap-2"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  SSE 流式拆解中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  开始 AI 拆解
                </>
              )}
            </Button>
          </div>
          {selectedProduct && (
            <div className="mt-4 pt-4 border-t border-border/60 flex items-start gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
                卖点
              </span>
              <p className="text-xs text-foreground/80 flex-1 leading-relaxed">
                {selectedProduct.sellingPoints}
              </p>
            </div>
          )}
        </Card>

        {/* Stage 1: Real-time SSE deconstruction stream */}
        {(isStreaming || hasContent || sse.state === "error") && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border/60" />
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary px-3 flex items-center gap-2">
                <Radio className={`h-3 w-3 ${isStreaming ? "animate-pulse text-primary" : "text-chart-3"}`} />
                STAGE 01 · 爆款基因解构 · {isStreaming ? "SSE LIVE" : sse.state === "done" ? "COMPLETED" : "ERROR"}
              </div>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <Card className="border-border/60 bg-card/70 backdrop-blur p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span className={`h-1.5 w-1.5 rounded-full ${isStreaming ? "bg-primary animate-pulse" : "bg-chart-3"}`} />
                /api/stream/deconstruct · POST · text/event-stream
              </div>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-mono prose-headings:tracking-wider prose-h2:text-primary prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-strong:text-accent">
                <Streamdown>{sse.text || "等待 LLM 首个 token..."}</Streamdown>
                {isStreaming && <span className="caret-blink ml-0.5" />}
              </div>
              {sse.state === "error" && (
                <div className="mt-3 text-xs text-destructive font-mono">{sse.error}</div>
              )}
            </Card>
          </section>
        )}

        {/* Stage 2: Script generation */}
        {scriptStage && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border/60" />
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-accent px-3">
                STAGE 02 · 3 个差异化脚本变体生成
              </div>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {scripts.map((s, i) => (
                <ScriptCard
                  key={s.id}
                  variant={s.variant}
                  strategy={s.strategy}
                  hook={s.hook}
                  pain={s.pain}
                  cta={s.cta}
                  content={s.content}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* Stage 3: Video preview */}
        {videoStage && (
          <section className="pb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border/60" />
              <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-chart-3 px-3 flex items-center gap-2">
                <Film className="h-3 w-3" />
                STAGE 03 · DEMO 视频自动生成完成
              </div>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {scripts.map((s, i) => (
                <VideoPreviewCard
                  key={s.id}
                  variant={s.variant}
                  strategy={s.strategy}
                  thumbnailUrl={
                    [
                      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80",
                      "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&q=80",
                      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
                    ][i % 3]
                  }
                  delay={i * 1200 + 600}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
