// Pre-processed summary of casino feedback data for AI context
// Generated from the full 41K-line JSON dataset

import feedbackData from "@/data/feedback.json";

interface FeedbackItem {
  type: string;
  group: string;
  tag: string;
  count: number;
  longDescription: string;
  children: { count: number; long_description: string }[];
}

const data = feedbackData as FeedbackItem[];

export function generateDataSummary(): string {
  const totalMentions = data.reduce((s, d) => s + d.count, 0);
  const positive = data.filter((d) => d.type.includes("apprécié"));
  const negative = data.filter((d) => d.type.includes("Irritant"));
  const posCount = positive.reduce((s, d) => s + d.count, 0);
  const negCount = negative.reduce((s, d) => s + d.count, 0);

  // Group aggregation
  const groupMap = new Map<string, { pos: number; neg: number }>();
  data.forEach((d) => {
    const existing = groupMap.get(d.group) || { pos: 0, neg: 0 };
    if (d.type.includes("apprécié")) existing.pos += d.count;
    else existing.neg += d.count;
    groupMap.set(d.group, existing);
  });

  // Top tags
  const tagAgg = new Map<string, { pos: number; neg: number; descriptions: string[] }>();
  data.forEach((d) => {
    const existing = tagAgg.get(d.tag) || { pos: 0, neg: 0, descriptions: [] };
    if (d.type.includes("apprécié")) existing.pos += d.count;
    else existing.neg += d.count;
    existing.descriptions.push(d.longDescription);
    tagAgg.set(d.tag, existing);
  });

  const topTags = [...tagAgg.entries()]
    .map(([tag, v]) => ({ tag, total: v.pos + v.neg, ...v }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  // Build all items detail
  const allItems = data.map((d) => ({
    type: d.type.includes("apprécié") ? "Appreciated" : "Irritant",
    group: d.group,
    tag: d.tag,
    count: d.count,
    summary: d.longDescription,
    details: d.children.map((c) => `${c.count}: ${c.long_description}`).join(" | "),
  }));

  let summary = `# Casino Customer Feedback Data Summary

## Overview
- Total feedback mentions: ${totalMentions.toLocaleString()}
- Total themes: ${data.length}
- Appreciated (positive): ${posCount.toLocaleString()} (${((posCount/totalMentions)*100).toFixed(1)}%)
- Irritant (negative): ${negCount.toLocaleString()} (${((negCount/totalMentions)*100).toFixed(1)}%)

## By Group
`;

  groupMap.forEach((v, group) => {
    const total = v.pos + v.neg;
    summary += `- ${group}: ${total.toLocaleString()} total (${v.pos.toLocaleString()} positive, ${v.neg.toLocaleString()} negative)\n`;
  });

  summary += `\n## Top 20 Themes\n`;
  topTags.forEach((t) => {
    summary += `- ${t.tag}: ${t.total.toLocaleString()} total (${t.pos.toLocaleString()} pos, ${t.neg.toLocaleString()} neg) — ${t.descriptions[0]}\n`;
  });

  summary += `\n## All Feedback Items (${allItems.length} total)\n`;
  allItems.forEach((item) => {
    summary += `\n### [${item.type}] ${item.tag} (${item.group}) — ${item.count} mentions\nSummary: ${item.summary}\nDetails: ${item.details}\n`;
  });

  return summary;
}
