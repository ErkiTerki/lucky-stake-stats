import { useMemo } from "react";
import { CheckCircle2, XCircle, Building2, ArrowRight, TrendingUp, TrendingDown, Shield, Target } from "lucide-react";
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

// Translate French descriptions to short English insights
function summarizeInsight(descriptions: string[]): string {
  const joined = descriptions.join(" ").toLowerCase();
  if (joined.includes("gain") || joined.includes("paiement") || joined.includes("retour"))
    return "Customers feel payouts and winnings are lower than at competing venues.";
  if (joined.includes("prix") || joined.includes("coût") || joined.includes("cher"))
    return "Pricing is perceived as higher than competitors for similar offerings.";
  if (joined.includes("promotion") || joined.includes("récompens") || joined.includes("offre"))
    return "Promotions and rewards are seen as less generous than competitor programs.";
  if (joined.includes("boisson") || joined.includes("drink") || joined.includes("gratuit"))
    return "Customers expect complimentary drinks like at Las Vegas or Rival Palace.";
  if (joined.includes("machine") || joined.includes("sous"))
    return "Slot machines are perceived as paying less than at other casinos.";
  if (joined.includes("nourriture") || joined.includes("restaurant") || joined.includes("plat"))
    return "Food quality or value is compared unfavorably to other establishments.";
  if (joined.includes("chambre") || joined.includes("hôtel") || joined.includes("séjour"))
    return "Room size or hotel quality compared to other properties.";
  if (joined.includes("service") || joined.includes("personnel"))
    return "Service quality is compared to other venues — can be positive or negative.";
  if (joined.includes("mieux") || joined.includes("meilleur") || joined.includes("supérieur"))
    return "Customers recognize areas where this casino outperforms competitors.";
  if (joined.includes("canada") || joined.includes("grand"))
    return "Customers recognize the casino's scale and prominence in the market.";
  return "Customers draw comparisons with competing establishments on this topic.";
}

const CompetitorsPage = () => {
  const analysis = useMemo(() => {
    type CompItem = { tag: string; group: string; type: string; count: number; description: string };
    const competitorItems: CompItem[] = [];

    const parentMentions: {
      tag: string; group: string; type: string; count: number;
      longDescription: string; children: CompItem[];
    }[] = [];

    data.forEach((item) => {
      const matchingChildren = item.children
        .filter((c) => matchesCompetitor(c.long_description))
        .map((c) => ({
          tag: item.tag, group: item.group, type: item.type,
          count: c.count, description: c.long_description,
        }));
      const parentMatches = matchesCompetitor(item.longDescription);
      if (matchingChildren.length > 0 || parentMatches) {
        competitorItems.push(...matchingChildren);
        parentMentions.push({
          tag: item.tag, group: item.group, type: item.type,
          count: matchingChildren.reduce((s, c) => s + c.count, 0) || item.count,
          longDescription: item.longDescription, children: matchingChildren,
        });
      }
    });

    const totalMentions = competitorItems.reduce((s, c) => s + c.count, 0);
    const negativeMentions = competitorItems.filter((c) => c.type.includes("Irritant")).reduce((s, c) => s + c.count, 0);
    const positiveMentions = totalMentions - negativeMentions;

    // Named competitors
    const competitorNames = new Map<string, { count: number; contexts: string[] }>();
    competitorItems.forEach((c) => {
      const lower = c.description.toLowerCase();
      const addTo = (name: string) => {
        const ex = competitorNames.get(name) || { count: 0, contexts: [] };
        ex.count += c.count;
        if (ex.contexts.length < 3) ex.contexts.push(c.description);
        competitorNames.set(name, ex);
      };
      if (lower.includes("rival palace")) addTo("Rival Palace");
      if (lower.includes("vegas") || lower.includes("las vegas")) addTo("Las Vegas");
      if (lower.includes("auroria")) addTo("Auroria");
    });

    // Strengths vs weaknesses by theme
    const byTheme = new Map<string, { pos: number; neg: number; items: CompItem[] }>();
    competitorItems.forEach((c) => {
      const existing = byTheme.get(c.tag) || { pos: 0, neg: 0, items: [] };
      if (c.type.includes("apprécié")) existing.pos += c.count;
      else existing.neg += c.count;
      existing.items.push(c);
      byTheme.set(c.tag, existing);
    });

    const strengths = [...byTheme.entries()]
      .filter(([, v]) => v.pos > v.neg)
      .map(([theme, v]) => ({ theme, ...v, total: v.pos + v.neg }))
      .sort((a, b) => b.pos - a.pos);

    const weaknesses = [...byTheme.entries()]
      .filter(([, v]) => v.neg >= v.pos)
      .map(([theme, v]) => ({ theme, ...v, total: v.pos + v.neg }))
      .sort((a, b) => b.neg - a.neg);

    return {
      totalMentions, negativeMentions, positiveMentions,
      competitorNames: [...competitorNames.entries()].sort((a, b) => b[1].count - a[1].count),
      strengths, weaknesses, parentMentions: parentMentions.sort((a, b) => b.count - a.count),
    };
  }, []);

  const negPct = analysis.totalMentions > 0 ? ((analysis.negativeMentions / analysis.totalMentions) * 100).toFixed(0) : "0";
  const posPct = analysis.totalMentions > 0 ? ((analysis.positiveMentions / analysis.totalMentions) * 100).toFixed(0) : "0";

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="px-8 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-foreground">Competitive Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Executive summary of how customers perceive you vs. competitors
            </p>
          </div>

          {/* Executive Summary Card */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Executive Summary
            </h2>
            <p className="text-sm text-foreground leading-relaxed mb-4">
              Across <span className="font-semibold font-mono">{analysis.totalMentions.toLocaleString()}</span> customer
              mentions that reference competitors, <span className="font-semibold text-destructive">{negPct}%</span> are
              negative comparisons where customers feel competitors do better, while{" "}
              <span className="font-semibold text-primary">{posPct}%</span> are areas where customers think you outperform.
            </p>

            {/* Sentiment bar */}
            <div className="flex rounded-full overflow-hidden h-3 bg-muted mb-3">
              <div className="h-full transition-all" style={{ width: `${posPct}%`, background: "hsl(var(--chart-positive))" }} />
              <div className="h-full transition-all" style={{ width: `${negPct}%`, background: "hsl(var(--chart-negative))" }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--chart-positive))" }} />
                We do better ({analysis.positiveMentions.toLocaleString()})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--chart-negative))" }} />
                Competitors do better ({analysis.negativeMentions.toLocaleString()})
              </span>
            </div>
          </div>

          {/* Named Competitors */}
          {analysis.competitorNames.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 mb-8">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Most Referenced Competitors
              </h2>
              <div className="space-y-4">
                {analysis.competitorNames.map(([name, info]) => (
                  <div key={name} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-foreground">{name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{info.count} mentions</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {name === "Rival Palace" && "Frequently cited for better promotions, free drinks, and more generous rewards programs."}
                        {name === "Las Vegas" && "Used as the gold standard — customers expect Vegas-level perks like complimentary beverages."}
                        {name === "Auroria" && "Referenced for pricing comparisons, particularly entry fees and gaming costs."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two column: Strengths & Weaknesses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Where we win */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Where We Win
              </h2>
              {analysis.strengths.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No areas with more positive than negative competitor comparisons found.</p>
              ) : (
                <div className="space-y-4">
                  {analysis.strengths.map((s) => (
                    <div key={s.theme}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{translateTag(s.theme)}</span>
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <TrendingUp className="w-3 h-3" />
                          {s.pos} positive
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {summarizeInsight(s.items.filter(i => i.type.includes("apprécié")).map(i => i.description))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Where we lose */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Where Competitors Win
              </h2>
              {analysis.weaknesses.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No negative competitor comparisons found.</p>
              ) : (
                <div className="space-y-4">
                  {analysis.weaknesses.slice(0, 8).map((w) => (
                    <div key={w.theme}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{translateTag(w.theme)}</span>
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <TrendingDown className="w-3 h-3" />
                          {w.neg} negative
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {summarizeInsight(w.items.filter(i => i.type.includes("Irritant")).map(i => i.description))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Key Takeaways */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Key Takeaways
            </h2>
            <div className="space-y-3">
              {[
                { icon: "🎰", text: `Slot machine payouts are the #1 competitive concern — ${analysis.weaknesses.find(w => w.theme.includes("MAS") || w.theme.includes("Machine"))?.neg || "many"} mentions cite lower returns vs. other venues.` },
                { icon: "🍹", text: "Complimentary drinks are a recurring request — customers explicitly reference Las Vegas and Rival Palace as benchmarks." },
                { icon: "💰", text: "Promotions and loyalty rewards are perceived as less generous than competitors, directly impacting repeat visits." },
                { icon: "✅", text: `Your strengths lie in ${analysis.strengths.slice(0, 2).map(s => translateTag(s.theme).toLowerCase()).join(" and ") || "overall experience"} — protect these advantages.` },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed mentions (collapsed) */}
          <details className="bg-card rounded-xl border border-border">
            <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-foreground flex items-center gap-2 hover:bg-muted/30 transition-colors rounded-xl">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              View all {analysis.parentMentions.length} detailed competitor mentions
            </summary>
            <div className="px-6 pb-4 space-y-2 max-h-[400px] overflow-y-auto border-t border-border pt-3">
              {analysis.parentMentions.map((item, i) => (
                <div key={i} className="border-b border-border pb-2 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${
                      item.type.includes("apprécié") ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                    }`}>
                      {item.type.includes("apprécié") ? "Positive" : "Negative"}
                    </span>
                    <span className="text-xs font-medium text-foreground">{translateTag(item.tag)}</span>
                    <span className="text-xs text-muted-foreground">· {translateGroup(item.group)}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-auto">{item.count}</span>
                  </div>
                  {item.children.map((child, j) => (
                    <p key={j} className="text-xs text-muted-foreground ml-4 leading-relaxed">
                      <span className="font-mono text-[11px] text-foreground mr-1">{child.count}</span>
                      {child.description}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </main>
      </div>
    </div>
  );
};

export default CompetitorsPage;
