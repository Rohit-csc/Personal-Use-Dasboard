import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, TrendingDown, Users, Clock,
  FileText, BarChart2, Settings, Menu, X, Sun, Moon, LogOut,
  ChevronRight,
} from "lucide-react";
import FloatingCalculator from "./Calculator";

const NAV = [
  { path: "/",           icon: LayoutDashboard, label: "Dashboard" },
  { path: "/income",     icon: TrendingUp,       label: "Income" },
  { path: "/expense",    icon: TrendingDown,     label: "Expense" },
  { path: "/customers",  icon: Users,            label: "Customer Ledger" },
  { path: "/pending",    icon: Clock,            label: "Pending Work" },
  { path: "/reports",    icon: FileText,         label: "Reports" },
  { path: "/analytics",  icon: BarChart2,        label: "Analytics" },
  { path: "/settings",   icon: Settings,         label: "Settings" },
];

interface Props {
  children: React.ReactNode;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void;
  pendingCount: number;
  shopName: string;
}

export default function Layout({ children, darkMode, onToggleDark, onLogout, pendingCount, shopName }: Props) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Shop header */}
      <div className="px-4 py-5 border-b border-sidebar-border/50">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(var(--sidebar-primary)) 0%, hsl(160,70%,28%) 100%)" }}>
            <LayoutDashboard size={14} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-xs leading-tight">{shopName}</h1>
            <p className="text-sidebar-foreground/40 text-xs">Management</p>
          </div>
        </div>
        <div className="mt-2 px-1">
          <p className="text-xs text-sidebar-foreground/70 font-mono font-semibold">{timeStr}</p>
          <p className="text-xs text-sidebar-foreground/40 mt-0.5">{dateStr}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location === path || (path !== "/" && location.startsWith(path));
          return (
            <Link
              key={path}
              href={path}
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              style={active ? { boxShadow: "0 4px 16px hsl(var(--sidebar-primary)/0.35)" } : {}}
            >
              <div className="flex items-center gap-2.5">
                <Icon size={15} />
                <span>{label}</span>
              </div>
              {label === "Pending Work" && pendingCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {pendingCount}
                </span>
              )}
              {active && !pendingCount && <ChevronRight size={12} className="opacity-40" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-2 py-3 border-t border-sidebar-border/50 space-y-0.5">
        <button
          data-testid="btn-toggle-dark"
          onClick={onToggleDark}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
        >
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          data-testid="btn-logout"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut size={15} />
          Lock Screen
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r no-print"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "var(--glass-blur)",
          WebkitBackdropFilter: "var(--glass-blur)",
          borderColor: "var(--glass-border)",
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 no-print">
          <div
            className="absolute inset-0 bg-black/60"
            style={{ backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 border-r z-50"
            style={{
              background: "var(--glass-card-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              borderColor: "var(--glass-border)",
            }}>
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-12 border-b flex-shrink-0 no-print"
          style={{
            background: "var(--glass-bg)",
            backdropFilter: "var(--glass-blur)",
            WebkitBackdropFilter: "var(--glass-blur)",
            borderColor: "var(--glass-border)",
          }}>
          <button
            data-testid="btn-mobile-menu"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden flex-1 ml-3">
            <h2 className="font-semibold text-foreground text-sm">{shopName}</h2>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block font-mono">{timeStr}</span>
            <button
              onClick={onToggleDark}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              data-testid="btn-header-dark"
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </header>

        {/* Page content with fade-in */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="page-enter">
            {children}
          </div>
        </main>

        {/* Footer - print only */}
        <footer className="hidden print:block text-center py-2 text-xs text-muted-foreground border-t">
          {shopName} &bull; Contact: 8340507757 &bull; Developed By Mr Rohit
        </footer>
      </div>

      <FloatingCalculator />
    </div>
  );
}
