import { useMemo, useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart3 } from "lucide-react";
import feedbackData from "@/data/feedback.json";
import KPICard from "@/components/KPICard";
import SentimentBar from "@/components/SentimentBar";
import TypeBreakdownChart from "@/components/TypeBreakdownChart";
import GroupDonutChart from "@/components/GroupDonutChart";
import TagExplorer from "@/components/TagExplorer";

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

    // Aggregate by tag (combine same tags)
    const tagMap = new Map<string, { name: string; count: number; type: string }>();
    data.forEach((d) => {
      const key = d.tag;
      const existing = tagMap.get(key);
      if (existing) {
        existing.count += d.count;
      } else {
        tagMap.set(key, { name: d.tag, count: d.count, type: d.type });
      }
    });
    const byTag = [...tagMap.values()].sort((a, b) => b.count - a.count).slice(0, 10);

    // Group aggregation
    const groupMap = new Map<string, number>();
    data.forEach((d) => {
      groupMap.set(d.group, (groupMap.get(d.group) || 0) + d.count);
    });
    const byGroup = [...groupMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const groups = [...new Set(data.map((d) => d.group))];

    return { totalMentions, posCount, negCount, topPositive, topNegative, byTag, byGroup, groups };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gradient-gold">Casino Analytics</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Analyse des retours clients — données agrégées
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-secondary text-secondary-foreground text-sm rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tous les types</option>
              <option value="apprécié">Appréciés</option>
              <option value="irritant">Irritants</option>
            </select>
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="bg-secondary text-secondary-foreground text-sm rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tous les groupes</option>
              {stats.groups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total mentions"
            value={stats.totalMentions}
            icon={MessageSquare}
            subtitle={`${data.length} thèmes identifiés`}
            delay={0}
          />
          <KPICard
            title="Appréciés"
            value={stats.posCount}
            icon={ThumbsUp}
            trend="positive"
            subtitle={`Top: ${stats.topPositive?.tag}`}
            delay={0.05}
          />
          <KPICard
            title="Irritants"
            value={stats.negCount}
            icon={ThumbsDown}
            trend="negative"
            subtitle={`Top: ${stats.topNegative?.tag}`}
            delay={0.1}
          />
          <KPICard
            title="Ratio positif"
            value={`${((stats.posCount / stats.totalMentions) * 100).toFixed(1)}%`}
            icon={BarChart3}
            subtitle="Score de satisfaction"
            delay={0.15}
          />
        </div>

        {/* Sentiment bar */}
        <SentimentBar positive={stats.posCount} negative={stats.negCount} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TypeBreakdownChart data={stats.byTag} />
          <GroupDonutChart data={stats.byGroup} />
        </div>

        {/* Tag explorer */}
        <TagExplorer data={data} filterType={filterType} filterGroup={filterGroup} />
      </main>
    </div>
  );
};

export default Index;
