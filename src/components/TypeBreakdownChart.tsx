import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TagData {
  name: string;
  positive: number;
  negative: number;
  total: number;
}

interface TypeBreakdownProps {
  data: TagData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const positive = payload.find((p: any) => p.dataKey === "positive")?.value || 0;
    const negative = payload.find((p: any) => p.dataKey === "negative")?.value || 0;
    const total = positive + negative;
    return (
      <div className="glass-card p-3 border border-border text-sm space-y-1">
        <p className="text-foreground font-medium">{label}</p>
        <p className="text-success">👍 {positive.toLocaleString()} appreciated</p>
        <p className="text-destructive">👎 {negative.toLocaleString()} irritant</p>
        <p className="text-muted-foreground border-t border-border pt-1 mt-1">
          {total.toLocaleString()} total
        </p>
      </div>
    );
  }
  return null;
};

const TypeBreakdownChart = ({ data }: TypeBreakdownProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold mb-1 text-foreground">By Category</h3>
      <p className="text-muted-foreground text-sm mb-6">Positive vs negative feedback per theme</p>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" tick={{ fill: "hsl(220, 10%, 50%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(220, 12%, 75%)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={160}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220, 14%, 14%)" }} />
            <Legend
              formatter={(value: string) => (
                <span className="text-secondary-foreground text-sm">
                  {value === "positive" ? "Appreciated" : "Irritant"}
                </span>
              )}
            />
            <Bar dataKey="positive" stackId="a" fill="hsl(160, 45%, 62%)" radius={[0, 0, 0, 0]} barSize={20} />
            <Bar dataKey="negative" stackId="a" fill="hsl(0, 55%, 68%)" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TypeBreakdownChart;
