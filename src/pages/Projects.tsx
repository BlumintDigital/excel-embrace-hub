import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { mockProjects, mockTasks, mockUsers } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const statusColors: Record<string, string> = {
  "Planning": "bg-warning/15 text-warning border-warning/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  "Completed": "bg-success/15 text-success border-success/30",
  "On Hold": "bg-muted text-muted-foreground border-muted",
};

export default function Projects() {
  const [search, setSearch] = useState("");

  const filtered = mockProjects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">{mockProjects.length} total projects</p>
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

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((project, i) => {
          const progress = Math.round((project.budgetActual / project.budgetProjected) * 100);
          const taskCount = mockTasks.filter((t) => t.projectId === project.id).length;
          const doneTasks = mockTasks.filter((t) => t.projectId === project.id && t.status === "Done").length;
          const team = mockUsers.filter((u) => project.teamIds.includes(u.id));

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
                      <span>Budget: ${(project.budgetActual / 1000).toFixed(0)}k / ${(project.budgetProjected / 1000).toFixed(0)}k</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {team.slice(0, 4).map((u) => (
                        <Avatar key={u.id} className="h-7 w-7 border-2 border-card">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {u.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{doneTasks}/{taskCount} tasks done</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
