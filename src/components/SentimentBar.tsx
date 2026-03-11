import { motion } from "framer-motion";

interface SentimentBarProps {
  positive: number;
  negative: number;
}

const SentimentBar = ({ positive, negative }: SentimentBarProps) => {
  const total = positive + negative;
  const posPercent = (positive / total) * 100;
  const negPercent = (negative / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold mb-1">Sentiment global</h3>
      <p className="text-muted-foreground text-sm mb-4">Ratio apprécié vs irritant</p>
      <div className="flex rounded-full overflow-hidden h-4 bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${posPercent}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className="bg-success h-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${negPercent}%` }}
          transition={{ duration: 1, delay: 0.7 }}
          className="bg-destructive h-full"
        />
      </div>
      <div className="flex justify-between mt-3 text-sm">
        <span className="text-success font-medium">
          👍 {posPercent.toFixed(1)}% apprécié ({positive.toLocaleString()})
        </span>
        <span className="text-destructive font-medium">
          👎 {negPercent.toFixed(1)}% irritant ({negative.toLocaleString()})
        </span>
      </div>
    </motion.div>
  );
};

export default SentimentBar;
