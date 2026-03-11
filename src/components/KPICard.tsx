import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  delay?: number;
}

const KPICard = ({ title, value, subtitle, trend }: KPICardProps) => {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-foreground font-mono tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {trend && trend !== "neutral" && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
            trend === "positive" 
              ? "bg-primary/10 text-primary" 
              : "bg-destructive/10 text-destructive"
          }`}>
            {trend === "positive" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default KPICard;
