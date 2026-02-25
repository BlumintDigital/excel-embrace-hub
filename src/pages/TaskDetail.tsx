import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Pencil, Trash2, Loader2, CalendarDays, User, FolderKanban, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTasks, useProjects, useTeamMembers } from "@/hooks/use-supabase-data";
import { useDeleteTask } from "@/hooks/use-supabase-mutations";
import { useActivityLogs } from "@/hooks/use-activity-logs";
import { usePermissions } from "@/hooks/use-permissions";
import { useWorkspace, CURRENCIES } from "@/contexts/WorkspaceContext";
import TaskDialog from "@/components/dialogs/TaskDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import {
  STATUS_DOT_COLORS,
  STATUS_BADGE_CLASSES,
  PRIORITY_DOT_COLORS,
  PRIORITY_BADGE_CLASSES,
} from "@/lib/status-config";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysFromNow(iso: string | null): string {
  if (!iso) return "No due date";
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Due today";
  if (diff < 0) return `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""}`;
  return `Due in ${diff} day${diff !== 1 ? "s" : ""}`;
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: tasks = [], isLoading: lt } = useTasks();
  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: team = [], isLoading: lm } = useTeamMembers();
  const { data: logs = [] } = useActivityLogs(200);
  const deleteTask = useDeleteTask();
  const { canEditAllTasks, canDeleteAllTasks } = usePermissions();
  const { settings } = useWorkspace();
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];

  if (lt || lp || lm) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title="Task Not Found" parent={{ label: "Tasks", href: "/tasks" }} />
      </div>
    );
  }

  const project = projects.find((p) => p.id === task.project_id);
  const assignee = team.find((u) => u.id === task.assignee_id);
  const taskLogs = logs.filter((l) => l.entity_id === task.id);

  const statusDot = STATUS_DOT_COLORS[task.status] || "bg-muted-foreground";
  const statusBadge = STATUS_BADGE_CLASSES[task.status] || "bg-muted text-muted-foreground border-border";
  const priorityDot = PRIORITY_DOT_COLORS[task.priority] || "bg-muted-foreground";
  const priorityBadge = PRIORITY_BADGE_CLASSES[task.priority] || "bg-muted text-muted-foreground border-border";
  const dueLabel = daysFromNow(task.due_date);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "Done";

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title={task.title}
        parent={{ label: "Tasks", href: "/tasks" }}
        action={
          <div className="flex gap-2">
            {canEditAllTasks && (
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
              </Button>
            )}
            {canDeleteAllTasks && (
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
              </Button>
            )}
          </div>
        }
      />

      {/* Meta + Stat row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Meta card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={statusBadge}>
                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${statusDot}`} />
                {task.status}
              </Badge>
              <Badge variant="outline" className={priorityBadge}>
                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${priorityDot}`} />
                {task.priority} priority
              </Badge>
              {isOverdue && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  Overdue
                </Badge>
              )}
            </div>

            <Separator />

            {/* Details grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Assignee</p>
                  {assignee ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                          {(assignee.full_name || "?").split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Unassigned</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <FolderKanban className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Project</p>
                  {project ? (
                    <Link to={`/projects/${project.id}`} className="text-sm text-primary hover:underline">
                      {project.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No project</span>
                  )}
                </div>
              </div>

              {task.start_date && (
                <div className="flex items-start gap-2.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Start Date</p>
                    <span className="text-sm">{fmtDate(task.start_date)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Due Date</p>
                  <span className={`text-sm ${isOverdue ? "text-destructive font-medium" : ""}`}>
                    {fmtDate(task.due_date) || "Not set"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stat cards column */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-5">
              <Clock className="h-4 w-4 text-muted-foreground mb-2" />
              <p className="text-xs font-medium">{fmtDate(task.created_at)}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Created</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <CalendarDays className={`h-4 w-4 mb-2 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`} />
              <p className={`text-xs font-medium ${isOverdue ? "text-destructive" : ""}`}>{dueLabel}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Due Date</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <CheckCircle2 className={`h-4 w-4 mb-2 ${statusDot.replace("bg-", "text-")}`} />
              <p className="text-xs font-medium">{task.status}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Current Status</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Activity</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {taskLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {taskLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-semibold text-muted-foreground mt-0.5">
                    {(log.user_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{log.user_name || "Someone"}</span>
                      {" "}<span className="text-muted-foreground">{log.action}</span>
                      {" "}<span className="font-medium">{log.entity_name}</span>
                      {log.details && <span className="text-muted-foreground"> · {log.details}</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(log.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
        projects={projects}
        team={team}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          deleteTask.mutate(task.id);
          navigate("/tasks");
        }}
        title="Delete Task"
        description="This will permanently delete the task and cannot be undone."
      />
    </div>
  );
}
