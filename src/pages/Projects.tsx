import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProjects, useTasks, useProjectMembers, useTeamMembers } from "@/hooks/use-supabase-data";

const statusColors: Record<string, string> = {
  "Planning": "bg-warning/15 text-warning border-warning/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  "Completed": "bg-success/15 text-success border-success/30",
  "On Hold": "bg-muted text-muted-foreground border-muted",
};

export default function Projects() {
  const [search, setSearch] = useState("");
  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useProjectMembers();
  const { data: team = [] } = useTeamMembers();

  if (lp) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">{projects.length} total projects</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      {filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No projects found. Create your first project to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((project, i) => {
            const progress = project.budget_projected > 0 ? Math.round(((project.budget_actual || 0) / project.budget_projected) * 100) : 0;
            const projectTasks = tasks.filter((t) => t.project_id === project.id);
            const doneTasks = projectTasks.filter((t) => t.status === "Done").length;
            const projectMembers = members.filter((m) => m.project_id === project.id);
            const projectTeam = team.filter((u) => projectMembers.some((m) => m.user_id === u.id));

            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-heading font-semibold">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                      </div>
                      <Badge variant="outline" className={statusColors[project.status]}>{project.status}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Budget: ${((project.budget_actual || 0) / 1000).toFixed(0)}k / ${((project.budget_projected || 0) / 1000).toFixed(0)}k</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {projectTeam.slice(0, 4).map((u) => (
                          <Avatar key={u.id} className="h-7 w-7 border-2 border-card">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {(u.full_name || "?").split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{doneTasks}/{projectTasks.length} tasks done</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
