import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  CalendarRange,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  Activity,
  FileOutput,
  FileUp,
  Building2,
  Sun,
  Moon,
  Search,
  BarChart2,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import logoWhite from "@/assets/logo-white.png";
import logoColor from "@/assets/logo-color.png";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";
import { NotificationBell } from "@/components/NotificationBell";

const navGroups = [
  {
    label: null,
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    ],
  },
  {
    label: "WORKSPACE",
    items: [
      { label: "Projects", icon: FolderKanban, path: "/projects" },
      { label: "Clients", icon: Building2, path: "/clients" },
      { label: "Tasks", icon: ListTodo, path: "/tasks" },
      { label: "Budget", icon: DollarSign, path: "/budget" },
      { label: "Timeline", icon: CalendarRange, path: "/timeline" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { label: "Team", icon: Users, path: "/team" },
      { label: "Documents", icon: FileText, path: "/documents" },
      { label: "PDF to Word", icon: FileOutput, path: "/pdf-converter" },
      { label: "CSV Import", icon: FileUp, path: "/import" },
      { label: "Reports", icon: BarChart2, path: "/reports" },
      { label: "User Guide", icon: BookOpen, path: "/guide" },
      { label: "Activity Log", icon: Activity, path: "/activity" },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const { setOpen: openPalette } = useCommandPalette();
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const closeMobile = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-4 flex items-center justify-between">
        <img src={logoWhite} alt="Blumint Workspace" className="h-7 shrink-0" />
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent shrink-0"
          onClick={closeMobile}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Search trigger + notification bell */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
        <button
          onClick={() => openPalette(true)}
          className="flex flex-1 items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/30 px-3 py-1.5 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="rounded bg-sidebar-border px-1.5 py-0.5 text-[10px] font-mono">⌘K</kbd>
        </button>
        <NotificationBell className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 shrink-0" />
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobile}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer — User + Sign Out */}
      <div className="mt-auto">
        <Separator className="bg-sidebar-border" />
        <div className="px-3 py-3 space-y-0.5">
          <Link
            to="/settings"
            onClick={closeMobile}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 hover:bg-sidebar-accent/60 transition-colors group"
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground leading-none">
                {profile?.full_name || "Loading..."}
              </p>
              <p className="text-[11px] text-sidebar-muted truncate capitalize mt-0.5">
                {role?.replace("_", " ") || "Member"}
              </p>
            </div>
            <Settings className="h-3.5 w-3.5 text-sidebar-muted shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center h-14 px-4 bg-card border-b border-border lg:hidden">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <img src={logoColor} alt="Blumint Workspace" className="h-6 ml-2 object-contain max-w-[120px]" />
        <NotificationBell />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeMobile}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex h-screen w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
