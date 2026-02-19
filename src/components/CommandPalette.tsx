import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  CalendarRange,
  Users,
  FileText,
  DollarSign,
  Settings,
  BookOpen,
  Activity,
  FileOutput,
  Building2,
} from "lucide-react";
import { useProjects, useTasks } from "@/hooks/use-supabase-data";
import { useCommandPalette } from "@/contexts/CommandPaletteContext";

const navItems = [
  { label: "Dashboard",    icon: LayoutDashboard, path: "/" },
  { label: "Projects",     icon: FolderKanban,    path: "/projects" },
  { label: "Clients",      icon: Building2,       path: "/clients" },
  { label: "Tasks",        icon: ListTodo,        path: "/tasks" },
  { label: "Budget",       icon: DollarSign,      path: "/budget" },
  { label: "Timeline",     icon: CalendarRange,   path: "/timeline" },
  { label: "Team",         icon: Users,           path: "/team" },
  { label: "Documents",    icon: FileText,        path: "/documents" },
  { label: "PDF to Word",  icon: FileOutput,      path: "/pdf-converter" },
  { label: "User Guide",   icon: BookOpen,        path: "/guide" },
  { label: "Activity Log", icon: Activity,        path: "/activity" },
  { label: "Settings",     icon: Settings,        path: "/settings" },
];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const runCommand = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, projects, tasks..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem
              key={item.path}
              value={item.label}
              onSelect={() => runCommand(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              {item.label}
              <CommandShortcut>↵</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 6).map((p) => (
                <CommandItem
                  key={p.id}
                  value={`project ${p.name}`}
                  onSelect={() => runCommand("/projects")}
                >
                  <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                  {p.name}
                  <CommandShortcut className="text-[10px] normal-case font-normal">
                    {p.status}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tasks.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tasks">
              {tasks.slice(0, 5).map((t) => (
                <CommandItem
                  key={t.id}
                  value={`task ${t.title}`}
                  onSelect={() => runCommand("/tasks")}
                >
                  <ListTodo className="mr-2 h-4 w-4 text-muted-foreground" />
                  {t.title}
                  <CommandShortcut className="text-[10px] normal-case font-normal">
                    {t.priority}
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
