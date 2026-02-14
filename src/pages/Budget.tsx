import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Loader2, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useProjects, useBudgetCategories, DbBudgetCategory } from "@/hooks/use-supabase-data";
import { useDeleteBudgetCategory } from "@/hooks/use-supabase-mutations";
import BudgetCategoryDialog from "@/components/dialogs/BudgetCategoryDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

const PIE_COLORS = ["hsl(243, 75%, 59%)", "hsl(167, 72%, 60%)", "hsl(38, 92%, 50%)", "hsl(142, 76%, 36%)", "hsl(0, 84%, 60%)", "hsl(270, 60%, 60%)"];

export default function Budget() {
  const { data: projects = [], isLoading: lp } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const activeProjectId = selectedProject || projects[0]?.id || "";
  const { data: categories = [], isLoading: lb } = useBudgetCategories(activeProjectId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<DbBudgetCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleteCat = useDeleteBudgetCategory();

  if (lp) {
    return <div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (projects.length === 0) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Budget</h1>
        <Card><CardContent className="p-8 text-center text-muted-foreground">No projects yet. Create a project first to track budgets.</CardContent></Card>
      </div>
    );
  }

  const totalProjected = categories.reduce((s, c) => s + (c.projected || 0), 0);
  const totalActual = categories.reduce((s, c) => s + (c.actual || 0), 0);
  const difference = totalProjected - totalActual;
  const percentUsed = totalProjected > 0 ? Math.round((totalActual / totalProjected) * 100) : 0;

  const barData = categories.map((c) => ({ name: c.name, Projected: (c.projected || 0) / 1000, Actual: (c.actual || 0) / 1000 }));
  const pieData = categories.map((c) => ({ name: c.name, value: c.actual || 0 }));

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground mt-1">Track projected vs. actual costs</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={activeProjectId} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
            <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => { setEditCat(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Add Category</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Projected Budget", value: `$${(totalProjected / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-primary" },
          { label: "Actual Spent", value: `$${(totalActual / 1000).toFixed(0)}k`, icon: percentUsed > 80 ? TrendingDown : TrendingUp, color: percentUsed > 80 ? "text-destructive" : "text-success" },
          { label: "Remaining", value: `$${(difference / 1000).toFixed(0)}k`, icon: difference < 0 ? AlertTriangle : DollarSign, color: difference < 0 ? "text-destructive" : "text-success" },
        ].map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg bg-muted p-2.5 ${card.color}`}><card.icon className="h-5 w-5" /></div>
                  <div><p className="text-2xl font-heading font-bold">{card.value}</p><p className="text-xs text-muted-foreground">{card.label}</p></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {categories.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No budget categories for this project yet. Add one to start tracking.</CardContent></Card>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">Category Comparison (in $K)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Bar dataKey="Projected" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Actual" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Expense Breakdown</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie><Tooltip contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} /></PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {pieData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{item.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Budget Details</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium text-right">Projected</th>
                    <th className="p-3 font-medium text-right">Actual</th>
                    <th className="p-3 font-medium text-right">Difference</th>
                    <th className="p-3 font-medium text-right">% Used</th>
                    <th className="p-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => {
                    const diff = (cat.projected || 0) - (cat.actual || 0);
                    const pct = cat.projected > 0 ? Math.round(((cat.actual || 0) / cat.projected) * 100) : 0;
                    return (
                      <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3 text-sm font-medium">{cat.name}</td>
                        <td className="p-3 text-sm text-right">${(cat.projected || 0).toLocaleString()}</td>
                        <td className="p-3 text-sm text-right">${(cat.actual || 0).toLocaleString()}</td>
                        <td className={`p-3 text-sm text-right font-medium ${diff >= 0 ? "text-success" : "text-destructive"}`}>{diff >= 0 ? "+" : ""}${diff.toLocaleString()}</td>
                        <td className="p-3 text-sm text-right">{pct}%</td>
                        <td className="p-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditCat(cat); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/50 font-semibold">
                    <td className="p-3 text-sm">Total</td>
                    <td className="p-3 text-sm text-right">${totalProjected.toLocaleString()}</td>
                    <td className="p-3 text-sm text-right">${totalActual.toLocaleString()}</td>
                    <td className={`p-3 text-sm text-right ${difference >= 0 ? "text-success" : "text-destructive"}`}>{difference >= 0 ? "+" : ""}${difference.toLocaleString()}</td>
                    <td className="p-3 text-sm text-right">{percentUsed}%</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <BudgetCategoryDialog open={dialogOpen} onOpenChange={setDialogOpen} category={editCat} projectId={activeProjectId} />
      <DeleteConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} onConfirm={() => { if (deleteId) { deleteCat.mutate(deleteId); setDeleteId(null); } }} title="Delete Category" />
    </div>
  );
}
