import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { MemberHoverCard } from "@/components/MemberHoverCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Shield, ShieldCheck, UserCog, Trash2, Users, Search } from "lucide-react";
import { TeamSkeleton } from "@/components/skeletons/TeamSkeleton";
import { useTeamMembers, useProjectMembers, useTasks } from "@/hooks/use-supabase-data";
import { useUpdateUserRole, useDeleteUser } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/AuthContext";
import InviteUserDialog from "@/components/dialogs/InviteUserDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { ROLE_BADGE_CLASSES, ROLE_LABELS } from "@/lib/status-config";

export default function Team() {
  const navigate = useNavigate();
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

  if (isLoading) return <TeamSkeleton />;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Team"
        subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm w-full sm:w-44"
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
        }
      />

      {/* Table / Cards */}
      {members.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <p className="font-heading font-semibold text-base">No team members yet</p>
              <p className="text-sm text-muted-foreground">
                Invite users to collaborate on projects and tasks in your workspace.
              </p>
            </div>
            {canManageUsers && (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Invite User
              </Button>
            )}
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
                <Card key={member.id} onClick={() => navigate(`/team/${member.id}`)} className="cursor-pointer">
                  <CardContent className="p-3 flex items-center gap-3">
                    <MemberHoverCard member={member} activeTasks={activeTasks}>
                      <Avatar className="h-9 w-9 shrink-0 cursor-default">
                        <AvatarFallback className="text-[11px] bg-muted text-muted-foreground font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </MemberHoverCard>
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
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                <DropdownMenuItem disabled={role === "admin"} onClick={(e) => { e.stopPropagation(); updateRole.mutate({ user_id: member.id, role: "admin" }); }}>
                                  <ShieldCheck className="h-3.5 w-3.5 mr-2" />Admin
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={role === "project_manager"} onClick={(e) => { e.stopPropagation(); updateRole.mutate({ user_id: member.id, role: "project_manager" }); }}>
                                  <Shield className="h-3.5 w-3.5 mr-2" />Project Manager
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={role === "team_member"} onClick={(e) => { e.stopPropagation(); updateRole.mutate({ user_id: member.id, role: "team_member" }); }}>
                                  <UserCog className="h-3.5 w-3.5 mr-2" />Team Member
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          {canManageUsers && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteUserId(member.id); }}>
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
                        <tr key={member.id} onClick={() => navigate(`/team/${member.id}`)} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer">
                          {/* Member */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <MemberHoverCard member={member} activeTasks={activeTasks}>
                                <Avatar className="h-7 w-7 shrink-0 cursor-default">
                                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-medium">
                                    {initials}
                                  </AvatarFallback>
                                </Avatar>
                              </MemberHoverCard>
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
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
