import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Eye, Loader2 } from "lucide-react";
import { useDocuments, useProjects } from "@/hooks/use-supabase-data";

const categoryIcons: Record<string, string> = {
  Drawings: "text-primary",
  Reports: "text-success",
  Permits: "text-warning",
};

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

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">{documents.length} files across all projects</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" /> Upload
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No documents yet. Upload files to get started.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc, i) => {
            const project = projects.find((p) => p.id === doc.project_id);
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`rounded-lg bg-muted p-2.5 ${categoryIcons[doc.category || ""] || "text-muted-foreground"}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.category && <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>}
                        <span className="text-xs text-muted-foreground">{project?.name || "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatFileSize(doc.size || 0)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
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
