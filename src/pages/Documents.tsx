import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Download, Eye, FolderOpen } from "lucide-react";

const mockDocuments = [
  { id: "d1", name: "Pipeline Design Spec v2.3.pdf", category: "Drawings", project: "Refinery Pipeline Upgrade", size: "4.2 MB", date: "2026-02-10" },
  { id: "d2", name: "Environmental Impact Report.pdf", category: "Reports", project: "Water Treatment Plant Piping", size: "12.8 MB", date: "2026-02-08" },
  { id: "d3", name: "Welding Procedure Spec.docx", category: "Permits", project: "Gas Distribution Network", size: "1.1 MB", date: "2026-02-05" },
  { id: "d4", name: "Site Survey Photos.zip", category: "Reports", project: "Refinery Pipeline Upgrade", size: "85.4 MB", date: "2026-01-28" },
  { id: "d5", name: "Building Permit #2026-1234.pdf", category: "Permits", project: "Water Treatment Plant Piping", size: "0.8 MB", date: "2026-01-25" },
  { id: "d6", name: "Final Inspection Report.pdf", category: "Reports", project: "Steam System Maintenance", size: "3.5 MB", date: "2026-01-31" },
];

const categoryIcons: Record<string, string> = {
  Drawings: "text-primary",
  Reports: "text-success",
  Permits: "text-warning",
};

export default function Documents() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-1">{mockDocuments.length} files across all projects</p>
        </div>
        <Button>
          <Upload className="h-4 w-4 mr-2" /> Upload
        </Button>
      </div>

      <div className="grid gap-3">
        {mockDocuments.map((doc, i) => (
          <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`rounded-lg bg-muted p-2.5 ${categoryIcons[doc.category] || "text-muted-foreground"}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{doc.category}</Badge>
                    <span className="text-xs text-muted-foreground">{doc.project}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                  <p className="text-xs text-muted-foreground">{new Date(doc.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
