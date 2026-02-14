import { motion } from "framer-motion";
import { FolderKanban, ListTodo, DollarSign, Users, TrendingUp, TrendingDown, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useProjects, useTasks, useTeamMembers } from "@/hooks/use-supabase-data";

const statusColors: Record<string, string> = {
  "Planning": "bg-warning/15 text-warning border-warning/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  "Completed": "bg-success/15 text-success border-success/30",
  "On Hold": "bg-muted text-muted-foreground border-muted",
};

const PIE_COLORS = ["hsl(243, 75%, 59%)", "hsl(167, 72%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)"];

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { data: teamMembers = [], isLoading: loadingTeam } = useTeamMembers();

  const isLoading = loadingProjects || loadingTasks || loadingTeam;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status !== "Completed").length;
  const activeTasks = tasks.filter((t) => t.status !== "Done").length;
  const totalBudgetProjected = projects.reduce((s, p) => s + (p.budget_projected || 0), 0);
  const totalBudgetActual = projects.reduce((s, p) => s + (p.budget_actual || 0), 0);
  const budgetHealth = totalBudgetProjected > 0 ? ((totalBudgetActual / totalBudgetProjected) * 100).toFixed(0) : "0";

  const budgetChartData = projects.map((p) => ({
    name: p.name.split(" ").slice(0, 2).join(" "),
    Projected: (p.budget_projected || 0) / 1000,
    Actual: (p.budget_actual || 0) / 1000,
  }));

  const taskDistribution = [
    { name: "To Do", value: tasks.filter((t) => t.status === "To Do").length },
    { name: "In Progress", value: tasks.filter((t) => t.status === "In Progress").length },
    { name: "Done", value: tasks.filter((t) => t.status === "Done").length },
  ];

  const cards = [
    { label: "Active Projects", value: activeProjects, icon: FolderKanban, trend: `${projects.length} total`, up: true },
    { label: "Active Tasks", value: activeTasks, icon: ListTodo, trend: `${tasks.length} total`, up: false },
    { label: "Budget Used", value: `${budgetHealth}%`, icon: DollarSign, trend: `$${(totalBudgetActual / 1000).toFixed(0)}k of $${(totalBudgetProjected / 1000).toFixed(0)}k`, up: Number(budgetHealth) < 60 },
    { label: "Team Members", value: teamMembers.length, icon: Users, trend: "All active", up: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your piping projects</p>
      </div>

      {projects.length === 0 && tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold text-lg">No data yet</h3>
            <p className="text-muted-foreground mt-1">Create your first project to get started.</p>
            <Link to="/projects">
              <motion.div whileHover={{ scale: 1.02 }} className="inline-block mt-4">
                <Badge variant="default" className="cursor-pointer px-4 py-2">Go to Projects</Badge>
              </motion.div>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <card.icon className="h-5 w-5 text-primary" />
                      </div>
                      {card.up ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-warning" />}
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-heading font-bold">{card.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{card.trend}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Budget Overview (in $K)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={budgetChartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                      <Bar dataKey="Projected" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Actual" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Task Distribution</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={taskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {taskDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2">
                    {taskDistribution.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-xs">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                        {item.name} ({item.value})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Projects */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-lg">Active Projects</CardTitle>
                  <Link to="/projects" className="text-sm text-primary hover:underline flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.filter(p => p.status !== "Completed").slice(0, 5).map((project) => {
                    const progress = project.budget_projected > 0 ? Math.round(((project.budget_actual || 0) / project.budget_projected) * 100) : 0;
                    return (
                      <div key={project.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{project.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", statusColors[project.status])}>
                              {project.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{progress}% budget used</span>
                          </div>
                        </div>
                        <div className="h-2 w-20 rounded-full bg-muted overflow-hidden ml-4">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {projects.filter(p => p.status !== "Completed").length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active projects</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => {
                      const project = projects.find((p) => p.id === task.project_id);
                      return (
                        <div key={task.id} className="flex gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">{task.title}</span>{" "}
                              <Badge variant="secondary" className="text-[10px] ml-1">{task.status}</Badge>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {project?.name || "Unassigned"} · {task.priority} priority
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {tasks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
