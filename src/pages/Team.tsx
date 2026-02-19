import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, MoreHorizontal, Shield, ShieldCheck, UserCog, Trash2, Users, Search } from "lucide-react";
import { useTeamMembers, useProjectMembers, useTasks } from "@/hooks/use-supabase-data";
import { useUpdateUserRole, useDeleteUser } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/AuthContext";
import InviteUserDialog from "@/components/dialogs/InviteUserDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/status-config";

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
  const [search, setSearch] = useState("");

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) => (m.full_name || "").toLowerCase().includes(q) || (m.email || "").toLowerCase().includes(q)
    );
  }, [members, search]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-sm w-44"
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManageUsers && (
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Invite User
            </Button>
          )}
        </div>
      </div>

      {/* Table / Cards */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No team members yet</p>
            <p className="text-xs text-muted-foreground mt-1">Invite users to join your workspace.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {filteredMembers.map((member) => {
              const projectCount = projectMembers.filter((pm) => pm.user_id === member.id).length;
              const userTasks = tasks.filter((t) => t.assignee_id === member.id);
              const activeTasks = userTasks.filter((t) => t.status !== "Done").length;
              const role = member.app_role || "team_member";
              const isSelf = member.id === user?.id;
              const initials = (member.full_name || "?")
                .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <Card key={member.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-[11px] bg-muted text-muted-foreground font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{member.full_name || "Unknown"}</span>
                        {isSelf && <span className="text-[10px] text-muted-foreground shrink-0">(you)</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] ${ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.team_member}`}>
                          {ROLE_LABELS[role] || role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{member.email || "—"}</p>
                      <p className="text-xs text-muted-foreground">{projectCount} project{projectCount !== 1 ? "s" : ""} · {activeTasks} active task{activeTasks !== 1 ? "s" : ""}</p>
                    </div>
                    {(canAssignRoles || canManageUsers) && !isSelf && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
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
                                <DropdownMenuItem disabled={role === "admin"} onClick={() => updateRole.mutate({ user_id: member.id, role: "admin" })}>
                                  <ShieldCheck className="h-3.5 w-3.5 mr-2" />Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={role === "project_manager"} onClick={() => updateRole.mutate({ user_id: member.id, role: "project_manager" })}>
                                  <Shield className="h-3.5 w-3.5 mr-2" />Project Manager
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={role === "team_member"} onClick={() => updateRole.mutate({ user_id: member.id, role: "team_member" })}>
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
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Member</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Projects</th>
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tasks</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => {
                      const projectCount = projectMembers.filter((pm) => pm.user_id === member.id).length;
                      const userTasks = tasks.filter((t) => t.assignee_id === member.id);
                      const activeTasks = userTasks.filter((t) => t.status !== "Done").length;
                      const role = member.app_role || "team_member";
                      const isSelf = member.id === user?.id;
                      const initials = (member.full_name || "?")
                        .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

                      return (
                        <tr key={member.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                          {/* Member */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-7 w-7 shrink-0">
                                <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-medium">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium">{member.full_name || "Unknown"}</span>
                                  {isSelf && (
                                    <span className="text-[10px] text-muted-foreground">(you)</span>
                                  )}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] mt-0.5 ${ROLE_BADGE_CLASSES[role] || ROLE_BADGE_CLASSES.team_member}`}
                                >
                                  {ROLE_LABELS[role] || role}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          {/* Email */}
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {member.email || "—"}
                          </td>
                          {/* Projects */}
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {projectCount}
                          </td>
                          {/* Tasks */}
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {activeTasks} active / {userTasks.length} total
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
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
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => setDeleteUserId(member.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />Remove User
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </>
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
