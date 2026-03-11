import { useMemo, useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart3, Search } from "lucide-react";
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

const data = feedbackData as FeedbackItem[];

const Index = () => {
  const [filterType, setFilterType] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");

  const stats = useMemo(() => {
    const totalMentions = data.reduce((s, d) => s + d.count, 0);
    const positive = data.filter((d) => d.type.includes("apprécié"));
    const negative = data.filter((d) => d.type.includes("Irritant"));
    const posCount = positive.reduce((s, d) => s + d.count, 0);
    const negCount = negative.reduce((s, d) => s + d.count, 0);

    const topPositive = [...positive].sort((a, b) => b.count - a.count)[0];
    const topNegative = [...negative].sort((a, b) => b.count - a.count)[0];

    const tagMap = new Map<string, { name: string; positive: number; negative: number }>();
    data.forEach((d) => {
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

    const groupMap = new Map<string, number>();
    data.forEach((d) => {
      const translated = translateGroup(d.group);
      groupMap.set(translated, (groupMap.get(translated) || 0) + d.count);
    });
    const byGroup = [...groupMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const groups = [...new Set(data.map((d) => d.group))];

    return { totalMentions, posCount, negCount, topPositive, topNegative, byTag, byGroup, groups };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex-1 min-w-0">
        {/* Top bar */}
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
              <option value="apprécié">Appreciated</option>
              <option value="irritant">Irritants</option>
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
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Customer feedback analysis overview</p>
          </div>

          {/* KPIs row */}
          <div className="bg-card rounded-xl border border-border p-5 mb-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Mentions"
                value={stats.totalMentions}
                icon={MessageSquare}
                subtitle={`${data.length} themes`}
              />
              <KPICard
                title="Appreciated"
                value={stats.posCount}
                icon={ThumbsUp}
                trend="positive"
                subtitle={`Top: ${translateTag(stats.topPositive?.tag || "")}`}
              />
              <KPICard
                title="Irritants"
                value={stats.negCount}
                icon={ThumbsDown}
                trend="negative"
                subtitle={`Top: ${translateTag(stats.topNegative?.tag || "")}`}
              />
              <KPICard
                title="Positive Ratio"
                value={`${((stats.posCount / stats.totalMentions) * 100).toFixed(1)}%`}
                icon={BarChart3}
                trend="positive"
                subtitle="Satisfaction score"
              />
            </div>
          </div>

          {/* Sentiment */}
          <div className="mb-5">
            <SentimentBar positive={stats.posCount} negative={stats.negCount} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
            <TypeBreakdownChart data={stats.byTag} />
            <GroupDonutChart data={stats.byGroup} />
          </div>

          {/* Explorer */}
          <TagExplorer data={data} filterType={filterType} filterGroup={filterGroup} />
        </main>
      </div>
    </div>
  );
};

export default Index;
