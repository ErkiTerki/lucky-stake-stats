interface SentimentBarProps {
  positive: number;
  negative: number;
}

const SentimentBar = ({ positive, negative }: SentimentBarProps) => {
  const total = positive + negative;
  const posPercent = (positive / total) * 100;
  const negPercent = (negative / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Overall Sentiment</h3>
      </div>
      <div className="flex rounded-full overflow-hidden h-2 bg-muted">
        <div className="bg-success h-full transition-all" style={{ width: `${posPercent}%` }} />
        <div className="bg-destructive h-full transition-all" style={{ width: `${negPercent}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{posPercent.toFixed(1)}% appreciated ({positive.toLocaleString()})</span>
        <span>{negPercent.toFixed(1)}% irritant ({negative.toLocaleString()})</span>
      </div>
    </div>
  );
};

export default SentimentBar;
