import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, FolderKanban, ListTodo, CheckCircle2, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { useTeamMembers, useProjects, useProjectMembers, useTasks } from "@/hooks/use-supabase-data";
import { useUpdateUserRole, useDeleteUser } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/contexts/AuthContext";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { ROLE_BADGE_CLASSES, ROLE_LABELS, STATUS_BADGE_CLASSES, STATUS_DOT_COLORS, PRIORITY_BADGE_CLASSES } from "@/lib/status-config";

export default function TeamMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: members = [], isLoading: lm } = useTeamMembers();
  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: tasks = [], isLoading: lt } = useTasks();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const { canAssignRoles, canManageUsers } = usePermissions();
  const { user } = useAuth();

  if (lm || lp || lt) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const member = members.find((m) => m.id === id);
  if (!member) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title="Member Not Found" parent={{ label: "Team", href: "/team" }} />
      </div>
    );
  }

  const isSelf = member.id === user?.id;
  const appRole = member.app_role || "team_member";
  const initials = (member.full_name || "?").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const memberProjectIds = projectMembers.filter((pm) => pm.user_id === member.id).map((pm) => pm.project_id);
  const memberProjects = projects.filter((p) => memberProjectIds.includes(p.id));
  const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
  const activeTasks = memberTasks.filter((t) => t.status !== "Done");
  const completedTasks = memberTasks.filter((t) => t.status === "Done");

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title={member.full_name || member.email || "Unknown Member"}
        parent={{ label: "Team", href: "/team" }}
        action={
          !isSelf && (canAssignRoles || canManageUsers) ? (
            <div className="flex gap-2">
              {canManageUsers && (
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                  Remove Member
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold">{member.full_name || "Unknown"}</h2>
                  {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                </div>
                <Badge variant="outline" className={`text-[10px] mt-1 ${ROLE_BADGE_CLASSES[appRole] || ROLE_BADGE_CLASSES.team_member}`}>
                  {ROLE_LABELS[appRole] || appRole}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-sm">{member.email || "No email"}</span>
            </div>

            {canAssignRoles && !isSelf && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Change Role</p>
                  <Select
                    value={appRole}
                    onValueChange={(newRole) => updateRole.mutate({ user_id: member.id, role: newRole })}
                  >
                    <SelectTrigger className="w-48 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                      <SelectItem value="team_member">Team Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stat cards */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-5">
              <FolderKanban className="h-4 w-4 text-muted-foreground mb-2" />
              <p className="text-2xl font-semibold font-heading">{memberProjects.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <ListTodo className="h-4 w-4 text-warning mb-2" />
              <p className="text-2xl font-semibold font-heading">{activeTasks.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Active Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <CheckCircle2 className="h-4 w-4 text-success mb-2" />
              <p className="text-2xl font-semibold font-heading">{completedTasks.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Completed Tasks</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Projects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Projects</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {memberProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Not a member of any projects yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {memberProjects.map((project) => {
                const openTasks = tasks.filter((t) => t.project_id === project.id && t.assignee_id === member.id && t.status !== "Done").length;
                const dotColor = STATUS_DOT_COLORS[project.status] || "bg-muted-foreground";
                const badgeClass = STATUS_BADGE_CLASSES[project.status] || "bg-muted text-muted-foreground border-border";
                return (
                  <div key={project.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <Link to={`/projects/${project.id}`} className="text-sm font-medium hover:underline truncate">
                        {project.name}
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-xs text-muted-foreground">{openTasks} open task{openTasks !== 1 ? "s" : ""}</span>
                      <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>{project.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Assigned Tasks</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {memberTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {memberTasks.slice(0, 10).map((task) => {
                const taskProject = projects.find((p) => p.id === task.project_id);
                const statusBadge = STATUS_BADGE_CLASSES[task.status] || "bg-muted text-muted-foreground border-border";
                const priorityBadge = PRIORITY_BADGE_CLASSES[task.priority] || "";
                return (
                  <div key={task.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <Link to={`/tasks/${task.id}`} className="text-sm font-medium hover:underline truncate block">
                        {task.title}
                      </Link>
                      {taskProject && (
                        <p className="text-xs text-muted-foreground mt-0.5">{taskProject.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${priorityBadge}`}>{task.priority}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusBadge}`}>{task.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          deleteUser.mutate(member.id);
          navigate("/team");
        }}
        title="Remove Member"
        description={`This will permanently remove ${member.full_name || member.email} from the platform.`}
      />
    </div>
  );
}
