import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Mail, FolderKanban, ListTodo, Loader2, Plus, MoreHorizontal, Shield, ShieldCheck, UserCog, Trash2 } from "lucide-react";
import { useTeamMembers, useProjectMembers, useTasks } from "@/hooks/use-supabase-data";
import { useUpdateUserRole, useDeleteUser } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/AuthContext";
import InviteUserDialog from "@/components/dialogs/InviteUserDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

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
  const { canManageUsers, canAssignRoles } = usePermissions();
  const { user } = useAuth();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">{members.length} team members</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Invite User
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No team members yet. Invite users to join your team.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member, i) => {
            const projectCount = projectMembers.filter((pm) => pm.user_id === member.id).length;
            const userTasks = tasks.filter((t) => t.assignee_id === member.id);
            const activeTasks = userTasks.filter((t) => t.status !== "Done").length;
            const role = member.app_role || "team_member";
            const isSelf = member.id === user?.id;

            return (
              <motion.div key={member.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {(member.full_name || "?").split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-heading font-semibold">
                            {member.full_name || "Unknown"}
                            {isSelf && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                          </h3>
                          <Badge variant="outline" className={`text-[10px] mt-0.5 ${roleColors[role] || roleColors.team_member}`}>
                            {roleLabels[role] || role}
                          </Badge>
                        </div>
                      </div>

                      {(canAssignRoles || canManageUsers) && !isSelf && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canAssignRoles && (
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UserCog className="h-3.5 w-3.5 mr-2" />Change Role
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuItem
                                    disabled={role === "admin"}
                                    onClick={() => updateRole.mutate({ user_id: member.id, role: "admin" })}
                                  >
                                    <ShieldCheck className="h-3.5 w-3.5 mr-2" />Admin
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={role === "project_manager"}
                                    onClick={() => updateRole.mutate({ user_id: member.id, role: "project_manager" })}
                                  >
                                    <Shield className="h-3.5 w-3.5 mr-2" />Project Manager
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={role === "team_member"}
                                    onClick={() => updateRole.mutate({ user_id: member.id, role: "team_member" })}
                                  >
                                    <UserCog className="h-3.5 w-3.5 mr-2" />Team Member
                                  </DropdownMenuItem>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )}
                            {canManageUsers && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteUserId(member.id)}>
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Remove User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {member.email || "No email"}
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

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <DeleteConfirmDialog
        open={!!deleteUserId}
        onOpenChange={() => setDeleteUserId(null)}
        onConfirm={() => { if (deleteUserId) { deleteUser.mutate(deleteUserId); setDeleteUserId(null); } }}
        title="Remove User"
        description="This will permanently remove this user from the platform. This action cannot be undone."
      />
    </div>
  );
}
