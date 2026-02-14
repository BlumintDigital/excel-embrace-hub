import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, FolderKanban, ListTodo, Loader2 } from "lucide-react";
import { useTeamMembers, useProjectMembers, useTasks } from "@/hooks/use-supabase-data";

const roleColors: Record<string, string> = {
  admin: "bg-primary/15 text-primary border-primary/30",
  project_manager: "bg-warning/15 text-warning border-warning/30",
  team_member: "bg-accent/15 text-accent-foreground border-accent/30",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
};

export default function Team() {
  const { data: members = [], isLoading } = useTeamMembers();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: tasks = [] } = useTasks();

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground mt-1">{members.length} team members</p>
      </div>

      {members.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No team members yet. Invite users to join your team.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((user, i) => {
            const projectCount = projectMembers.filter((pm) => pm.user_id === user.id).length;
            const userTasks = tasks.filter((t) => t.assignee_id === user.id);
            const activeTasks = userTasks.filter((t) => t.status !== "Done").length;
            const role = user.app_role || "team_member";

            return (
              <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(user.full_name || "?").split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-heading font-semibold">{user.full_name || "Unknown"}</h3>
                        <Badge variant="outline" className={`text-[10px] mt-0.5 ${roleColors[role] || roleColors.team_member}`}>
                          {roleLabels[role] || role}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {user.email || "No email"}
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {projectCount} projects
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ListTodo className="h-3.5 w-3.5" />
                        {activeTasks} active / {userTasks.length} total
                      </div>
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
