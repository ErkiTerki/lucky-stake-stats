import { BarChart3, LayoutDashboard, MessageSquare, Settings, TrendingUp, Users } from "lucide-react";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Feedback", icon: MessageSquare, active: false },
  { label: "Trends", icon: TrendingUp, active: false },
  { label: "Segments", icon: Users, active: false },
  { label: "Reports", icon: BarChart3, active: false },
  { label: "Settings", icon: Settings, active: false },
];

const DashboardSidebar = () => {
  return (
    <aside className="w-56 h-screen sticky top-0 flex flex-col py-6 px-4" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="mb-8 px-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Casino<span className="text-primary">AI</span></h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Analytics Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              item.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={!item.active ? { } : {}}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="mt-auto px-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-semibold">
            CA
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">Casino Admin</p>
            <p className="text-[11px] text-muted-foreground">admin@casino.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
