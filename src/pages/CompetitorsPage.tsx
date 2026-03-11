import { useMemo } from "react";
import { AlertTriangle, TrendingDown, Building2, ArrowRight } from "lucide-react";
import feedbackData from "@/data/feedback.json";
import { translateTag, translateGroup } from "@/lib/translations";
import DashboardSidebar from "@/components/DashboardSidebar";

interface FeedbackItem {
  type: string;
  group: string;
  tag: string;
  count: number;
  longDescription: string;
  children: { count: number; long_description: string }[];
}

const data = feedbackData as FeedbackItem[];

const COMPETITOR_KEYWORDS = [
  "compar", "concurrent", "compétit", "autre casino", "autres casino",
  "ailleurs", "rival", "vegas", "rival palace", "auroria",
  "fortuna", "autre établissement", "autres établissement",
  "d'autres", "étrangers", "non-affilié",
];

function matchesCompetitor(text: string): boolean {
  const lower = text.toLowerCase();
  return COMPETITOR_KEYWORDS.some((kw) => lower.includes(kw));
}

const CompetitorsPage = () => {
  const analysis = useMemo(() => {
    const competitorItems: {
      tag: string;
      group: string;
      type: string;
      count: number;
      description: string;
      parentTag: string;
      parentGroup: string;
    }[] = [];

    // Also track parent-level mentions
    const parentMentions: {
      tag: string;
      group: string;
      type: string;
      count: number;
      longDescription: string;
      children: typeof competitorItems;
    }[] = [];

    data.forEach((item) => {
      const matchingChildren = item.children
        .filter((c) => matchesCompetitor(c.long_description))
        .map((c) => ({
          tag: item.tag,
          group: item.group,
          type: item.type,
          count: c.count,
          description: c.long_description,
          parentTag: item.tag,
          parentGroup: item.group,
        }));

      const parentMatches = matchesCompetitor(item.longDescription);

      if (matchingChildren.length > 0 || parentMatches) {
        competitorItems.push(...matchingChildren);
        parentMentions.push({
          tag: item.tag,
          group: item.group,
          type: item.type,
          count: matchingChildren.reduce((s, c) => s + c.count, 0) || item.count,
          longDescription: item.longDescription,
          children: matchingChildren,
        });
      }
    });

    const totalMentions = competitorItems.reduce((s, c) => s + c.count, 0);
    const negativeMentions = competitorItems
      .filter((c) => c.type.includes("Irritant"))
      .reduce((s, c) => s + c.count, 0);
    const positiveMentions = totalMentions - negativeMentions;

    // Extract named competitors
    const competitorNames = new Map<string, number>();
    competitorItems.forEach((c) => {
      const lower = c.description.toLowerCase();
      if (lower.includes("rival palace")) {
        competitorNames.set("Rival Palace", (competitorNames.get("Rival Palace") || 0) + c.count);
      }
      if (lower.includes("vegas") || lower.includes("las vegas")) {
        competitorNames.set("Las Vegas", (competitorNames.get("Las Vegas") || 0) + c.count);
      }
      if (lower.includes("auroria")) {
        competitorNames.set("Auroria", (competitorNames.get("Auroria") || 0) + c.count);
      }
    });

    // Group by theme
    const byTheme = new Map<string, { pos: number; neg: number; items: typeof competitorItems }>();
    competitorItems.forEach((c) => {
      const key = c.tag;
      const existing = byTheme.get(key) || { pos: 0, neg: 0, items: [] };
      if (c.type.includes("apprécié")) existing.pos += c.count;
      else existing.neg += c.count;
      existing.items.push(c);
      byTheme.set(key, existing);
    });
    const themeBreakdown = [...byTheme.entries()]
      .map(([theme, v]) => ({ theme, ...v, total: v.pos + v.neg }))
      .sort((a, b) => b.total - a.total);

    return {
      totalMentions,
      negativeMentions,
      positiveMentions,
      competitorNames: [...competitorNames.entries()].sort((a, b) => b[1] - a[1]),
      themeBreakdown,
      parentMentions: parentMentions.sort((a, b) => b.count - a.count),
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-3">
          <div />
        </header>

        <main className="px-8 py-6 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">Competitor Mentions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Feedback where customers compare your casino to competitors
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total Competitor Mentions</p>
              <p className="text-2xl font-semibold font-mono text-foreground">{analysis.totalMentions.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Unfavorable Comparisons</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold font-mono text-destructive">{analysis.negativeMentions.toLocaleString()}</p>
                <span className="text-xs text-destructive">
                  {((analysis.negativeMentions / analysis.totalMentions) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Favorable Comparisons</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-semibold font-mono text-primary">{analysis.positiveMentions.toLocaleString()}</p>
                <span className="text-xs text-primary">
                  {((analysis.positiveMentions / analysis.totalMentions) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Named competitors */}
          {analysis.competitorNames.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5 mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Named Competitors
              </h3>
              <div className="flex flex-wrap gap-3">
                {analysis.competitorNames.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{count} mentions</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By theme */}
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              Breakdown by Theme
            </h3>
            <div className="space-y-3">
              {analysis.themeBreakdown.map((theme) => (
                <div key={theme.theme} className="flex items-center gap-4">
                  <span className="text-sm text-foreground w-40 truncate">{translateTag(theme.theme)}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
                      {theme.pos > 0 && (
                        <div
                          className="h-full"
                          style={{
                            width: `${(theme.pos / theme.total) * 100}%`,
                            background: "hsl(var(--chart-positive))",
                          }}
                        />
                      )}
                      {theme.neg > 0 && (
                        <div
                          className="h-full"
                          style={{
                            width: `${(theme.neg / theme.total) * 100}%`,
                            background: "hsl(var(--chart-negative))",
                          }}
                        />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono w-12 text-right">
                      {theme.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed mentions */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              All Competitor Mentions
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {analysis.parentMentions.map((item, i) => (
                <div key={i} className="border-b border-border pb-3 last:border-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${
                      item.type.includes("apprécié")
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {item.type.includes("apprécié") ? "Favorable" : "Unfavorable"}
                    </span>
                    <span className="text-xs font-medium text-foreground">{translateTag(item.tag)}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{translateGroup(item.group)}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-auto">{item.count}</span>
                  </div>
                  {item.children.map((child, j) => (
                    <p key={j} className="text-xs text-muted-foreground ml-4 leading-relaxed">
                      <span className="font-mono text-[11px] text-foreground mr-1.5">{child.count}</span>
                      {child.description}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompetitorsPage;
