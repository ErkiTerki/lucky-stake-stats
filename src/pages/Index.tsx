import { useMemo, useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart3, Search, TrendingUp, TrendingDown } from "lucide-react";
import feedbackData from "@/data/feedback.json";
import KPICard from "@/components/KPICard";
import SentimentBar from "@/components/SentimentBar";
import TypeBreakdownChart from "@/components/TypeBreakdownChart";
import GroupDonutChart from "@/components/GroupDonutChart";
import TagExplorer from "@/components/TagExplorer";
import DashboardSidebar from "@/components/DashboardSidebar";
import { translateGroup, translateTag } from "@/lib/translations";

interface FeedbackItem {
  type: string;
  group: string;
  tag: string;
  count: number;
  longDescription: string;
  children: { count: number; long_description: string }[];
}

const allData = feedbackData as FeedbackItem[];

const Index = () => {
  const [filterType, setFilterType] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");

  const isTypeFiltered = filterType !== "all";
  const isGroupFiltered = filterGroup !== "all";
  const isAppreciated = filterType === "apprécié";
  const isIrritant = filterType === "irritant";

  const stats = useMemo(() => {
    // Global totals (unfiltered)
    const globalTotal = allData.reduce((s, d) => s + d.count, 0);
    const globalPos = allData.filter((d) => d.type.includes("apprécié")).reduce((s, d) => s + d.count, 0);
    const globalNeg = allData.filter((d) => d.type.includes("Irritant")).reduce((s, d) => s + d.count, 0);

    // Apply both filters
    const filtered = allData.filter((d) => {
      if (filterType === "apprécié" && !d.type.includes("apprécié")) return false;
      if (filterType === "irritant" && !d.type.includes("Irritant")) return false;
      if (filterGroup !== "all" && d.group !== filterGroup) return false;
      return true;
    });

    const filteredTotal = filtered.reduce((s, d) => s + d.count, 0);
    const filteredThemes = filtered.length;
    const filteredPos = filtered.filter((d) => d.type.includes("apprécié")).reduce((s, d) => s + d.count, 0);
    const filteredNeg = filtered.filter((d) => d.type.includes("Irritant")).reduce((s, d) => s + d.count, 0);

    // Determine the denominator for share calculation
    let shareDenominator = globalTotal;
    let shareLabel = "of all mentions";
    if (isAppreciated && !isGroupFiltered) {
      shareDenominator = globalTotal;
      shareLabel = "of all mentions";
    } else if (isIrritant && !isGroupFiltered) {
      shareDenominator = globalTotal;
      shareLabel = "of all mentions";
    } else if (isAppreciated && isGroupFiltered) {
      shareDenominator = globalPos;
      shareLabel = "of all Positive";
    } else if (isIrritant && isGroupFiltered) {
      shareDenominator = globalNeg;
      shareLabel = "of all Negative";
    } else if (isGroupFiltered) {
      shareDenominator = globalTotal;
      shareLabel = "of all mentions";
    }

    const topPositive = [...allData.filter((d) => d.type.includes("apprécié"))].sort((a, b) => b.count - a.count)[0];
    const topNegative = [...allData.filter((d) => d.type.includes("Irritant"))].sort((a, b) => b.count - a.count)[0];

    // By tag for chart
    const tagMap = new Map<string, { name: string; positive: number; negative: number }>();
    filtered.forEach((d) => {
      const key = d.tag;
      const isPos = d.type.includes("apprécié");
      const existing = tagMap.get(key);
      if (existing) {
        if (isPos) existing.positive += d.count;
        else existing.negative += d.count;
      } else {
        tagMap.set(key, {
          name: translateTag(d.tag),
          positive: isPos ? d.count : 0,
          negative: isPos ? 0 : d.count,
        });
      }
    });
    const byTag = [...tagMap.values()]
      .map((t) => ({ ...t, total: t.positive + t.negative }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // By group
    const groupMap = new Map<string, number>();
    filtered.forEach((d) => {
      const translated = translateGroup(d.group);
      groupMap.set(translated, (groupMap.get(translated) || 0) + d.count);
    });
    const byGroup = [...groupMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const groups = [...new Set(allData.map((d) => d.group))];

    const topFiltered = [...filtered].sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      globalTotal, globalPos, globalNeg,
      filteredTotal, filteredThemes, filteredPos, filteredNeg,
      shareDenominator, shareLabel,
      topPositive, topNegative,
      byTag, byGroup, groups, topFiltered,
    };
  }, [filterType, filterGroup]);

  const isFiltered = isTypeFiltered || isGroupFiltered;

  // Title and subtitle
  let pageTitle = "Dashboard";
  let pageSubtitle = "Customer feedback analysis overview";
  if (isAppreciated && isGroupFiltered) {
    pageTitle = `Positive — ${translateGroup(filterGroup)}`;
    pageSubtitle = "Positive feedback for this group";
  } else if (isIrritant && isGroupFiltered) {
    pageTitle = `Negative — ${translateGroup(filterGroup)}`;
    pageSubtitle = "Areas of frustration in this group";
  } else if (isAppreciated) {
    pageTitle = "What Customers Love";
    pageSubtitle = "Positive feedback highlights";
  } else if (isIrritant) {
    pageTitle = "Customer Pain Points";
    pageSubtitle = "Areas needing improvement";
  } else if (isGroupFiltered) {
    pageTitle = translateGroup(filterGroup);
    pageSubtitle = "All feedback for this group";
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-1.5 w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search...</span>
            <span className="ml-auto text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-background">⌘K</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-card text-foreground text-xs rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All types</option>
              <option value="apprécié">Positive</option>
              <option value="irritant">Negative</option>
            </select>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-card text-foreground text-xs rounded-lg px-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All groups</option>
              {stats.groups.map((g) => (
                <option key={g} value={g}>{translateGroup(g)}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="px-8 py-6 max-w-6xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{pageSubtitle}</p>
          </div>

          {/* KPIs */}
          <div className="bg-card rounded-xl border border-border p-5 mb-5">
            {!isFiltered ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard title="Total Mentions" value={stats.globalTotal} icon={MessageSquare} subtitle={`${allData.length} themes`} />
                <KPICard title="Appreciated" value={stats.globalPos} icon={ThumbsUp} trend="positive" subtitle={`Top: ${translateTag(stats.topPositive?.tag || "")}`} />
                <KPICard title="Irritants" value={stats.globalNeg} icon={ThumbsDown} trend="negative" subtitle={`Top: ${translateTag(stats.topNegative?.tag || "")}`} />
                <KPICard title="Positive Ratio" value={`${((stats.globalPos / stats.globalTotal) * 100).toFixed(1)}%`} icon={BarChart3} trend="positive" subtitle="Satisfaction score" />
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <KPICard
                  title={isAppreciated ? "Appreciated Mentions" : isIrritant ? "Irritant Mentions" : "Mentions"}
                  value={stats.filteredTotal}
                  icon={isAppreciated ? ThumbsUp : isIrritant ? ThumbsDown : MessageSquare}
                  trend={isAppreciated ? "positive" : isIrritant ? "negative" : "neutral"}
                  subtitle={`${stats.filteredThemes} themes`}
                />
                <KPICard
                  title="Share"
                  value={`${((stats.filteredTotal / stats.shareDenominator) * 100).toFixed(1)}%`}
                  icon={BarChart3}
                  subtitle={stats.shareLabel}
                />
                <KPICard
                  title={isAppreciated ? "Top Strength" : isIrritant ? "Top Pain Point" : "Top Theme"}
                  value={translateTag(stats.topFiltered[0]?.tag || "")}
                  icon={isAppreciated ? TrendingUp : isIrritant ? TrendingDown : TrendingUp}
                  subtitle={`${stats.topFiltered[0]?.count.toLocaleString() || 0} mentions`}
                />
              </div>
            )}
          </div>

          {/* Sentiment bar — only unfiltered by type */}
          {!isTypeFiltered && (
            <div className="mb-5">
              <SentimentBar positive={stats.filteredPos} negative={stats.filteredNeg} />
            </div>
          )}

          {/* Top items when type-filtered */}
          {isTypeFiltered && (
            <div className="bg-card rounded-xl border border-border p-5 mb-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {isAppreciated ? "Top Appreciated Themes" : "Top Irritant Themes"}
              </h3>
              <div className="space-y-3">
                {stats.topFiltered.map((item, i) => (
                  <div key={`${item.tag}-${item.count}-${i}`} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{translateTag(item.tag)}</span>
                        <span className="text-[11px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-md">
                          {translateGroup(item.group)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.longDescription}</p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-foreground">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <TypeBreakdownChart data={stats.byTag} />
            {!isGroupFiltered && <GroupDonutChart data={stats.byGroup} />}
          </div>

          {/* Explorer */}
          <TagExplorer data={allData} filterType={filterType} filterGroup={filterGroup} />
        </main>
      </div>
    </div>
  );
};

export default Index;
