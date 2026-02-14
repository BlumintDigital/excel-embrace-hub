import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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

  const tasksWithDates = useMemo(() => tasks.filter((t) => t.start_date && t.due_date), [tasks]);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasksWithDates.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    const dates = tasksWithDates.flatMap((t) => [new Date(t.start_date!), new Date(t.due_date!)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    return { minDate: min, maxDate: max, totalDays: Math.max((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24), 1) };
  }, [tasksWithDates]);

  const months = useMemo(() => {
    if (tasksWithDates.length === 0) return [];
    const result: { label: string; startPercent: number }[] = [];
    const d = new Date(minDate);
    d.setDate(1);
    while (d <= maxDate) {
      const offset = (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
      result.push({ label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), startPercent: Math.max(0, (offset / totalDays) * 100) });
      d.setMonth(d.getMonth() + 1);
    }
    return result;
  }, [minDate, maxDate, totalDays, tasksWithDates]);

  const groupedByProject = useMemo(() => {
    return projects.map((p) => ({
      project: p,
      tasks: tasksWithDates.filter((t) => t.project_id === p.id),
    })).filter((g) => g.tasks.length > 0);
  }, [projects, tasksWithDates]);

  if (lt || lp) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Timeline</h1>
        <p className="text-muted-foreground mt-1">Project schedule and milestones</p>
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
        <Card><CardContent className="p-8 text-center text-muted-foreground">No tasks with dates to display on the timeline.</CardContent></Card>
      ) : (
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
                      const start = (new Date(task.start_date!).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
                      const end = (new Date(task.due_date!).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
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
                            title={`${task.title} — ${assignee?.full_name || "Unassigned"}`}
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
      )}
    </div>
  );
}
