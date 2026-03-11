import { useState, useCallback } from "react";
import { Lightbulb, RefreshCw, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import DashboardSidebar from "@/components/DashboardSidebar";
import { generateDataSummary } from "@/lib/dataSummary";

const STRATEGY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/strategy`;
const dataSummary = generateDataSummary();

const StrategyPage = () => {
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = useCallback(async () => {
    setIsLoading(true);
    setInsights("");
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
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              soFar += content;
              setInsights(soFar);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      setInsights(`Error: ${e.message}`);
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
            <p className="text-sm text-muted-foreground mt-0.5">AI-powered strategic recommendations from feedback data</p>
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

        <main className="px-8 py-6 max-w-4xl">
          {!hasGenerated ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">Strategic Analysis</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Generate AI-powered insights including gap analysis, quick wins, competitive differentiators, and priority actions based on your complete feedback dataset.
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
            <div className="bg-card rounded-xl border border-border p-6">
              {isLoading && !insights && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Analyzing feedback data and generating insights...</span>
                </div>
              )}
              {insights && (
                <div className="prose prose-sm prose-neutral max-w-none [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_p]:text-sm [&_li]:text-sm [&_strong]:text-foreground">
                  <ReactMarkdown>{insights}</ReactMarkdown>
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
