import { useState, useCallback, useMemo } from "react";
import { Lightbulb, RefreshCw, Loader2, AlertTriangle, Zap, Trophy, TrendingUp, Target } from "lucide-react";
import ReactMarkdown from "react-markdown";
import DashboardSidebar from "@/components/DashboardSidebar";
import { generateDataSummary } from "@/lib/dataSummary";

const STRATEGY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategy`;
const dataSummary = generateDataSummary();

const sectionMeta: Record<string, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  "critical gaps": { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  "quick wins": { icon: Zap, color: "text-warning-foreground", bg: "bg-[hsl(var(--warning))]/10" },
  "competitive edge": { icon: Trophy, color: "text-primary", bg: "bg-primary/10" },
  "emerging trends": { icon: TrendingUp, color: "text-[hsl(200,50%,55%)]", bg: "bg-[hsl(200,50%,55%)]/10" },
  "priority actions": { icon: Target, color: "text-foreground", bg: "bg-muted" },
};

function parseSections(raw: string) {
  // Split by h2/h3 headers with emoji
  const headerRegex = /^#{1,3}\s*(🚨|⚡|🏆|📈|🎯)\s*(.+)$/gm;
  const parts: { title: string; key: string; emoji: string; content: string }[] = [];
  let lastIndex = 0;
  let intro = "";
  let match;
  const matches: { index: number; full: string; emoji: string; title: string }[] = [];

  while ((match = headerRegex.exec(raw)) !== null) {
    matches.push({ index: match.index, full: match[0], emoji: match[1], title: match[2].trim() });
  }

  if (matches.length === 0) return { intro: raw, sections: [] };

  intro = raw.slice(0, matches[0].index).trim();

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].full.length;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const content = raw.slice(start, end).trim();
    const key = matches[i].title.toLowerCase().replace(/[^a-z ]/g, "").trim();
    parts.push({ title: matches[i].title, key, emoji: matches[i].emoji, content });
  }

  return { intro, sections: parts };
}

const StrategyPage = () => {
  const [rawInsights, setRawInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const parsed = useMemo(() => parseSections(rawInsights), [rawInsights]);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setRawInsights("");
    setHasGenerated(true);

    let soFar = "";

    try {
      const resp = await fetch(STRATEGY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ dataSummary }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate insights");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const p = JSON.parse(jsonStr);
            const content = p.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              soFar += content;
              setRawInsights(soFar);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setRawInsights(`Error: ${e.message}`);
    }

    setIsLoading(false);
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Strategy & Insights</h1>
            <p className="text-sm text-muted-foreground mt-0.5">AI-powered strategic recommendations</p>
          </div>
          <button
            onClick={generate}
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {hasGenerated ? "Regenerate" : "Generate Insights"}
          </button>
        </header>

        <main className="px-8 py-6 max-w-5xl">
          {!hasGenerated ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">Strategic Analysis</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Generate AI-powered insights including gap analysis, quick wins, competitive differentiators, and priority actions.
              </p>
              <button
                onClick={generate}
                className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Lightbulb className="w-4 h-4" />
                Generate Insights
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Loading state */}
              {isLoading && !rawInsights && (
                <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Analyzing feedback data...</span>
                </div>
              )}

              {/* Executive summary */}
              {parsed.intro && (
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="prose prose-sm prose-neutral max-w-none [&_p]:text-sm [&_strong]:text-foreground [&_p]:my-1">
                    <ReactMarkdown>{parsed.intro}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Section cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {parsed.sections.map((section) => {
                  const meta = Object.entries(sectionMeta).find(([k]) => section.key.includes(k));
                  const Icon = meta?.[1]?.icon || Lightbulb;
                  const iconColor = meta?.[1]?.color || "text-primary";
                  const iconBg = meta?.[1]?.bg || "bg-primary/10";
                  // Priority actions gets full width
                  const isFullWidth = section.key.includes("priority");

                  return (
                    <div
                      key={section.key}
                      className={`bg-card rounded-xl border border-border p-5 ${isFullWidth ? "lg:col-span-2" : ""}`}
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">
                          {section.emoji} {section.title}
                        </h3>
                      </div>
                      <div className="prose prose-sm prose-neutral max-w-none [&_p]:text-sm [&_li]:text-sm [&_strong]:text-foreground [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fallback: raw markdown if no sections parsed yet (streaming) */}
              {rawInsights && parsed.sections.length === 0 && !parsed.intro && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="prose prose-sm prose-neutral max-w-none [&_p]:text-sm [&_li]:text-sm [&_strong]:text-foreground">
                    <ReactMarkdown>{rawInsights}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StrategyPage;
