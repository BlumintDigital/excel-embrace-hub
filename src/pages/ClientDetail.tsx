import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, Mail, Phone, FileText, DollarSign, FolderKanban, CalendarDays, Pencil, Trash2, MapPin, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { useClients, useProjects } from "@/hooks/use-supabase-data";
import { useDeleteClient } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { useWorkspace, CURRENCIES } from "@/contexts/WorkspaceContext";
import ClientDialog from "@/components/dialogs/ClientDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { STATUS_DOT_COLORS, STATUS_BADGE_CLASSES } from "@/lib/status-config";
import type { DbClient } from "@/hooks/use-supabase-data";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: clients = [], isLoading: lc } = useClients();
  const { data: projects = [], isLoading: lp } = useProjects();
  const deleteClient = useDeleteClient();
  const { canEditAllProjects, canDeleteProjects } = usePermissions();
  const { settings } = useWorkspace();
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];
  const fmt = (v: number) => `${cur.symbol}${v.toLocaleString()}`;

  if (lc || lp) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const client = clients.find((c) => c.id === id);
  if (!client) {
    return (
      <div className="p-6 lg:p-8">
        <PageHeader title="Client Not Found" parent={{ label: "Clients", href: "/clients" }} />
      </div>
    );
  }

  const clientProjects = projects.filter((p) => p.client_id === client.id);
  const totalBudget = clientProjects.reduce((s, p) => s + (p.budget_projected || 0), 0);
  const totalSpent = clientProjects.reduce((s, p) => s + (p.budget_actual || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title={client.name}
        parent={{ label: "Clients", href: "/clients" }}
        action={
          <div className="flex gap-2">
            {canEditAllProjects && (
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
              </Button>
            )}
            {canDeleteProjects && (
              <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Contact + details card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{client.name}</h2>
                <p className="text-xs text-muted-foreground">{clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              {client.email && (
                <div className="flex items-start gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline">{client.email}</a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm hover:underline">{client.phone}</a>
                  </div>
                </div>
              )}
              {client.contact_person && (
                <div className="flex items-start gap-2.5">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Key Contact</p>
                    <span className="text-sm">{client.contact_person}</span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Added</p>
                  <span className="text-sm">{fmtDate(client.created_at)}</span>
                </div>
              </div>
            </div>

            {client.address && (
              <>
                <Separator />
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Address</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{client.address}</p>
                  </div>
                </div>
              </>
            )}
            {client.notes && (
              <>
                <Separator />
                <div className="flex items-start gap-2.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{client.notes}</p>
                  </div>
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
              <p className="text-2xl font-semibold font-heading">{clientProjects.length}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Total Projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <DollarSign className="h-4 w-4 text-muted-foreground mb-2" />
              <p className="text-2xl font-semibold font-heading">{fmt(totalBudget)}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Total Budget</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <DollarSign className="h-4 w-4 text-warning mb-2" />
              <p className="text-2xl font-semibold font-heading">{fmt(totalSpent)}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">Total Spent</p>
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
          {clientProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects linked to this client yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {clientProjects.map((project) => {
                const progress = project.budget_projected > 0
                  ? Math.round((project.budget_actual || 0) / project.budget_projected * 100) : 0;
                const dotColor = STATUS_DOT_COLORS[project.status] || "bg-muted-foreground";
                const badgeClass = STATUS_BADGE_CLASSES[project.status] || "bg-muted text-muted-foreground border-border";
                const dateRange = [fmtDate(project.start_date), fmtDate(project.end_date)].filter(Boolean).join(" → ");
                return (
                  <div key={project.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                        <Link to={`/projects/${project.id}`} className="text-sm font-medium hover:underline truncate">
                          {project.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {dateRange && <span className="text-xs text-muted-foreground hidden sm:inline">{dateRange}</span>}
                        <Badge variant="outline" className={`text-[10px] ${badgeClass}`}>{project.status}</Badge>
                      </div>
                    </div>
                    <div className="ml-3.5">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget used</span>
                        <span>{fmt(project.budget_actual || 0)} / {fmt(project.budget_projected)}</span>
                      </div>
                      <Progress
                        value={Math.min(progress, 100)}
                        className={cn(
                          "h-1.5",
                          progress > 85 ? "[&>*]:bg-destructive" : progress > 60 ? "[&>*]:bg-warning" : "[&>*]:bg-success"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        client={client}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          deleteClient.mutate(client.id);
          navigate("/clients");
        }}
        title="Delete Client"
        description={`This will permanently delete ${client.name} and unlink all associated projects.`}
      />
    </div>
  );
}
