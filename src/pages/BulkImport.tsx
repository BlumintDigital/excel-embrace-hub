import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Download, Upload, FileUp, AlertCircle, CheckCircle2, X, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { useProjects, useTeamMembers } from "@/hooks/use-supabase-data";
import {
  useCreateProject,
  useCreateTask,
  useCreateClient,
  useCreateBudgetCategory,
} from "@/hooks/use-supabase-mutations";

// ── Types ─────────────────────────────────────────────────────────────────────
type EntityType = "projects" | "tasks" | "clients" | "budget_categories";
type ImportStage = "idle" | "parsed" | "importing" | "done";

interface RowError { row: number; message: string }
interface ImportResults { success: number; failed: number; errors: RowError[] }

// ── Template definitions ──────────────────────────────────────────────────────
const TEMPLATES: Record<EntityType, { headers: string[]; example: string[]; filename: string; hint: string }> = {
  projects: {
    headers: ["name", "description", "status", "start_date", "end_date", "budget_projected"],
    example:  ["Acme Rebrand", "Full brand overhaul", "Planning", "2025-01-01", "2025-06-30", "50000"],
    filename: "projects_template.csv",
    hint: "status: Planning · In Progress · Completed · On Hold. Dates: YYYY-MM-DD.",
  },
  tasks: {
    headers: ["title", "description", "status", "priority", "project_name", "assignee_email", "due_date"],
    example:  ["Design mockups", "Create initial wireframes", "To Do", "High", "Acme Rebrand", "jane@example.com", "2025-02-15"],
    filename: "tasks_template.csv",
    hint: "status: To Do · In Progress · Done. priority: High · Medium · Low. project_name must match an existing project.",
  },
  clients: {
    headers: ["name", "email", "phone", "notes"],
    example:  ["Acme Corp", "contact@acme.com", "+1 555 0100", "Key enterprise client"],
    filename: "clients_template.csv",
    hint: "Only name is required. All other fields are optional.",
  },
  budget_categories: {
    headers: ["project_name", "category_name", "projected", "actual"],
    example:  ["Acme Rebrand", "Design", "15000", "12000"],
    filename: "budget_categories_template.csv",
    hint: "project_name must match an existing project exactly. projected and actual are numbers (no currency symbol).",
  },
};

const ENTITY_LABELS: Record<EntityType, string> = {
  projects: "Projects",
  tasks: "Tasks",
  clients: "Clients",
  budget_categories: "Budget Categories",
};

// ── Validation ────────────────────────────────────────────────────────────────
function validateRows(entityType: EntityType, rows: Record<string, string>[]): RowError[] {
  const errors: RowError[] = [];
  rows.forEach((row, i) => {
    const n = i + 1;
    if (entityType === "projects") {
      if (!row.name?.trim()) errors.push({ row: n, message: "name is required" });
      if (!row.status?.trim()) errors.push({ row: n, message: "status is required" });
      if (row.budget_projected && isNaN(Number(row.budget_projected)))
        errors.push({ row: n, message: "budget_projected must be a number" });
    } else if (entityType === "tasks") {
      if (!row.title?.trim()) errors.push({ row: n, message: "title is required" });
      if (!row.status?.trim()) errors.push({ row: n, message: "status is required" });
      if (!row.priority?.trim()) errors.push({ row: n, message: "priority is required" });
    } else if (entityType === "clients") {
      if (!row.name?.trim()) errors.push({ row: n, message: "name is required" });
    } else if (entityType === "budget_categories") {
      if (!row.project_name?.trim()) errors.push({ row: n, message: "project_name is required" });
      if (!row.category_name?.trim()) errors.push({ row: n, message: "category_name is required" });
      if (row.projected === undefined || row.projected === "" || isNaN(Number(row.projected)))
        errors.push({ row: n, message: "projected must be a number" });
      if (row.actual === undefined || row.actual === "" || isNaN(Number(row.actual)))
        errors.push({ row: n, message: "actual must be a number" });
    }
  });
  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BulkImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const [entityType, setEntityType] = useState<EntityType>("projects");
  const [stage, setStage] = useState<ImportStage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<RowError[]>([]);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResults | null>(null);

  // Data for name→id lookups
  const { data: projects = [] } = useProjects();
  const { data: team = [] } = useTeamMembers();

  // Mutations
  const createProject = useCreateProject();
  const createTask = useCreateTask();
  const createClient = useCreateClient();
  const createBudgetCat = useCreateBudgetCategory();

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = () => {
    setFile(null);
    setRows([]);
    setErrors([]);
    setStage("idle");
    setProgress(0);
    setResults(null);
  };

  const handleEntityChange = (val: string) => {
    setEntityType(val as EntityType);
    reset();
  };

  // ── Template download ──────────────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const { headers, example, filename } = TEMPLATES[entityType];
    const csv = [headers.join(","), example.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── File handling ──────────────────────────────────────────────────────────
  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith(".csv")) return;
    reset();
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      });
      const rawRows = result.data;
      setRows(rawRows);
      setErrors(validateRows(entityType, rawRows));
      setStage("parsed");
    };
    reader.readAsText(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) handleFile(picked);
    e.target.value = "";
  };

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    setStage("importing");
    const res: ImportResults = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      setProgress(i + 1);
      const row = rows[i];
      try {
        if (entityType === "projects") {
          await createProject.mutateAsync({
            name: row.name.trim(),
            description: row.description?.trim() || undefined,
            status: row.status.trim(),
            start_date: row.start_date?.trim() || undefined,
            end_date: row.end_date?.trim() || undefined,
            budget_projected: Number(row.budget_projected) || 0,
          });
        } else if (entityType === "tasks") {
          const proj = projects.find(
            (p) => p.name.toLowerCase() === row.project_name?.toLowerCase().trim()
          );
          const member = team.find(
            (t) => t.email?.toLowerCase() === row.assignee_email?.toLowerCase().trim()
          );
          await createTask.mutateAsync({
            title: row.title.trim(),
            description: row.description?.trim() || undefined,
            status: row.status.trim(),
            priority: row.priority.trim(),
            project_id: proj?.id || undefined,
            assignee_id: member?.id || undefined,
            due_date: row.due_date?.trim() || undefined,
          });
        } else if (entityType === "clients") {
          await createClient.mutateAsync({
            name: row.name.trim(),
            email: row.email?.trim() || undefined,
            phone: row.phone?.trim() || undefined,
            notes: row.notes?.trim() || undefined,
          });
        } else if (entityType === "budget_categories") {
          const proj = projects.find(
            (p) => p.name.toLowerCase() === row.project_name?.toLowerCase().trim()
          );
          if (!proj) throw new Error(`Project "${row.project_name}" not found`);
          await createBudgetCat.mutateAsync({
            project_id: proj.id,
            name: row.category_name.trim(),
            projected: Number(row.projected) || 0,
            actual: Number(row.actual) || 0,
          });
        }
        res.success++;
      } catch (err) {
        res.failed++;
        res.errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    setResults(res);
    setStage("done");
  };

  // ── Preview columns ────────────────────────────────────────────────────────
  const previewHeaders = TEMPLATES[entityType].headers;
  const previewRows = rows.slice(0, 10);
  const errorRowNums = new Set(errors.map((e) => e.row));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        title="CSV Import"
        subtitle="Bulk create records by uploading a spreadsheet"
      />

      {/* ── Step 1: Entity selector ── */}
      <Tabs value={entityType} onValueChange={handleEntityChange}>
        <TabsList>
          {(Object.keys(TEMPLATES) as EntityType[]).map((key) => (
            <TabsTrigger key={key} value={key}>{ENTITY_LABELS[key]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* ── Step 2: Template download ── */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Download template for {ENTITY_LABELS[entityType]}</p>
                <p className="text-xs text-muted-foreground">{TEMPLATES[entityType].hint}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={handleDownloadTemplate}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Step 3: Upload zone ── */}
      {stage !== "importing" && stage !== "done" && (
        <Card>
          <CardContent className="p-5">
            <div
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center text-center gap-3 transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-border bg-muted/20 cursor-default"
                  : "border-border hover:border-primary/50 hover:bg-muted/10"
              }`}
              onClick={() => !file && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <>
                  <FileUp className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rows.length} row{rows.length !== 1 ? "s" : ""} detected
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground h-7 gap-1"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                  >
                    <X className="h-3 w-3" /> Remove
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop a CSV file here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Only .csv files are accepted</p>
                  </div>
                </>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleInputChange}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Step 4: Validation errors + preview (parsed) ── */}
      {stage === "parsed" && (
        <>
          {errors.length > 0 && (
            <Card className="border-destructive">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">{errors.length} validation error{errors.length !== 1 ? "s" : ""} — fix your CSV before importing</p>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="font-medium text-destructive">Row {err.row}:</span> {err.message}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Preview — {rows.length} row{rows.length !== 1 ? "s" : ""}
                {rows.length > 10 && <span className="text-sm font-normal text-muted-foreground"> (showing first 10)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="p-2 font-medium w-10">#</th>
                      {previewHeaders.map((h) => (
                        <th key={h} className="p-2 font-medium capitalize">{h.replace(/_/g, " ")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b last:border-0 ${errorRowNums.has(i + 1) ? "bg-destructive/5" : "hover:bg-muted/50"}`}
                      >
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        {previewHeaders.map((h) => (
                          <td key={h} className="p-2 max-w-[180px] truncate">{row[h] || <span className="text-muted-foreground/40 italic">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={reset}>Clear</Button>
            <Button
              size="sm"
              disabled={errors.length > 0 || rows.length === 0}
              onClick={handleImport}
            >
              <FileUp className="h-3.5 w-3.5 mr-1.5" />
              Import {rows.length} record{rows.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </>
      )}

      {/* ── Step 5: Progress ── */}
      {stage === "importing" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Importing records…</span>
              <span className="text-muted-foreground">{progress} / {rows.length}</span>
            </div>
            <Progress value={rows.length > 0 ? (progress / rows.length) * 100 : 0} className="h-2" />
            <p className="text-xs text-muted-foreground">Please wait — do not close this page.</p>
          </CardContent>
        </Card>
      )}

      {/* ── Step 6: Results ── */}
      {stage === "done" && results && (
        <Card className={results.failed === 0 ? "border-success/50" : "border-warning/50"}>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              {results.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {results.success} record{results.success !== 1 ? "s" : ""} imported successfully
                  {results.failed > 0 && `, ${results.failed} failed`}
                </p>
                <p className="text-xs text-muted-foreground">
                  The imported records are now visible in their respective pages.
                </p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-1 bg-muted/40 rounded-md p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2">Failed rows:</p>
                {results.errors.map((err, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium text-destructive">Row {err.row}:</span> {err.message}
                  </p>
                ))}
              </div>
            )}

            <Button size="sm" variant="outline" onClick={reset}>
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
