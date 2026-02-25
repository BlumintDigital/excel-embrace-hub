import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, Plus, Search, MoreHorizontal, Pencil, Trash2, Mail, Phone, FolderKanban } from "lucide-react";
import { ClientsSkeleton } from "@/components/skeletons/ClientsSkeleton";
import { useClients, useProjects } from "@/hooks/use-supabase-data";
import { useDeleteClient } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import { STATUS_DOT_COLORS, STATUS_BADGE_CLASSES } from "@/lib/status-config";
import ClientDialog from "@/components/dialogs/ClientDialog";
import type { DbClient } from "@/hooks/use-supabase-data";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Clients() {
  const navigate = useNavigate();
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: projects = [], isLoading: lp } = useProjects();
  const deleteClient = useDeleteClient();
  const { canCreateProjects, canEditAllProjects, canDeleteProjects } = usePermissions();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<DbClient | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const openCreate = () => { setEditingClient(null); setDialogOpen(true); };
  const openEdit = (c: DbClient) => { setEditingClient(c); setDialogOpen(true); };
  const handleDelete = (id: string) => deleteClient.mutate(id);

  if (lc || lp) return <ClientsSkeleton />;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <PageHeader
        title="Clients"
        subtitle="Manage clients and view their associated projects"
        action={canCreateProjects ? (
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Client
          </Button>
        ) : undefined}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Empty state */}
      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-xs">
              <p className="font-heading font-semibold text-base">No clients yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first client and link them to projects for better organization.
              </p>
            </div>
            {canCreateProjects && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="rounded-full bg-muted p-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">No clients match</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search term.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => {
            const clientProjects = projects.filter((p) => p.client_id === client.id);
            return (
              <Card key={client.id} className="flex flex-col cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/clients/${client.id}`)}>
                <CardContent className="p-5 flex flex-col gap-4 flex-1">
                  {/* Top row: name + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {clientProjects.length === 1
                            ? "1 project"
                            : `${clientProjects.length} projects`}
                        </p>
                      </div>
                    </div>

                    {(canEditAllProjects || canDeleteProjects) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditAllProjects && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(client); }}>
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                            </DropdownMenuItem>
                          )}
                          {canDeleteProjects && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Contact info */}
                  {(client.email || client.phone) && (
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {client.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{client.notes}</p>
                  )}

                  {/* Projects */}
                  <div className="mt-auto pt-3 border-t border-border">
                    {clientProjects.length === 0 ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FolderKanban className="h-3.5 w-3.5" />
                        No projects linked
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Projects</p>
                        <div className="flex flex-wrap gap-1.5">
                          {clientProjects.map((p) => (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_BADGE_CLASSES[p.status] || STATUS_BADGE_CLASSES["Planning"]}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[p.status] || "bg-muted-foreground"}`}
                              />
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={editingClient}
      />
    </div>
  );
}
