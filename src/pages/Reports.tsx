import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart2, Download, FileText, Loader2,
  FolderKanban, DollarSign, ListTodo, Users, Building2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useProjects, useTasks, useBudgetCategories,
  useClients, useTeamMembers,
} from "@/hooks/use-supabase-data";
import { useWorkspace, CURRENCIES } from "@/contexts/WorkspaceContext";

// ── Types ──────────────────────────────────────────────────────────────────
type ReportType = "projects" | "budget" | "tasks" | "team" | "clients";

interface ReportMeta {
  id: ReportType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const REPORT_TYPES: ReportMeta[] = [
  { id: "projects", label: "Project Summary", icon: FolderKanban, description: "Status, budget & progress per project" },
  { id: "budget",   label: "Budget Report",   icon: DollarSign,   description: "Projected vs actual per category" },
  { id: "tasks",    label: "Task Report",     icon: ListTodo,     description: "All tasks with status & assignee" },
  { id: "team",     label: "Team Workload",   icon: Users,        description: "Task counts per team member" },
  { id: "clients",  label: "Client Directory",icon: Building2,    description: "Client details & linked projects" },
];

// ── CSV helper ────────────────────────────────────────────────────────────
function escapeCell(val: string | number | null | undefined): string {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(headers: string[], rows: (string | number | null | undefined)[][], filename: string) {
  const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF helper ────────────────────────────────────────────────────────────
function downloadPdf(
  reportName: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  filename: string,
  orientation: "portrait" | "landscape" = "landscape",
) {
  const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const generatedAt = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(reportName, 40, 44);

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated ${generatedAt}`, 40, 60);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(40, 68, pageWidth - 40, 68);

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map((v) => String(v ?? "—"))),
    startY: 80,
    margin: { left: 40, right: 40 },
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [248, 250, 252],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableLineColor: [226, 232, 240],
    tableLineWidth: 0.3,
  });

  // Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  doc.save(filename);
}

// ── Date formatter ────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
}

// ── Main component ────────────────────────────────────────────────────────
export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("projects");

  // Filters
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filterClient, setFilterClient] = useState("all");

  // Data
  const { data: projects = [], isLoading: lp } = useProjects();
  const { data: tasks = [], isLoading: lt } = useTasks();
  const { data: categories = [], isLoading: lb } = useBudgetCategories();
  const { data: clients = [], isLoading: lc } = useClients();
  const { data: team = [], isLoading: lm } = useTeamMembers();

  const { settings } = useWorkspace();
  const cur = CURRENCIES.find((c) => c.code === settings.currency) || CURRENCIES[0];
  const fmt = (v: number) => `${cur.symbol}${v.toLocaleString()}`;
  const fmtDiff = (v: number) =>
    v >= 0 ? `+${cur.symbol}${v.toLocaleString()}` : `-${cur.symbol}${Math.abs(v).toLocaleString()}`;

  const isLoading = lp || lt || lb || lc || lm;

  // Reset filters when report type changes
  const handleSetReportType = (t: ReportType) => {
    setReportType(t);
    setFilterProject("all");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterAssignee("all");
    setFilterClient("all");
  };

  // ── Derived rows ─────────────────────────────────────────────────────────

  const projectRows = useMemo(() => {
    return projects
      .filter((p) => filterStatus === "all" || p.status === filterStatus)
      .filter((p) => filterClient === "all" || p.client_id === filterClient)
      .map((p) => {
        const client = clients.find((c) => c.id === p.client_id);
        const projectTasks = tasks.filter((t) => t.project_id === p.id);
        const doneTasks = projectTasks.filter((t) => t.status === "Done").length;
        const pct = p.budget_projected > 0 ? Math.round((p.budget_actual / p.budget_projected) * 100) : 0;
        return { p, client, projectTasks, doneTasks, pct };
      });
  }, [projects, clients, tasks, filterStatus, filterClient]);

  const budgetRows = useMemo(() => {
    return categories
      .filter((c) => filterProject === "all" || c.project_id === filterProject)
      .map((cat) => {
        const project = projects.find((p) => p.id === cat.project_id);
        const diff = (cat.projected || 0) - (cat.actual || 0);
        const pct = cat.projected > 0 ? Math.round(((cat.actual || 0) / cat.projected) * 100) : 0;
        return { cat, project, diff, pct };
      });
  }, [categories, projects, filterProject]);

  const taskRows = useMemo(() => {
    return tasks
      .filter((t) => filterProject === "all" || t.project_id === filterProject)
      .filter((t) => filterStatus === "all" || t.status === filterStatus)
      .filter((t) => filterPriority === "all" || t.priority === filterPriority)
      .filter((t) => filterAssignee === "all" || t.assignee_id === filterAssignee)
      .map((t) => {
        const project = projects.find((p) => p.id === t.project_id);
        const assignee = team.find((u) => u.id === t.assignee_id);
        return { t, project, assignee };
      });
  }, [tasks, projects, team, filterProject, filterStatus, filterPriority, filterAssignee]);

  const teamRows = useMemo(() => {
    return team.map((member) => {
      const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
      return {
        member,
        total: memberTasks.length,
        todo: memberTasks.filter((t) => t.status === "To Do").length,
        inProgress: memberTasks.filter((t) => t.status === "In Progress").length,
        done: memberTasks.filter((t) => t.status === "Done").length,
      };
    }).sort((a, b) => b.total - a.total);
  }, [team, tasks]);

  const clientRows = useMemo(() => {
    return clients.map((c) => {
      const linkedProjects = projects.filter((p) => p.client_id === c.id);
      return { c, linkedProjects };
    });
  }, [clients, projects]);

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (reportType === "projects") {
      downloadCsv(
        ["Project Name", "Client", "Status", "Start Date", "End Date", "Budget Projected", "Budget Actual", "% Used", "Total Tasks", "Done Tasks"],
        projectRows.map(({ p, client, projectTasks, doneTasks, pct }) => [
          p.name, client?.name ?? "—", p.status,
          fmtDate(p.start_date), fmtDate(p.end_date),
          p.budget_projected, p.budget_actual, `${pct}%`,
          projectTasks.length, doneTasks,
        ]),
        `project-summary-${Date.now()}.csv`,
      );
    } else if (reportType === "budget") {
      downloadCsv(
        ["Project", "Category", "Projected", "Actual", "Difference", "% Used"],
        budgetRows.map(({ cat, project, diff, pct }) => [
          project?.name ?? "—", cat.name,
          cat.projected || 0, cat.actual || 0,
          diff, `${pct}%`,
        ]),
        `budget-report-${Date.now()}.csv`,
      );
    } else if (reportType === "tasks") {
      downloadCsv(
        ["Title", "Project", "Status", "Priority", "Assignee", "Due Date", "Created"],
        taskRows.map(({ t, project, assignee }) => [
          t.title, project?.name ?? "—", t.status, t.priority,
          assignee?.full_name ?? "Unassigned",
          fmtDate(t.due_date), fmtDate(t.created_at),
        ]),
        `task-report-${Date.now()}.csv`,
      );
    } else if (reportType === "team") {
      downloadCsv(
        ["Name", "Email", "Role", "Total Tasks", "To Do", "In Progress", "Done"],
        teamRows.map(({ member, total, todo, inProgress, done }) => [
          member.full_name ?? "—", member.email ?? "—",
          member.app_role?.replace(/_/g, " ") ?? "—", total, todo, inProgress, done,
        ]),
        `team-workload-${Date.now()}.csv`,
      );
    } else if (reportType === "clients") {
      downloadCsv(
        ["Name", "Email", "Phone", "Address", "Contact Person", "Projects", "Notes"],
        clientRows.map(({ c, linkedProjects }) => [
          c.name, c.email ?? "—", c.phone ?? "—",
          c.address ?? "—", c.contact_person ?? "—",
          linkedProjects.map((p) => p.name).join("; ") || "—",
          c.notes ?? "—",
        ]),
        `client-directory-${Date.now()}.csv`,
      );
    }
  };

  const handleExportPdf = () => {
    if (reportType === "projects") {
      downloadPdf(
        "Project Summary Report",
        ["Project", "Client", "Status", "Start", "End", "Budget", "Actual", "% Used", "Tasks Done"],
        projectRows.map(({ p, client, projectTasks, doneTasks, pct }) => [
          p.name, client?.name ?? "—", p.status,
          fmtDate(p.start_date), fmtDate(p.end_date),
          `${cur.symbol}${p.budget_projected.toLocaleString()}`,
          `${cur.symbol}${p.budget_actual.toLocaleString()}`,
          `${pct}%`, `${doneTasks}/${projectTasks.length}`,
        ]),
        `project-summary-${Date.now()}.pdf`,
        "landscape",
      );
    } else if (reportType === "budget") {
      downloadPdf(
        "Budget Report",
        ["Project", "Category", "Projected", "Actual", "Difference", "% Used"],
        budgetRows.map(({ cat, project, diff, pct }) => [
          project?.name ?? "—", cat.name,
          `${cur.symbol}${(cat.projected || 0).toLocaleString()}`,
          `${cur.symbol}${(cat.actual || 0).toLocaleString()}`,
          `${diff >= 0 ? "+" : ""}${cur.symbol}${Math.abs(diff).toLocaleString()}`,
          `${pct}%`,
        ]),
        `budget-report-${Date.now()}.pdf`,
        "portrait",
      );
    } else if (reportType === "tasks") {
      downloadPdf(
        "Task Report",
        ["Title", "Project", "Status", "Priority", "Assignee", "Due Date"],
        taskRows.map(({ t, project, assignee }) => [
          t.title, project?.name ?? "—", t.status, t.priority,
          assignee?.full_name ?? "Unassigned", fmtDate(t.due_date),
        ]),
        `task-report-${Date.now()}.pdf`,
        "landscape",
      );
    } else if (reportType === "team") {
      downloadPdf(
        "Team Workload Report",
        ["Name", "Email", "Role", "Total Tasks", "To Do", "In Progress", "Done"],
        teamRows.map(({ member, total, todo, inProgress, done }) => [
          member.full_name ?? "—", member.email ?? "—",
          member.app_role?.replace(/_/g, " ") ?? "—",
          total, todo, inProgress, done,
        ]),
        `team-workload-${Date.now()}.pdf`,
        "portrait",
      );
    } else if (reportType === "clients") {
      downloadPdf(
        "Client Directory",
        ["Name", "Email", "Phone", "Contact Person", "Address", "Projects"],
        clientRows.map(({ c, linkedProjects }) => [
          c.name, c.email ?? "—", c.phone ?? "—",
          c.contact_person ?? "—", c.address ?? "—",
          linkedProjects.map((p) => p.name).join(", ") || "—",
        ]),
        `client-directory-${Date.now()}.pdf`,
        "landscape",
      );
    }
  };

  const currentReport = REPORT_TYPES.find((r) => r.id === reportType)!;
  const totalRows =
    reportType === "projects" ? projectRows.length
    : reportType === "budget" ? budgetRows.length
    : reportType === "tasks" ? taskRows.length
    : reportType === "team" ? teamRows.length
    : clientRows.length;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Reports"
        subtitle={`${totalRows} record${totalRows !== 1 ? "s" : ""} · ${currentReport.label}`}
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExport} disabled={totalRows === 0}>
              <Download className="h-3.5 w-3.5 mr-1.5" />CSV
            </Button>
            <Button size="sm" onClick={handleExportPdf} disabled={totalRows === 0}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />Export PDF
            </Button>
          </div>
        }
      />

      {/* Report type selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {REPORT_TYPES.map((r) => {
          const Icon = r.icon;
          const active = reportType === r.id;
          return (
            <button
              key={r.id}
              onClick={() => handleSetReportType(r.id)}
              className={`flex-shrink-0 flex items-start gap-2.5 px-4 py-3 rounded-lg border text-left transition-colors ${
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className={`text-sm font-medium leading-none mb-1 ${active ? "text-primary" : "text-foreground"}`}>{r.label}</p>
                <p className="text-[11px] leading-tight max-w-[130px]">{r.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {(reportType === "projects" || reportType === "tasks" || reportType === "budget") && (
        <div className="flex flex-wrap gap-2">
          {/* Project filter (budget, tasks) */}
          {(reportType === "budget" || reportType === "tasks") && (
            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger className="h-8 text-sm w-48">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {/* Status filter (projects, tasks) */}
          {(reportType === "projects" || reportType === "tasks") && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-sm w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Statuses</SelectItem>
                {reportType === "projects"
                  ? ["Planning", "Active", "On Hold", "Completed"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)
                  : ["To Do", "In Progress", "Done"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)
                }
              </SelectContent>
            </Select>
          )}
          {/* Client filter (projects only) */}
          {reportType === "projects" && (
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="h-8 text-sm w-44">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {/* Priority filter (tasks only) */}
          {reportType === "tasks" && (
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 text-sm w-36">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Priorities</SelectItem>
                {["High", "Medium", "Low"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {/* Assignee filter (tasks only) */}
          {reportType === "tasks" && (
            <Select value={filterAssignee} onValueChange={setFilterAssignee}>
              <SelectTrigger className="h-8 text-sm w-44">
                <SelectValue placeholder="All Assignees" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Assignees</SelectItem>
                {team.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name ?? u.email ?? u.id}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Preview table */}
      <Card>
        <CardHeader className="pb-0 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="h-3.5 w-3.5" />
            {currentReport.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mt-2">
          {totalRows === 0 ? (
            <div className="p-10 text-center">
              <BarChart2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No data</p>
              <p className="text-xs text-muted-foreground mt-1">Adjust your filters or add data to the platform.</p>
            </div>
          ) : (
            <>
              {/* ════ PROJECT SUMMARY ════ */}
              {reportType === "projects" && (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {projectRows.map(({ p, client, projectTasks, doneTasks, pct }) => (
                      <div key={p.id} className="px-4 py-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium">{p.name}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">{p.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-muted-foreground">Client</span><p className="font-medium">{client?.name ?? "—"}</p></div>
                          <div><span className="text-muted-foreground">Tasks</span><p className="font-medium">{doneTasks}/{projectTasks.length} done</p></div>
                          <div><span className="text-muted-foreground">Budget</span><p className="font-medium">{fmt(p.budget_actual)} / {fmt(p.budget_projected)}</p></div>
                          <div><span className="text-muted-foreground">% Used</span><p className={`font-medium ${pct > 100 ? "text-destructive" : pct > 80 ? "text-warning" : ""}`}>{pct}%</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5">Project</th>
                          <th className="px-4 py-2.5">Client</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Start</th>
                          <th className="px-4 py-2.5">End</th>
                          <th className="px-4 py-2.5 text-right">Budget</th>
                          <th className="px-4 py-2.5 text-right">Actual</th>
                          <th className="px-4 py-2.5 text-right">% Used</th>
                          <th className="px-4 py-2.5 text-right">Tasks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectRows.map(({ p, client, projectTasks, doneTasks, pct }) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3 text-sm font-medium max-w-[160px] truncate">{p.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{client?.name ?? "—"}</td>
                            <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{p.status}</Badge></td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(p.start_date)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(p.end_date)}</td>
                            <td className="px-4 py-3 text-sm text-right">{fmt(p.budget_projected)}</td>
                            <td className="px-4 py-3 text-sm text-right">{fmt(p.budget_actual)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${pct > 100 ? "text-destructive" : pct > 80 ? "text-warning" : ""}`}>{pct}%</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">{doneTasks}/{projectTasks.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ════ BUDGET REPORT ════ */}
              {reportType === "budget" && (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {budgetRows.map(({ cat, project, diff, pct }) => (
                      <div key={cat.id} className="px-4 py-3 space-y-2">
                        <div>
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{project?.name ?? "—"}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-muted-foreground">Projected</span><p className="font-medium">{fmt(cat.projected || 0)}</p></div>
                          <div><span className="text-muted-foreground">Actual</span><p className="font-medium">{fmt(cat.actual || 0)}</p></div>
                          <div><span className="text-muted-foreground">Difference</span><p className={`font-medium ${diff >= 0 ? "text-success" : "text-destructive"}`}>{fmtDiff(diff)}</p></div>
                          <div><span className="text-muted-foreground">% Used</span><p className="font-medium">{pct}%</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5">Project</th>
                          <th className="px-4 py-2.5">Category</th>
                          <th className="px-4 py-2.5 text-right">Projected</th>
                          <th className="px-4 py-2.5 text-right">Actual</th>
                          <th className="px-4 py-2.5 text-right">Difference</th>
                          <th className="px-4 py-2.5 text-right">% Used</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budgetRows.map(({ cat, project, diff, pct }) => (
                          <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3 text-sm text-muted-foreground">{project?.name ?? "—"}</td>
                            <td className="px-4 py-3 text-sm font-medium">{cat.name}</td>
                            <td className="px-4 py-3 text-sm text-right">{fmt(cat.projected || 0)}</td>
                            <td className="px-4 py-3 text-sm text-right">{fmt(cat.actual || 0)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-medium ${diff >= 0 ? "text-success" : "text-destructive"}`}>{fmtDiff(diff)}</td>
                            <td className="px-4 py-3 text-sm text-right">{pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ════ TASK REPORT ════ */}
              {reportType === "tasks" && (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {taskRows.map(({ t, project, assignee }) => (
                      <div key={t.id} className="px-4 py-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-snug">{t.title}</span>
                          <Badge variant="secondary" className="text-[10px] shrink-0">{t.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-muted-foreground">Project</span><p className="font-medium truncate">{project?.name ?? "—"}</p></div>
                          <div><span className="text-muted-foreground">Priority</span><p className="font-medium">{t.priority}</p></div>
                          <div><span className="text-muted-foreground">Assignee</span><p className="font-medium">{assignee?.full_name ?? "Unassigned"}</p></div>
                          <div><span className="text-muted-foreground">Due</span><p className="font-medium">{fmtDate(t.due_date)}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5">Title</th>
                          <th className="px-4 py-2.5">Project</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5">Priority</th>
                          <th className="px-4 py-2.5">Assignee</th>
                          <th className="px-4 py-2.5">Due Date</th>
                          <th className="px-4 py-2.5">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taskRows.map(({ t, project, assignee }) => (
                          <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">{t.title}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-[140px] truncate">{project?.name ?? "—"}</td>
                            <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px]">{t.status}</Badge></td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{t.priority}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{assignee?.full_name ?? "Unassigned"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(t.due_date)}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{fmtDate(t.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ════ TEAM WORKLOAD ════ */}
              {reportType === "team" && (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {teamRows.map(({ member, total, todo, inProgress, done }) => (
                      <div key={member.id} className="px-4 py-3 space-y-2">
                        <div>
                          <p className="text-sm font-medium">{member.full_name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{member.email ?? "—"}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-xs text-center">
                          <div className="rounded-md bg-muted/50 px-2 py-1.5"><p className="font-semibold text-base leading-none">{total}</p><p className="text-muted-foreground mt-0.5">Total</p></div>
                          <div className="rounded-md bg-muted/50 px-2 py-1.5"><p className="font-semibold text-base leading-none">{todo}</p><p className="text-muted-foreground mt-0.5">To Do</p></div>
                          <div className="rounded-md bg-muted/50 px-2 py-1.5"><p className="font-semibold text-base leading-none">{inProgress}</p><p className="text-muted-foreground mt-0.5">Active</p></div>
                          <div className="rounded-md bg-muted/50 px-2 py-1.5"><p className="font-semibold text-base leading-none">{done}</p><p className="text-muted-foreground mt-0.5">Done</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">Role</th>
                          <th className="px-4 py-2.5 text-right">Total</th>
                          <th className="px-4 py-2.5 text-right">To Do</th>
                          <th className="px-4 py-2.5 text-right">In Progress</th>
                          <th className="px-4 py-2.5 text-right">Done</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamRows.map(({ member, total, todo, inProgress, done }) => (
                          <tr key={member.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3 text-sm font-medium">{member.full_name ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{member.email ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground capitalize">{member.app_role?.replace(/_/g, " ") ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{total}</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">{todo}</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">{inProgress}</td>
                            <td className="px-4 py-3 text-sm text-right text-muted-foreground">{done}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ════ CLIENT DIRECTORY ════ */}
              {reportType === "clients" && (
                <>
                  {/* Mobile */}
                  <div className="sm:hidden divide-y divide-border">
                    {clientRows.map(({ c, linkedProjects }) => (
                      <div key={c.id} className="px-4 py-3 space-y-1.5">
                        <p className="text-sm font-medium">{c.name}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <div><span className="text-muted-foreground">Email</span><p className="font-medium truncate">{c.email ?? "—"}</p></div>
                          <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{c.phone ?? "—"}</p></div>
                          <div><span className="text-muted-foreground">Contact</span><p className="font-medium">{c.contact_person ?? "—"}</p></div>
                          <div><span className="text-muted-foreground">Projects</span><p className="font-medium">{linkedProjects.length}</p></div>
                        </div>
                        {c.address && <p className="text-xs text-muted-foreground">{c.address}</p>}
                      </div>
                    ))}
                  </div>
                  {/* Desktop */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-2.5">Name</th>
                          <th className="px-4 py-2.5">Email</th>
                          <th className="px-4 py-2.5">Phone</th>
                          <th className="px-4 py-2.5">Contact Person</th>
                          <th className="px-4 py-2.5">Address</th>
                          <th className="px-4 py-2.5 text-right">Projects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientRows.map(({ c, linkedProjects }) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{c.email ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{c.phone ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{c.contact_person ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">{c.address ?? "—"}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{linkedProjects.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
