import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTasks, useProjects, useTeamMembers } from "@/hooks/use-supabase-data";

const statusColors: Record<string, string> = {
  "To Do": "hsl(38, 92%, 50%)",
  "In Progress": "hsl(243, 75%, 59%)",
  "Done": "hsl(142, 76%, 36%)",
};

export default function Timeline() {
  const { data: tasks = [], isLoading: lt } = useTasks();
  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: team = [] } = useTeamMembers();
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const normalizedTasks = useMemo(() => {
    const base = selectedProject === "all" ? tasks : tasks.filter((t) => t.project_id === selectedProject);
    return base.map((t) => {
      const start = t.start_date
        ? new Date(t.start_date)
        : t.due_date
          ? new Date(new Date(t.due_date).getTime() - 7 * 24 * 60 * 60 * 1000)
          : new Date(t.created_at);
      const end = t.due_date
        ? new Date(t.due_date)
        : t.start_date
          ? new Date(new Date(t.start_date).getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      return { ...t, _start: start, _end: end };
    });
  }, [tasks, selectedProject]);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (normalizedTasks.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    const allDates = normalizedTasks.flatMap((t) => [t._start, t._end]);
    const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
    return { minDate: min, maxDate: max, totalDays: Math.max((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24), 1) };
  }, [normalizedTasks]);

  const months = useMemo(() => {
    if (normalizedTasks.length === 0) return [];
    const result: { label: string; startPercent: number }[] = [];
    const d = new Date(minDate);
    d.setDate(1);
    while (d <= maxDate) {
      const offset = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      result.push({ label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), startPercent: Math.max(0, (offset / totalDays) * 100) });
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalDays, normalizedTasks]);

  const groupedByProject = useMemo(() => {
    const grouped = projects
      .filter((p) => selectedProject === "all" || p.id === selectedProject)
      .map((p) => ({
        project: p,
        tasks: normalizedTasks.filter((t) => t.project_id === p.id),
      })).filter((g) => g.tasks.length > 0);

    const unassigned = normalizedTasks.filter((t) => !t.project_id);
    if (unassigned.length > 0) {
      grouped.push({ project: { id: "__unassigned", name: "Unassigned" } as any, tasks: unassigned });
    }
    return grouped;
  }, [projects, normalizedTasks, selectedProject]);

  if (lt || lp) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Timeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Project schedule and milestones</p>
        </div>
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
      </div>

      <div className="flex gap-4 text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded" style={{ background: color }} />
            {status}
          </div>
        ))}
      </div>

      {groupedByProject.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No tasks to display on the timeline.</CardContent></Card>
      ) : (
        <>
          {/* Mobile list view */}
          <div className="lg:hidden space-y-4">
            {groupedByProject.map(({ project, tasks: pTasks }) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <h3 className="font-heading font-semibold text-sm mb-3 text-foreground">{project.name}</h3>
                  <div className="space-y-2">
                    {pTasks.map((task) => {
                      const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                      return (
                        <div key={task.id} className="flex items-start gap-2.5 py-1.5 border-b border-border last:border-0">
                          <div
                            className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                            style={{ background: statusColors[task.status] || statusColors["To Do"] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {fmt(task._start)} – {fmt(task._end)}
                              {(!task.start_date || !task.due_date) && " (est.)"}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{task.status}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Gantt chart */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-4 overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="relative h-8 border-b mb-2">
                    {months.map((m) => (
                      <div key={m.label} className="absolute text-xs text-muted-foreground font-medium" style={{ left: `${m.startPercent}%` }}>
                        {m.label}
                      </div>
                    ))}
                  </div>

                  {groupedByProject.map(({ project, tasks: pTasks }) => (
                    <div key={project.id} className="mb-6">
                      <h3 className="font-heading font-semibold text-sm mb-2">{project.name}</h3>
                      <div className="space-y-1.5">
                        {pTasks.map((task, i) => {
                          const start = (task._start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                          const end = (task._end.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                          const left = (start / totalDays) * 100;
                          const width = ((end - start) / totalDays) * 100;
                          const assignee = team.find((u) => u.id === task.assignee_id);

                          return (
                            <motion.div
                              key={task.id}
                              className="relative flex items-center h-8"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                            >
                              <div
                                className="absolute h-6 rounded-md flex items-center px-2 text-[10px] font-medium text-white truncate cursor-pointer hover:opacity-90 transition-opacity"
                                style={{
                                  left: `${left}%`,
                                  width: `${Math.max(width, 2)}%`,
                                  background: statusColors[task.status] || statusColors["To Do"],
                                }}
                                title={`${task.title} — ${assignee?.full_name || "Unassigned"}${!task.start_date || !task.due_date ? " (estimated dates)" : ""}`}
                              >
                                {width > 8 && task.title}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}