import { useState } from "react";
import { motion } from "framer-motion";
import { FolderKanban, ListTodo, DollarSign, Users, TrendingUp, TrendingDown, ArrowRight, Plus } from "lucide-react";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Label } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useProjects, useTasks, useTeamMembers, useBudgetCategories } from "@/hooks/use-supabase-data";
import { useWorkspace, CURRENCIES } from "@/contexts/WorkspaceContext";
import { STATUS_DOT_COLORS, STATUS_BADGE_CLASSES, PRIORITY_DOT_COLORS, CHART_COLORS } from "@/lib/status-config";

export default function Dashboard() {
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teamMembers = [], isLoading: loadingTeam } = useTeamMembers();
  const { data: categories = [] } = useBudgetCategories(
    selectedProject !== "all" ? selectedProject : ""
  );
  const { settings } = useWorkspace();
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];
  const fmt = (v: number) => `${cur.symbol}${v.toLocaleString()}`;

  const isLoading = loadingProjects || loadingTasks || loadingTeam;

  if (isLoading) return <DashboardSkeleton />;

  // --- Stat card totals always reflect ALL projects ---
  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const activeTasks = tasks.filter((t) => t.status !== "Done").length;

  // Budget card is filter-aware
  const selectedProjectObj = selectedProject !== "all"
    ? projects.find((p) => p.id === selectedProject)
    : null;
  const displayBudgetProjected = selectedProjectObj
    ? (selectedProjectObj.budget_projected || 0)
    : projects.reduce((s, p) => s + (p.budget_projected || 0), 0);
  const displayBudgetActual = selectedProjectObj
    ? (selectedProjectObj.budget_actual || 0)
    : projects.reduce((s, p) => s + (p.budget_actual || 0), 0);
  const budgetHealth = displayBudgetProjected > 0
    ? (displayBudgetActual / displayBudgetProjected * 100).toFixed(0)
    : "0";
  const budgetPct = Number(budgetHealth);

  // --- Filtered data for charts ---
  const filteredTasks = selectedProject === "all"
    ? tasks
    : tasks.filter((t) => t.project_id === selectedProject);

  // Budget chart: all projects (Projected vs Actual per project) OR categories for selected project
  const budgetChartData = selectedProject === "all"
    ? projects.map((p) => ({
        name: p.name.split(" ").slice(0, 2).join(" "),
        Projected: p.budget_projected || 0,
        Actual: p.budget_actual || 0,
      }))
    : categories.map((c) => ({
        name: c.name,
        Projected: c.projected || 0,
        Actual: c.actual || 0,
      }));

  const taskDistribution = [
    { name: "To Do", value: filteredTasks.filter((t) => t.status === "To Do").length },
    { name: "In Progress", value: filteredTasks.filter((t) => t.status === "In Progress").length },
    { name: "Done", value: filteredTasks.filter((t) => t.status === "Done").length },
  ];
  const totalFilteredTasks = filteredTasks.length;

  const selectedProjectName = projects.find((p) => p.id === selectedProject)?.name;

  const budgetChartConfig = {
    Projected: { label: "Projected", color: "hsl(var(--primary))" },
    Actual:    { label: "Actual",    color: "hsl(var(--muted-foreground) / 0.35)" },
  } satisfies ChartConfig;

  const taskChartConfig = {
    "To Do":       { label: "To Do",       color: CHART_COLORS[0] },
    "In Progress": { label: "In Progress", color: CHART_COLORS[1] },
    "Done":        { label: "Done",        color: CHART_COLORS[2] },
  } satisfies ChartConfig;

  const cards = [
    { label: "Active Projects", value: activeProjects, icon: FolderKanban, sub: `${projects.length} total`, up: true },
    { label: "Active Tasks", value: activeTasks, icon: ListTodo, sub: `${tasks.length} total`, up: false },
    { label: "Team Members", value: teamMembers.length, icon: Users, sub: "All active", up: true },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        subtitle="Workspace overview"
        action={
          <Link to="/projects">
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Button>
          </Link>
        }
      />

      {projects.length === 0 && tasks.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="py-20 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-5">
              <FolderKanban className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-heading font-semibold text-lg">Welcome to your workspace</h3>
              <p className="text-sm text-muted-foreground">
                Create your first project to start tracking work, budgets, and your team's progress.
              </p>
            </div>
            <Link to="/projects">
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Create first project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <card.icon className="h-4 w-4 text-muted-foreground" />
                      {card.up
                        ? <TrendingUp className="h-3.5 w-3.5 text-success" />
                        : <TrendingDown className="h-3.5 w-3.5 text-warning" />
                      }
                    </div>
                    <p className="text-2xl font-semibold font-heading">{card.value}</p>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">{card.label}</p>
                    <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Budget Used card — per-project when "all", single project when filtered */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
            >
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {budgetPct < 60
                      ? <TrendingUp className="h-3.5 w-3.5 text-success" />
                      : <TrendingDown className="h-3.5 w-3.5 text-warning" />
                    }
                  </div>
                  {selectedProject === "all" ? (
                    <>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Budget by Project</p>
                      <div className="space-y-2">
                        {projects.slice(0, 4).map((p) => {
                          const pct = p.budget_projected > 0
                            ? Math.round((p.budget_actual || 0) / p.budget_projected * 100) : 0;
                          return (
                            <div key={p.id}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="truncate max-w-[110px] text-muted-foreground">{p.name}</span>
                                <span className={`font-medium ${pct > 85 ? "text-destructive" : pct > 60 ? "text-warning" : "text-success"}`}>{pct}%</span>
                              </div>
                              <Progress
                                value={Math.min(pct, 100)}
                                className={cn("h-1", pct > 85 ? "[&>*]:bg-destructive" : pct > 60 ? "[&>*]:bg-warning" : "[&>*]:bg-success")}
                              />
                            </div>
                          );
                        })}
                        {projects.length === 0 && <p className="text-xs text-muted-foreground">No projects</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-semibold font-heading">{budgetHealth}%</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Budget Used</p>
                      <p className="text-xs text-muted-foreground mt-2">{fmt(displayBudgetActual)} of {fmt(displayBudgetProjected)}</p>
                      <Progress
                        value={Math.min(budgetPct, 100)}
                        className={cn(
                          "mt-3 h-1.5",
                          budgetPct > 85 ? "[&>*]:bg-destructive" : budgetPct > 60 ? "[&>*]:bg-warning" : "[&>*]:bg-success"
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts section header with project filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Budget & Tasks</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedProject === "all"
                  ? "Showing all projects"
                  : selectedProjectName
                }
              </p>
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-full sm:w-48 h-8 text-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Budget Bar Chart */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
            >
              <Card>
                <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2">
                  <CardTitle className="text-sm font-semibold">
                    {selectedProject === "all" ? "Budget by Project" : "Budget by Category"} ({cur.code})
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-primary inline-block" />
                      Projected
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm bg-muted-foreground/40 inline-block" />
                      Actual
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {budgetChartData.length === 0 ? (
                    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                      No budget data for this project yet
                    </div>
                  ) : (
                    <ChartContainer config={budgetChartConfig} className="h-[260px] w-full">
                      <BarChart data={budgetChartData} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis
                          width={55}
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(v) => {
                            const num = v as number;
                            if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
                            if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
                            return num.toString();
                          }}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => <span>{fmt(Number(value))}</span>}
                            />
                          }
                        />
                        <Bar dataKey="Projected" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Actual" fill="hsl(var(--muted-foreground) / 0.35)" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Task Donut */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Task Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {totalFilteredTasks === 0 ? (
                    <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                      No tasks for this project
                    </div>
                  ) : (
                    <ChartContainer config={taskChartConfig} className="h-[180px] w-full">
                      <PieChart>
                        <Pie
                          data={taskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {taskDistribution.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i]} />
                          ))}
                          <Label
                            value={totalFilteredTasks}
                            position="center"
                            style={{
                              fontSize: "1.25rem",
                              fontWeight: 600,
                              fill: "hsl(var(--foreground))",
                              fontFamily: "var(--font-heading)",
                            }}
                          />
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      </PieChart>
                    </ChartContainer>
                  )}
                  {totalFilteredTasks > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground -mt-1 mb-3">total tasks</p>
                      <div className="grid grid-cols-3 gap-2 w-full">
                        {taskDistribution.map((item, i) => (
                          <div key={item.name} className="flex flex-col items-center gap-1 rounded-md border border-border px-2 py-2">
                            <div className="h-1.5 w-1.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                            <span className="text-[10px] text-muted-foreground">{item.name}</span>
                            <span className="text-sm font-semibold font-heading">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Projects + Tasks Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active Projects */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
                  <Link to="/projects" className="flex items-center gap-1 text-xs text-primary hover:underline">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  {projects.filter((p) => p.status !== "Completed").slice(0, 5).map((project, idx, arr) => {
                    const progress = project.budget_projected > 0
                      ? Math.round((project.budget_actual || 0) / project.budget_projected * 100)
                      : 0;
                    const openTasks = tasks.filter(
                      (t) => t.project_id === project.id && t.status !== "Done"
                    ).length;
                    const dotColor = STATUS_DOT_COLORS[project.status] || "bg-muted-foreground";
                    const isSelected = selectedProject === project.id;
                    return (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(isSelected ? "all" : project.id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/40"} ${idx < arr.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                            <p className="text-sm font-medium truncate" title={project.name}>{project.name}</p>
                            {isSelected && (
                              <span className="text-[10px] text-primary font-medium shrink-0">viewing</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
                            {openTasks} open task{openTasks !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                          <span className="text-xs text-muted-foreground">{progress}%</span>
                          <Progress
                            value={Math.min(progress, 100)}
                            className={cn(
                              "h-1.5 w-16",
                              progress > 85
                                ? "[&>*]:bg-destructive"
                                : progress > 60
                                ? "[&>*]:bg-warning"
                                : "[&>*]:bg-success"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {projects.filter((p) => p.status !== "Completed").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No active projects</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Tasks */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46 }}
            >
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold">Recent Tasks</CardTitle>
                  {selectedProject !== "all" && (
                    <span className="text-xs text-muted-foreground">
                      {selectedProjectName}
                    </span>
                  )}
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  {filteredTasks.slice(0, 5).map((task, idx, arr) => {
                    const project = projects.find((p) => p.id === task.project_id);
                    const priorityDot = PRIORITY_DOT_COLORS[task.priority] || "bg-muted-foreground";
                    const statusBadge = STATUS_BADGE_CLASSES[task.status] || "bg-muted text-muted-foreground border-border";
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors ${idx < arr.length - 1 ? "border-b border-border" : ""}`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${priorityDot}`} />
                            <p className="text-sm font-medium truncate">{task.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">
                            {selectedProject === "all" ? (project?.name || "Unassigned") : `${task.priority} priority`}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 shrink-0 ml-3 ${statusBadge}`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No tasks yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
