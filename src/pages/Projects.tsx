import { useState } from "react";
import { Plus, Search, Loader2, MoreHorizontal, Pencil, Trash2, Users, FolderKanban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProjects, useTasks, useProjectMembers, useTeamMembers, DbProject } from "@/hooks/use-supabase-data";
import { useDeleteProject } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import ProjectDialog from "@/components/dialogs/ProjectDialog";
import ProjectMembersDialog from "@/components/dialogs/ProjectMembersDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { STATUS_DOT_COLORS } from "@/lib/status-config";

export default function Projects() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<DbProject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [membersProject, setMembersProject] = useState<DbProject | null>(null);

  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useProjectMembers();
  const { data: team = [] } = useTeamMembers();
  const deleteProject = useDeleteProject();
  const { canCreateProjects, canEditAllProjects, canDeleteProjects } = usePermissions();

  if (lp) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} total</p>
        </div>
        {canCreateProjects && (
          <Button size="sm" onClick={() => { setEditProject(null); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Project
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          className="pl-8 h-8 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <FolderKanban className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">No projects found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Try a different search term." : "Create your first project to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((project) => {
            const progress = project.budget_projected > 0
              ? Math.round(((project.budget_actual || 0) / project.budget_projected) * 100)
              : 0;
            const projectTasks = tasks.filter((t) => t.project_id === project.id);
            const doneTasks = projectTasks.filter((t) => t.status === "Done").length;
            const projectMembers = members.filter((m) => m.project_id === project.id);
            const projectTeam = team.filter((u) => projectMembers.some((m) => m.user_id === u.id));
            const dotColor = STATUS_DOT_COLORS[project.status] || "bg-muted-foreground";

            return (
              <Card
                key={project.id}
                className="hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-4 space-y-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 ml-3.5">
                        {project.description || <span className="italic">No description</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">{project.status}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditAllProjects && (
                            <DropdownMenuItem onClick={() => { setEditProject(project); setDialogOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5 mr-2" />Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setMembersProject(project)}>
                            <Users className="h-3.5 w-3.5 mr-2" />Members
                          </DropdownMenuItem>
                          {canDeleteProjects && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteId(project.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Budget progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Budget used</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-0.5">
                    <div
                      className="flex -space-x-1.5 cursor-pointer"
                      onClick={() => setMembersProject(project)}
                    >
                      {projectTeam.slice(0, 4).map((u) => (
                        <Avatar key={u.id} className="h-6 w-6 border-2 border-card">
                          <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                            {(u.full_name || "?").split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {projectTeam.length === 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />No members
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {doneTasks}/{projectTasks.length} tasks
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editProject} />
      {membersProject && (
        <ProjectMembersDialog
          open={!!membersProject}
          onOpenChange={() => setMembersProject(null)}
          projectId={membersProject.id}
          projectName={membersProject.name}
          team={team}
          members={members}
        />
      )}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteProject.mutate(deleteId); setDeleteId(null); } }}
        title="Delete Project"
        description="This will permanently delete the project and cannot be undone."
      />
    </div>
  );
}
