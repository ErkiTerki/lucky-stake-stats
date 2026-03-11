import { LayoutDashboard, MessageCircle, Swords, Lightbulb, ClipboardList } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Strategy", icon: Lightbulb, path: "/strategy" },
  { label: "Competitors", icon: Swords, path: "/competitors" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "Last Review", icon: ClipboardList, path: "/last-review" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-56 h-screen sticky top-0 flex flex-col py-6 px-4" style={{ background: "hsl(var(--sidebar-bg))" }}>
      <div className="mb-8 px-3">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Casino<span className="text-primary">AI</span></h2>
        <p className="text-[11px] text-muted-foreground mt-0.5">Analytics Dashboard</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
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
