import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  CalendarRange,
  Users,
  FileText,
  DollarSign,
  Settings,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Tasks", icon: ListTodo, path: "/tasks" },
  { label: "Budget", icon: DollarSign, path: "/budget" },
  { label: "Timeline", icon: CalendarRange, path: "/timeline" },
  { label: "Team", icon: Users, path: "/team" },
  { label: "Documents", icon: FileText, path: "/documents" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <HardHat className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold tracking-tight">PipeFlow</h1>
          <p className="text-xs text-sidebar-muted">Project Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <Link to="/settings" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">AR</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Alex Rivera</p>
            <p className="text-xs text-sidebar-muted truncate">Admin</p>
          </div>
          <Settings className="h-4 w-4 text-sidebar-muted" />
        </Link>
      </div>
    </aside>
  );
}
