import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, ListTodo, Search } from "lucide-react";
import { TasksSkeleton } from "@/components/skeletons/TasksSkeleton";
import { useTasks, useTeamMembers, useProjects, DbTask } from "@/hooks/use-supabase-data";
import { useDeleteTask, useUpdateTask } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import TaskDialog from "@/components/dialogs/TaskDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { STATUS_BADGE_CLASSES, PRIORITY_BADGE_CLASSES, PRIORITY_DOT_COLORS } from "@/lib/status-config";

type TaskStatus = "To Do" | "In Progress" | "Done";
const columns: TaskStatus[] = ["To Do", "In Progress", "Done"];

const COLUMN_DOT: Record<TaskStatus, string> = {
  "To Do": "bg-muted-foreground",
  "In Progress": "bg-primary",
  "Done": "bg-success",
};

export default function Tasks() {
  const navigate = useNavigate();
  const [view, setView] = useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<DbTask | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: tasks = [], isLoading } = useTasks();
  const { data: team = [] } = useTeamMembers();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const { canCreateTasks, canEditAllTasks, canDeleteAllTasks } = usePermissions();

  const filteredTasks = useMemo(() => {
    let result = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, selectedProject, search]);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) return <TasksSkeleton />;

  const StatusBadge = ({ task }: { task: DbTask }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge
          variant="outline"
          className={`text-[10px] cursor-pointer ${STATUS_BADGE_CLASSES[task.status] || "bg-muted text-muted-foreground border-border"}`}
        >
          {task.status}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover z-50">
        <DropdownMenuLabel className="text-xs">Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((s) => (
          <DropdownMenuItem key={s} disabled={task.status === s} onClick={() => handleStatusChange(task.id, s)}>
            <span className={`h-1.5 w-1.5 rounded-full mr-2 ${COLUMN_DOT[s]}`} />
            {s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Tasks"
        subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}${selectedProject === "all" ? " across all projects" : ""}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm w-40"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
              <TabsList className="h-8">
                <TabsTrigger value="board" className="text-xs px-3">Board</TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-3">List</TabsTrigger>
              </TabsList>
            </Tabs>
            {canCreateTasks && (
              <Button size="sm" onClick={() => { setEditTask(null); setDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />New Task
              </Button>
            )}
          </div>
        }
      />

      {/* Empty state */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <ListTodo className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No tasks yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedProject !== "all" ? "No tasks for this project." : "Create your first task to get started."}
            </p>
          </CardContent>
        </Card>
      ) : view === "board" ? (
        /* Board View */
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div key={col} className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${COLUMN_DOT[col]}`} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{col}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{colTasks.length}</span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => {
                    const assignee = team.find((u) => u.id === task.assignee_id);
                    const project = projects.find((p) => p.id === task.project_id);
                    const priorityDot = PRIORITY_DOT_COLORS[task.priority] || "bg-muted-foreground";
                    return (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="rounded-md border border-border bg-card p-3 hover:border-primary/30 transition-colors space-y-2.5 cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{task.title}</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 -mt-0.5" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover z-50">
                              {canEditAllTasks && (
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditTask(task); setDialogOpen(true); }}>
                                  <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteAllTasks && (
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${priorityDot}`} />
                          <span className="text-[11px] text-muted-foreground">{task.priority}</span>
                          {selectedProject === "all" && project && (
                            <>
                              <span className="text-muted-foreground/40 mx-0.5">·</span>
                              <span className="text-[11px] text-muted-foreground truncate">{project.name}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                                {(assignee?.full_name || "?").split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] text-muted-foreground">
                              {assignee?.full_name?.split(" ")[0] || "Unassigned"}
                            </span>
                          </div>
                          {task.due_date && (
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List/Table View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Task</th>
                  {selectedProject === "all" && (
                    <th className="hidden sm:table-cell px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                  )}
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assignee</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Due</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const assignee = team.find((u) => u.id === task.assignee_id);
                  const project = projects.find((p) => p.id === task.project_id);
                  return (
                    <tr key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer">
                      <td className="px-4 py-3 text-sm font-medium max-w-[140px] sm:max-w-none truncate">{task.title}</td>
                      {selectedProject === "all" && (
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">{project?.name || "—"}</td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                              {(assignee?.full_name || "?").split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="hidden sm:inline text-sm text-muted-foreground">
                            {assignee?.full_name?.split(" ")[0] || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[10px] ${PRIORITY_BADGE_CLASSES[task.priority] || ""}`}>
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3"><StatusBadge task={task} /></td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm text-muted-foreground">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"
                        }
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover z-50">
                            {canEditAllTasks && (
                              <DropdownMenuItem onClick={() => { setEditTask(task); setDialogOpen(true); }}>
                                <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                              </DropdownMenuItem>
                            )}
                            {canDeleteAllTasks && (
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(task.id)}>
                                <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} projects={projects} team={team} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteTask.mutate(deleteId); setDeleteId(null); } }}
        title="Delete Task"
      />
    </div>
  );
}
