import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ThumbsUp, ThumbsDown } from "lucide-react";

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold mb-1">Explorateur de thèmes</h3>
      <p className="text-muted-foreground text-sm mb-6">
        {sorted.length} thèmes trouvés — cliquez pour voir le détail
      </p>
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
        {sorted.map((item) => {
          const key = `${item.type}-${item.group}-${item.tag}-${item.count}`;
          const isExpanded = expandedTag === key;
          const isPositive = item.type.includes("apprécié");

          return (
            <div key={key} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedTag(isExpanded ? null : key)}
                className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className={`p-1.5 rounded-md ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                  {isPositive ? (
                    <ThumbsUp className="w-4 h-4 text-success" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{item.tag}</span>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded-full">
                      {item.group}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {item.longDescription}
                  </p>
                </div>
                <span className="font-mono text-sm text-primary font-semibold">
                  {item.count.toLocaleString()}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {item.children.map((child, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-sm"
                        >
                          <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 rounded flex-shrink-0">
                            {child.count.toLocaleString()}
                          </span>
                          <p className="text-secondary-foreground leading-relaxed">
                            {child.long_description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TagExplorer;
