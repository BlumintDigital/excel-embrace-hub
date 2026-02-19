import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2, Plus, Search, MoreHorizontal, Pencil, Trash2,
  Users, FileText, Upload, Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { PageHeader } from "@/components/layout/PageHeader";
import { MemberHoverCard } from "@/components/MemberHoverCard";
import { cn } from "@/lib/utils";
import {
  useProjects, useTasks, useBudgetCategories, useDocuments,
  useProjectMembers, useTeamMembers, useClients,
  type DbTask, type DbBudgetCategory,
} from "@/hooks/use-supabase-data";
import {
  useUpdateTask, useDeleteTask,
  useDeleteBudgetCategory,
  useDeleteDocument,
} from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { useWorkspace, CURRENCIES } from "@/contexts/WorkspaceContext";
import {
  STATUS_BADGE_CLASSES, STATUS_DOT_COLORS,
  PRIORITY_BADGE_CLASSES, PRIORITY_DOT_COLORS,
  ROLE_BADGE_CLASSES, ROLE_LABELS,
  CHART_COLORS,
} from "@/lib/status-config";
import ProjectDialog from "@/components/dialogs/ProjectDialog";
import TaskDialog from "@/components/dialogs/TaskDialog";
import BudgetCategoryDialog from "@/components/dialogs/BudgetCategoryDialog";
import DocumentDialog from "@/components/dialogs/DocumentDialog";
import ProjectMembersDialog from "@/components/dialogs/ProjectMembersDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

const PIE_COLORS = CHART_COLORS;
const TASK_COLUMNS = ["To Do", "In Progress", "Done"] as const;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();

  // ── Data hooks ────────────────────────────────────────────────────────────
  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: allTasks = [], isLoading: lt } = useTasks();
  const { data: categories = [], isLoading: lb } = useBudgetCategories(id);
  const { data: allDocuments = [], isLoading: ld } = useDocuments();
  const { data: allProjectMembers = [], isLoading: lpm } = useProjectMembers();
  const { data: teamMembers = [] } = useTeamMembers();
  const { data: clients = [] } = useClients();

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const deleteBudgetCat = useDeleteBudgetCategory();
  const deleteDocument = useDeleteDocument();

  // ── Permissions & workspace ───────────────────────────────────────────────
  const { canCreateTasks, canEditAllTasks, canDeleteAllTasks, canManageBudget, canEditAllProjects } = usePermissions();
  const { settings } = useWorkspace();
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];
  const fmt = (v: number) => `${cur.symbol}${v.toLocaleString()}`;

  // ── Local state ───────────────────────────────────────────────────────────
  const [taskView, setTaskView] = useState<"board" | "list">("board");
  const [taskSearch, setTaskSearch] = useState("");
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<DbTask | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<DbBudgetCategory | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  // ── Derived / computed (must be before early returns) ─────────────────────
  const projectTasks = allTasks.filter((t) => t.project_id === id);
  const filteredTasks = projectTasks.filter((t) =>
    t.title.toLowerCase().includes(taskSearch.toLowerCase())
  );
  const projectDocuments = allDocuments.filter((d) => d.project_id === id);
  const projectMemberRows = allProjectMembers.filter((m) => m.project_id === id);

  const totalProjected = categories.reduce((s, c) => s + (c.projected || 0), 0);
  const totalActual = categories.reduce((s, c) => s + (c.actual || 0), 0);
  const difference = totalProjected - totalActual;
  const barData = categories.map((c) => ({
    name: c.name,
    Projected: (c.projected || 0) / 1000,
    Actual: (c.actual || 0) / 1000,
  }));
  const pieData = categories.map((c) => ({ name: c.name, value: c.actual || 0 }));

  const barConfig = {
    Projected: { label: "Projected", color: "hsl(var(--primary))" },
    Actual:    { label: "Actual",    color: "hsl(var(--accent))" },
  } satisfies ChartConfig;
  const pieConfig = { value: { label: "Amount" } } satisfies ChartConfig;

  // ── Loading gate ──────────────────────────────────────────────────────────
  if (lp || lt || lb || ld || lpm) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Not-found gate ────────────────────────────────────────────────────────
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <PageHeader title="Project Not Found" parent={{ label: "Projects", href: "/projects" }} />
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <p className="text-sm text-muted-foreground">This project doesn't exist or you don't have access.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/projects">Back to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Post-guard computations ───────────────────────────────────────────────
  const client = clients.find((c) => c.id === project.client_id);
  const doneTasks = projectTasks.filter((t) => t.status === "Done").length;
  const budgetPercent = project.budget_projected > 0
    ? Math.round(((project.budget_actual || 0) / project.budget_projected) * 100)
    : 0;
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const getMember = (assigneeId: string | null) =>
    assigneeId ? teamMembers.find((u) => u.id === assigneeId) : undefined;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <PageHeader
        title={project.name}
        parent={{ label: "Projects", href: "/projects" }}
        action={canEditAllProjects ? (
          <Button size="sm" variant="outline" onClick={() => setEditProjectOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit Project
          </Button>
        ) : undefined}
      />

      {/* Project meta */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_BADGE_CLASSES[project.status] || STATUS_BADGE_CLASSES["Planning"]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[project.status] || "bg-muted-foreground"}`} />
              {project.status}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
            </div>
            {client && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/40">
                {client.name}
              </span>
            )}
            {project.description && (
              <p className="w-full text-sm text-muted-foreground pt-1">{project.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tasks</p>
              <span className="text-lg font-semibold font-heading">{doneTasks}/{projectTasks.length}</span>
            </div>
            <Progress
              value={projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0}
              className="h-1.5 [&>*]:bg-primary"
            />
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Budget</p>
              <span className="text-lg font-semibold font-heading">{budgetPercent}%</span>
            </div>
            <Progress
              value={Math.min(budgetPercent, 100)}
              className={cn("h-1.5", budgetPercent > 100 ? "[&>*]:bg-destructive" : budgetPercent > 80 ? "[&>*]:bg-warning" : "[&>*]:bg-success")}
            />
            <p className="text-xs text-muted-foreground">
              {cur.symbol}{((project.budget_actual || 0) / 1000).toFixed(0)}k of {cur.symbol}{(project.budget_projected / 1000).toFixed(0)}k used
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Team</p>
              <span className="text-lg font-semibold font-heading">{projectMemberRows.length}</span>
            </div>
            <div className="flex -space-x-1.5 py-0.5">
              {projectMemberRows.slice(0, 7).map((row) => {
                const u = teamMembers.find((t) => t.id === row.user_id);
                if (!u) return null;
                return (
                  <Avatar key={row.id} className="h-6 w-6 border-2 border-card">
                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                      {(u.full_name || "?").split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">members</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════
            TASKS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8 h-8 text-sm"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
              />
            </div>
            {/* Board / List toggle */}
            <div className="flex rounded-md border border-input overflow-hidden shrink-0">
              <Button
                variant={taskView === "board" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-none text-xs px-3"
                onClick={() => setTaskView("board")}
              >Board</Button>
              <Button
                variant={taskView === "list" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 rounded-none border-l text-xs px-3"
                onClick={() => setTaskView("list")}
              >List</Button>
            </div>
            {canCreateTasks && (
              <Button size="sm" className="h-8 shrink-0" onClick={() => { setEditTask(null); setTaskDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />New Task
              </Button>
            )}
          </div>

          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {taskSearch ? `No tasks match "${taskSearch}".` : "No tasks for this project yet."}
                </p>
                {!taskSearch && canCreateTasks && (
                  <Button size="sm" onClick={() => { setEditTask(null); setTaskDialogOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Add Task
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : taskView === "board" ? (
            /* ── Board view ── */
            <div className="grid gap-4 md:grid-cols-3">
              {TASK_COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col);
                return (
                  <div key={col} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[col] || "bg-muted-foreground"}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{colTasks.length}</span>
                    </div>
                    <div className="space-y-2 min-h-[60px]">
                      {colTasks.map((task) => {
                        const assignee = getMember(task.assignee_id);
                        return (
                          <Card key={task.id} className="hover:shadow-sm transition-shadow">
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${PRIORITY_DOT_COLORS[task.priority] || "bg-muted-foreground"}`} />
                                  <p className="text-xs font-medium leading-snug">{task.title}</p>
                                </div>
                                {(canEditAllTasks || canDeleteAllTasks) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {canEditAllTasks && (
                                        <DropdownMenuItem onClick={() => { setEditTask(task); setTaskDialogOpen(true); }}>
                                          <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                                        </DropdownMenuItem>
                                      )}
                                      {canDeleteAllTasks && (
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTaskId(task.id)}>
                                          <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                {assignee ? (
                                  <div className="flex items-center gap-1.5">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-[8px] bg-muted">
                                        {(assignee.full_name || "?").split(" ").map((n) => n[0]).join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-[10px] text-muted-foreground">
                                      {(assignee.full_name || "").split(" ")[0]}
                                    </span>
                                  </div>
                                ) : <span />}
                                {task.due_date && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer ${STATUS_BADGE_CLASSES[task.status] || STATUS_BADGE_CLASSES["To Do"]}`}>
                                    {task.status}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {TASK_COLUMNS.map((s) => (
                                    <DropdownMenuItem key={s} onClick={() => updateTask.mutate({ id: task.id, status: s })}>
                                      {s}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {colTasks.length === 0 && (
                        <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                          Empty
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── List view ── */
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="p-3 font-medium">Title</th>
                      <th className="p-3 font-medium">Priority</th>
                      <th className="p-3 font-medium hidden sm:table-cell">Assignee</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium hidden sm:table-cell">Due</th>
                      <th className="p-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => {
                      const assignee = getMember(task.assignee_id);
                      return (
                        <tr key={task.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="p-3 text-sm font-medium max-w-[200px] truncate">{task.title}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${PRIORITY_BADGE_CLASSES[task.priority] || ""}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            {assignee ? (
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[8px] bg-muted">
                                    {(assignee.full_name || "?").split(" ").map((n) => n[0]).join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{assignee.full_name}</span>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="p-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer ${STATUS_BADGE_CLASSES[task.status] || STATUS_BADGE_CLASSES["To Do"]}`}>
                                  {task.status}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {TASK_COLUMNS.map((s) => (
                                  <DropdownMenuItem key={s} onClick={() => updateTask.mutate({ id: task.id, status: s })}>
                                    {s}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground hidden sm:table-cell">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                          </td>
                          <td className="p-3">
                            {(canEditAllTasks || canDeleteAllTasks) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {canEditAllTasks && (
                                    <DropdownMenuItem onClick={() => { setEditTask(task); setTaskDialogOpen(true); }}>
                                      <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                                    </DropdownMenuItem>
                                  )}
                                  {canDeleteAllTasks && (
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTaskId(task.id)}>
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            BUDGET TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="budget" className="space-y-6">
          {canManageBudget && (
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setEditCat(null); setBudgetDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Add Category
              </Button>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Projected Budget", value: `${cur.symbol}${(totalProjected / 1000).toFixed(0)}k` },
              { label: "Actual Spent", value: `${cur.symbol}${(totalActual / 1000).toFixed(0)}k` },
              { label: "Remaining", value: `${difference >= 0 ? "+" : ""}${cur.symbol}${(Math.abs(difference) / 1000).toFixed(0)}k`, warn: difference < 0 },
            ].map((card) => (
              <Card key={card.label}>
                <CardContent className="p-5">
                  <p className={`text-2xl font-semibold font-heading ${card.warn ? "text-destructive" : ""}`}>{card.value}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {categories.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center gap-3">
                <p className="text-sm text-muted-foreground">No budget categories yet. Add one to start tracking.</p>
                {canManageBudget && (
                  <Button size="sm" onClick={() => { setEditCat(null); setBudgetDialogOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />Add Category
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-base">Category Comparison (in {cur.code})</CardTitle></CardHeader>
                  <CardContent>
                    <ChartContainer config={barConfig} className="h-[260px] w-full">
                      <BarChart data={barData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}k`} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => <span>{`${cur.symbol}${value}k`}</span>} />} />
                        <Bar dataKey="Projected" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Actual" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <ChartContainer config={pieConfig} className="h-[200px] w-full">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={78} paddingAngle={3} dataKey="value">
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => <span>{`${cur.symbol}${(Number(value) / 1000).toFixed(1)}k`}</span>} />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap gap-2 justify-center mt-1">
                      {pieData.map((item, i) => (
                        <div key={item.name} className="flex items-center gap-1 text-xs">
                          <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {item.name}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category table */}
              <Card>
                <CardHeader><CardTitle className="text-base">Budget Details</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="p-3 font-medium">Category</th>
                          <th className="p-3 font-medium text-right">Projected</th>
                          <th className="p-3 font-medium text-right">Actual</th>
                          <th className="p-3 font-medium text-right">Difference</th>
                          <th className="p-3 font-medium text-right">% Used</th>
                          <th className="p-3 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => {
                          const diff = (cat.projected || 0) - (cat.actual || 0);
                          const pct = cat.projected > 0 ? Math.round(((cat.actual || 0) / cat.projected) * 100) : 0;
                          return (
                            <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/50">
                              <td className="p-3 text-sm font-medium">{cat.name}</td>
                              <td className="p-3 text-sm text-right">{fmt(cat.projected || 0)}</td>
                              <td className="p-3 text-sm text-right">{fmt(cat.actual || 0)}</td>
                              <td className={`p-3 text-sm text-right font-medium ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                                {diff >= 0 ? "+" : ""}{fmt(diff)}
                              </td>
                              <td className="p-3 text-sm text-right">{pct}%</td>
                              <td className="p-3">
                                {canManageBudget && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => { setEditCat(cat); setBudgetDialogOpen(true); }}>
                                        <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteCatId(cat.id)}>
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            TEAM TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="team" className="space-y-4">
          {canEditAllProjects && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setMembersDialogOpen(true)}>
                <Users className="h-3.5 w-3.5 mr-1.5" />Manage Members
              </Button>
            </div>
          )}

          {projectMemberRows.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No members on this project yet.</p>
                {canEditAllProjects && (
                  <Button size="sm" variant="outline" onClick={() => setMembersDialogOpen(true)}>
                    Add Members
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projectMemberRows.map((row) => {
                const member = teamMembers.find((t) => t.id === row.user_id);
                if (!member) return null;
                const activeTasks = allTasks.filter((t) => t.assignee_id === member.id && t.status !== "Done").length;
                return (
                  <Card key={row.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <MemberHoverCard member={member} activeTasks={activeTasks}>
                        <Avatar className="h-10 w-10 cursor-pointer shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {(member.full_name || "?").split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      </MemberHoverCard>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{member.full_name || "—"}</p>
                        {member.email && <p className="text-xs text-muted-foreground truncate">{member.email}</p>}
                        {row.role && (
                          <span className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_BADGE_CLASSES[row.role] || ROLE_BADGE_CLASSES["team_member"]}`}>
                            {ROLE_LABELS[row.role] || row.role}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════
            DOCUMENTS TAB
        ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setDocDialogOpen(true)}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />Upload
            </Button>
          </div>

          {projectDocuments.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No documents uploaded for this project yet.</p>
                <Button size="sm" onClick={() => setDocDialogOpen(true)}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projectDocuments.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium leading-tight truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            {doc.category}
                          </span>
                        )}
                        {doc.size != null && (
                          <span className="text-[10px] text-muted-foreground">
                            {doc.size < 1024 * 1024
                              ? `${(doc.size / 1024).toFixed(0)} KB`
                              : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteDocId(doc.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      <ProjectDialog open={editProjectOpen} onOpenChange={setEditProjectOpen} project={project} />
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editTask}
        projects={projects}
        team={teamMembers}
        defaultProjectId={id}
      />
      <BudgetCategoryDialog
        open={budgetDialogOpen}
        onOpenChange={setBudgetDialogOpen}
        category={editCat}
        projectId={id!}
      />
      <DocumentDialog
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
        projects={projects}
      />
      <ProjectMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        projectId={id!}
        projectName={project.name}
        team={teamMembers}
        members={allProjectMembers}
      />
      <DeleteConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={() => setDeleteTaskId(null)}
        onConfirm={() => { if (deleteTaskId) { deleteTask.mutate(deleteTaskId); setDeleteTaskId(null); } }}
        title="Delete Task"
      />
      <DeleteConfirmDialog
        open={!!deleteCatId}
        onOpenChange={() => setDeleteCatId(null)}
        onConfirm={() => { if (deleteCatId) { deleteBudgetCat.mutate(deleteCatId); setDeleteCatId(null); } }}
        title="Delete Category"
      />
      <DeleteConfirmDialog
        open={!!deleteDocId}
        onOpenChange={() => setDeleteDocId(null)}
        onConfirm={() => { if (deleteDocId) { deleteDocument.mutate(deleteDocId); setDeleteDocId(null); } }}
        title="Delete Document"
      />
    </div>
  );
}
