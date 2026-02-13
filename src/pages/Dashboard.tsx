import { motion } from "framer-motion";
import { FolderKanban, ListTodo, DollarSign, Users, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockProjects, mockTasks, mockUsers, recentActivities } from "@/lib/mock-data";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const statusColors: Record<string, string> = {
  "Planning": "bg-warning/15 text-warning border-warning/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  "Completed": "bg-success/15 text-success border-success/30",
  "On Hold": "bg-muted text-muted-foreground border-muted",
};

const PIE_COLORS = ["hsl(243, 75%, 59%)", "hsl(167, 72%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)"];

export default function Dashboard() {
  const activeProjects = mockProjects.filter((p) => p.status !== "Completed").length;
  const activeTasks = mockTasks.filter((t) => t.status !== "Done").length;
  const totalBudgetProjected = mockProjects.reduce((s, p) => s + p.budgetProjected, 0);
  const totalBudgetActual = mockProjects.reduce((s, p) => s + p.budgetActual, 0);
  const budgetHealth = ((totalBudgetActual / totalBudgetProjected) * 100).toFixed(0);

  const budgetChartData = mockProjects.map((p) => ({
    name: p.name.split(" ").slice(0, 2).join(" "),
    Projected: p.budgetProjected / 1000,
    Actual: p.budgetActual / 1000,
  }));

  const taskDistribution = [
    { name: "To Do", value: mockTasks.filter((t) => t.status === "To Do").length },
    { name: "In Progress", value: mockTasks.filter((t) => t.status === "In Progress").length },
    { name: "Done", value: mockTasks.filter((t) => t.status === "Done").length },
  ];

  const cards = [
    { label: "Active Projects", value: activeProjects, icon: FolderKanban, trend: "+1 this month", up: true },
    { label: "Active Tasks", value: activeTasks, icon: ListTodo, trend: "3 due this week", up: false },
    { label: "Budget Used", value: `${budgetHealth}%`, icon: DollarSign, trend: `$${(totalBudgetActual / 1000).toFixed(0)}k of $${(totalBudgetProjected / 1000).toFixed(0)}k`, up: Number(budgetHealth) < 60 },
    { label: "Team Members", value: mockUsers.length, icon: Users, trend: "All active", up: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your piping projects</p>
      </div>

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

      {/* Projects + Activity */}
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
              {mockProjects.filter(p => p.status !== "Completed").map((project) => {
                const progress = Math.round((project.budgetActual / project.budgetProjected) * 100);
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
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>{" "}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.project} · {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
