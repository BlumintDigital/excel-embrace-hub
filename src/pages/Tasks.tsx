import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreHorizontal, Pencil, Trash2, ArrowRight } from "lucide-react";
import { useTasks, useTeamMembers, useProjects, DbTask } from "@/hooks/use-supabase-data";
import { useDeleteTask, useUpdateTask } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import TaskDialog from "@/components/dialogs/TaskDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

type TaskStatus = "To Do" | "In Progress" | "Done";
const columns: TaskStatus[] = ["To Do", "In Progress", "Done"];

const priorityColors: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-success/15 text-success border-success/30",
};

const statusColors: Record<string, string> = {
  "To Do": "bg-muted text-muted-foreground hover:bg-muted/80",
  "In Progress": "bg-primary/15 text-primary hover:bg-primary/25",
  "Done": "bg-success/15 text-success hover:bg-success/25",
};

export default function Tasks() {
  const [view, setView] = useState<"board" | "list">("board");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<DbTask | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const { data: tasks = [], isLoading } = useTasks();
  const { data: team = [] } = useTeamMembers();
  const { data: projects = [] } = useProjects();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const { canCreateTasks, canEditAllTasks, canDeleteAllTasks } = usePermissions();

  const filteredTasks = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const StatusBadge = ({ task }: { task: DbTask }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Badge variant="secondary" className={`text-[10px] cursor-pointer transition-colors ${statusColors[task.status] || ""}`}>
          {task.status}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-popover z-50">
        <DropdownMenuLabel className="text-xs">Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((s) => (
          <DropdownMenuItem key={s} disabled={task.status === s} onClick={() => handleStatusChange(task.id, s)}>
            <ArrowRight className="h-3 w-3 mr-2" />{s}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">{filteredTasks.length} tasks{selectedProject !== "all" ? "" : " across all projects"}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-52">
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
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          {canCreateTasks && <Button onClick={() => { setEditTask(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />New Task</Button>}
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No tasks{selectedProject !== "all" ? " for this project" : ""}. Create your first task to get started.</CardContent></Card>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div key={col} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-semibold text-sm">{col}</h2>
                  <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                </div>
                {colTasks.map((task, i) => {
                  const assignee = team.find((u) => u.id === task.assignee_id);
                  const project = projects.find((p) => p.id === task.project_id);
                  return (
                    <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{task.title}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority] || ""}`}>{task.priority}</Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover z-50">
                                  {canEditAllTasks && <DropdownMenuItem onClick={() => { setEditTask(task); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>}
                                  {canDeleteAllTasks && <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge task={task} />
                            {selectedProject === "all" && <span className="text-xs text-muted-foreground">{project?.name || "Unassigned"}</span>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {(assignee?.full_name || "?").split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{assignee?.full_name?.split(" ")[0] || "Unassigned"}</span>
                            </div>
                            {task.due_date && (
                              <span className="text-xs text-muted-foreground">{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="p-3 font-medium">Task</th>
                  {selectedProject === "all" && <th className="p-3 font-medium">Project</th>}
                  <th className="p-3 font-medium">Assignee</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Due</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const assignee = team.find((u) => u.id === task.assignee_id);
                  const project = projects.find((p) => p.id === task.project_id);
                  return (
                    <tr key={task.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{task.title}</td>
                      {selectedProject === "all" && <td className="p-3 text-sm text-muted-foreground">{project?.name || "—"}</td>}
                      <td className="p-3 text-sm">{assignee?.full_name || "Unassigned"}</td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority] || ""}`}>{task.priority}</Badge></td>
                      <td className="p-3"><StatusBadge task={task} /></td>
                      <td className="p-3 text-sm text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover z-50">
                            {canEditAllTasks && <DropdownMenuItem onClick={() => { setEditTask(task); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>}
                            {canDeleteAllTasks && <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(task.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} projects={projects} team={team} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteTask.mutate(deleteId); setDeleteId(null); } }} title="Delete Task" />
    </div>
  );
}