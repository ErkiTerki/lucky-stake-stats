interface SentimentBarProps {
  positive: number;
  negative: number;
}

const SentimentBar = ({ positive, negative }: SentimentBarProps) => {
  const total = positive + negative;
  const posPercent = (positive / total) * 100;
  const negPercent = (negative / total) * 100;

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-4">Overall Sentiment</h3>
      <div className="flex rounded-full overflow-hidden h-3 bg-muted">
        <div className="h-full rounded-l-full transition-all" style={{ width: `${posPercent}%`, background: "hsl(var(--chart-positive))" }} />
        <div className="h-full rounded-r-full transition-all" style={{ width: `${negPercent}%`, background: "hsl(var(--chart-negative))" }} />
      </div>
      <div className="flex justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--chart-positive))" }} />
          {posPercent.toFixed(1)}% Appreciated ({positive.toLocaleString()})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--chart-negative))" }} />
          {negPercent.toFixed(1)}% irritant ({negative.toLocaleString()})
        </div>
      </div>
    </div>
  );
};

export default SentimentBar;
