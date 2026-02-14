import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useTasks, useTeamMembers, useProjects } from "@/hooks/use-supabase-data";

type TaskStatus = "To Do" | "In Progress" | "Done";
const columns: TaskStatus[] = ["To Do", "In Progress", "Done"];

const priorityColors: Record<string, string> = {
  High: "bg-destructive/15 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-success/15 text-success border-success/30",
};

export default function Tasks() {
  const [view, setView] = useState<"board" | "list">("board");
  const { data: tasks = [], isLoading } = useTasks();
  const { data: team = [] } = useTeamMembers();
  const { data: projects = [] } = useProjects();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground mt-1">{tasks.length} total tasks across all projects</p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
          <TabsList>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tasks.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No tasks yet. Tasks will appear here once created within projects.</CardContent></Card>
      ) : view === "board" ? (
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col);
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
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{task.title}</p>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityColors[task.priority] || ""}`}>{task.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{project?.name || "Unassigned"}</p>
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
                  <th className="p-3 font-medium">Project</th>
                  <th className="p-3 font-medium">Assignee</th>
                  <th className="p-3 font-medium">Priority</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const assignee = team.find((u) => u.id === task.assignee_id);
                  const project = projects.find((p) => p.id === task.project_id);
                  return (
                    <tr key={task.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 text-sm font-medium">{task.title}</td>
                      <td className="p-3 text-sm text-muted-foreground">{project?.name || "—"}</td>
                      <td className="p-3 text-sm">{assignee?.full_name || "Unassigned"}</td>
                      <td className="p-3"><Badge variant="outline" className={`text-[10px] ${priorityColors[task.priority] || ""}`}>{task.priority}</Badge></td>
                      <td className="p-3"><Badge variant="secondary" className="text-[10px]">{task.status}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">{task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
