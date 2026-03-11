import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface GroupDonutProps {
  data: { name: string; value: number }[];
}

const COLORS = [
  "hsl(210, 60%, 72%)",
  "hsl(180, 50%, 65%)",
  "hsl(260, 50%, 72%)",
  "hsl(160, 45%, 62%)",
  "hsl(30, 55%, 70%)",
  "hsl(340, 45%, 72%)",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 border border-border text-sm">
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold mb-1 text-foreground">By Group</h3>
      <p className="text-muted-foreground text-sm mb-6">Distribution by activity domain</p>
      <div className="flex items-center gap-6">
        <div className="h-[220px] w-[220px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={100}
                paddingAngle={3}
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
        <div className="flex flex-col gap-2 min-w-0">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-secondary-foreground truncate">{item.name}</span>
              <span className="text-muted-foreground font-mono ml-auto">
                {((item.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GroupDonutChart;
