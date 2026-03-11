import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  delay?: number;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, delay = 0 }: KPICardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card p-6 glow-card"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-3xl font-bold text-foreground font-mono">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <p className={`text-sm mt-2 ${
          trend === "positive" ? "text-success" : 
          trend === "negative" ? "text-destructive" : 
          "text-muted-foreground"
        }`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default KPICard;
