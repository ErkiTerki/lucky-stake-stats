import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  delay?: number;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend }: KPICardProps) => {
  return (
    <div className="py-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {title}
        </span>
      </div>
      <div className="text-2xl font-semibold text-foreground font-mono tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {subtitle && (
        <p className={`text-xs mt-1.5 ${
          trend === "positive" ? "text-success" : 
          trend === "negative" ? "text-destructive" : 
          "text-muted-foreground"
        }`}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default KPICard;
