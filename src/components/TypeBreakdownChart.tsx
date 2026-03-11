import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface TypeBreakdownProps {
  data: { name: string; count: number; type: string }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-border text-sm">
        <p className="text-foreground font-medium">{label}</p>
        <p className="text-muted-foreground">
          {payload[0].value.toLocaleString()} mentions
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
      <h3 className="text-lg font-semibold mb-1">By Category</h3>
      <p className="text-muted-foreground text-sm mb-6">Feedback breakdown by theme</p>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(40, 15%, 80%)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={160}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(220, 14%, 14%)" }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.type.includes("apprécié") ? "hsl(152, 60%, 42%)" : "hsl(0, 72%, 55%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default TypeBreakdownChart;
