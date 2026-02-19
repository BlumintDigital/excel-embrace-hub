import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, Upload, Download, Eye, Loader2, MoreHorizontal, Trash2, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { useDocuments, useProjects } from "@/hooks/use-supabase-data";
import { useDeleteDocument } from "@/hooks/use-supabase-mutations";
import { usePermissions } from "@/hooks/use-permissions";
import DocumentDialog from "@/components/dialogs/DocumentDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function Documents() {
  const { data: documents = [], isLoading } = useDocuments();
  const { data: projects = [] } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [search, setSearch] = useState("");
  const deleteDoc = useDeleteDocument();
  const { canManageDocuments } = usePermissions();

  const filteredDocs = useMemo(() => {
    let result = selectedProject === "all" ? documents : documents.filter((d) => d.project_id === selectedProject);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(q) || (d.category || "").toLowerCase().includes(q));
    }
    return result;
  }, [documents, selectedProject, search]);

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
      <PageHeader
        title="Documents"
        subtitle={`${filteredDocs.length} file${filteredDocs.length !== 1 ? "s" : ""}${selectedProject === "all" ? " across all projects" : ""}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="pl-8 h-8 text-sm w-44"
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48 h-8 text-sm">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canManageDocuments && (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
              </Button>
            )}
          </div>
        }
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDocs.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No documents yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProject !== "all" ? "No files for this project." : "Upload files to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                  {selectedProject === "all" && (
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                  )}
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Size</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const project = projects.find((p) => p.id === doc.project_id);
                  return (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate max-w-[200px]">{doc.name}</span>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-4 py-3">
                        {doc.category ? (
                          <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      {/* Project */}
                      {selectedProject === "all" && (
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {project?.name || "—"}
                        </td>
                      )}
                      {/* Size */}
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatFileSize(doc.size || 0)}
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                          {canManageDocuments && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover z-50">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(doc.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <DocumentDialog open={dialogOpen} onOpenChange={setDialogOpen} projects={projects} />
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteDoc.mutate(deleteId); setDeleteId(null); } }}
        title="Delete Document"
      />
    </div>
  );
}
