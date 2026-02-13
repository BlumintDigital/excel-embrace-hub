import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockUsers, mockProjects, mockTasks } from "@/lib/mock-data";
import { Mail, FolderKanban, ListTodo } from "lucide-react";

const roleColors: Record<string, string> = {
  "Admin": "bg-primary/15 text-primary border-primary/30",
  "Project Manager": "bg-warning/15 text-warning border-warning/30",
  "Team Member": "bg-accent/15 text-accent-foreground border-accent/30",
};

export default function Team() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground mt-1">{mockUsers.length} team members</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockUsers.map((user, i) => {
          const projectCount = mockProjects.filter((p) => p.teamIds.includes(user.id)).length;
          const taskCount = mockTasks.filter((t) => t.assigneeId === user.id).length;
          const activeTasks = mockTasks.filter((t) => t.assigneeId === user.id && t.status !== "Done").length;

          return (
            <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-heading font-semibold">{user.name}</h3>
                      <Badge variant="outline" className={`text-[10px] mt-0.5 ${roleColors[user.role]}`}>{user.role}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FolderKanban className="h-3.5 w-3.5" />
                      {projectCount} projects
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5" />
                      {activeTasks} active / {taskCount} total
                    </div>
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
