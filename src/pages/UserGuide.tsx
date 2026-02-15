import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  LayoutDashboard, FolderKanban, ListTodo, DollarSign,
  CalendarRange, Users, FileText, Settings, HardHat, Download,
} from "lucide-react";
import { UserGuideSections, getPlainSections } from "@/components/guide/UserGuideSections";

export default function UserGuide() {
  const { settings } = useWorkspace();
  const appName = settings.companyName || "PipeFlow";

  const sections = UserGuideSections(appName);

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const plainSections = getPlainSections(appName);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${appName} User Guide</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
          h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
          h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          p { font-size: 14px; color: #333; margin-bottom: 8px; }
          ul { padding-left: 20px; margin-bottom: 8px; }
          li { font-size: 14px; color: #333; margin-bottom: 4px; }
          strong { color: #000; }
          .section { margin-bottom: 28px; page-break-inside: avoid; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${appName} User Guide</h1>
        <p class="subtitle">Everything you need to know about using ${appName} — Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        ${sections.map((s) => `<div class="section"><h2>${s.title}</h2>${plainSections[s.id] || ""}</div>`).join("")}
        <div class="footer">${appName} • User Guide • ${new Date().getFullYear()}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">User Guide</h1>
          <p className="text-muted-foreground mt-1">Everything you need to know about using {appName}.</p>
        </div>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <section.icon className="h-5 w-5 text-primary shrink-0" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>{section.content}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Need Help?</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you have questions or run into issues, reach out to your workspace administrator or contact support.
        </CardContent>
      </Card>
    </div>
  );
}
