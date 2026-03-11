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
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-sm">
        <p className="text-foreground font-medium mb-1">{label}</p>
        <p style={{ color: "hsl(var(--chart-positive))" }}>{positive.toLocaleString()} appreciated</p>
        <p style={{ color: "hsl(var(--chart-negative))" }}>{negative.toLocaleString()} irritant</p>
      </div>
    );
  }
  return null;
};

const TypeBreakdownChart = ({ data }: TypeBreakdownProps) => {
  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-1">By Category</h3>
      <p className="text-xs text-muted-foreground mb-5">Feedback breakdown by theme</p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
            <XAxis type="number" tick={{ fill: "hsl(160, 6%, 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "hsl(160, 10%, 30%)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(100, 10%, 93%)" }} />
            <Legend
              formatter={(value: string) => (
                <span className="text-muted-foreground text-xs">
                  {value === "positive" ? "Appreciated" : "Irritant"}
                </span>
              )}
            />
            <Bar dataKey="positive" stackId="a" fill="hsl(152, 30%, 65%)" barSize={14} radius={[0, 0, 0, 0]} />
            <Bar dataKey="negative" stackId="a" fill="hsl(0, 35%, 70%)" barSize={14} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TypeBreakdownChart;
