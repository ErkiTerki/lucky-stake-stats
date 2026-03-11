import { useState } from "react";
import { ChevronRight, ThumbsUp, ThumbsDown } from "lucide-react";
import { translateTag, translateGroup } from "@/lib/translations";

interface FeedbackItem {
  type: string;
  group: string;
  tag: string;
  count: number;
  longDescription: string;
  children: { count: number; long_description: string }[];
}

interface TagExplorerProps {
  data: FeedbackItem[];
  filterType: string;
  filterGroup: string;
}

const TagExplorer = ({ data, filterType, filterGroup }: TagExplorerProps) => {
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  const filtered = data.filter((item) => {
    if (filterType !== "all" && !item.type.toLowerCase().includes(filterType)) return false;
    if (filterGroup !== "all" && item.group !== filterGroup) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.count - a.count);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-foreground">Theme Explorer</h3>
        <span className="text-xs text-muted-foreground">{sorted.length} themes</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Click to expand details</p>
      <div className="space-y-px max-h-[480px] overflow-y-auto">
        {sorted.map((item) => {
          const key = `${item.type}-${item.group}-${item.tag}-${item.count}`;
          const isExpanded = expandedTag === key;
          const isPositive = item.type.includes("apprécié");

          return (
            <div key={key}>
              <button
                onClick={() => setExpandedTag(isExpanded ? null : key)}
                className="w-full flex items-center gap-3 py-2.5 px-1 hover:bg-muted/50 transition-colors text-left rounded-md group"
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
                {isPositive ? (
                  <ThumbsUp className="w-3.5 h-3.5 text-success flex-shrink-0" />
                ) : (
                  <ThumbsDown className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                )}
                <span className="text-sm text-foreground flex-1 truncate">
                  {translateTag(item.tag)}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {translateGroup(item.group)}
                </span>
                <span className="font-mono text-xs text-foreground tabular-nums">
                  {item.count.toLocaleString()}
                </span>
              </button>
              {isExpanded && (
                <div className="ml-10 pb-3 space-y-2 pt-1">
                  <p className="text-xs text-muted-foreground">{item.longDescription}</p>
                  {item.children.map((child, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="font-mono text-primary bg-primary/5 px-1.5 py-0.5 rounded text-[11px] flex-shrink-0">
                        {child.count.toLocaleString()}
                      </span>
                      <p className="text-muted-foreground leading-relaxed">
                        {child.long_description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TagExplorer;
