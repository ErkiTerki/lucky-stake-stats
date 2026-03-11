import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface GroupDonutProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "hsl(145, 45%, 42%)",
  "hsl(38, 90%, 55%)",
  "hsl(200, 50%, 55%)",
  "hsl(280, 40%, 60%)",
  "hsl(20, 70%, 55%)",
  "hsl(340, 45%, 55%)",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-sm">
        <p className="text-foreground font-medium">{payload[0].name}</p>
        <p className="text-muted-foreground">{payload[0].value.toLocaleString()} mentions</p>
      </div>
    );
  }
  return null;
};

const GroupDonutChart = ({ data }: GroupDonutProps) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-1">By Group</h3>
      <p className="text-xs text-muted-foreground mb-5">Distribution by activity domain</p>
      <div className="flex items-center gap-6">
        <div className="h-[190px] w-[190px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2.5 min-w-0">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-foreground truncate">{item.name}</span>
              <span className="text-muted-foreground font-mono ml-auto">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupDonutChart;
