import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBudgetCategory, useUpdateBudgetCategory } from "@/hooks/use-supabase-mutations";
import type { DbBudgetCategory } from "@/hooks/use-supabase-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: DbBudgetCategory | null;
  projectId: string;
}

export default function BudgetCategoryDialog({ open, onOpenChange, category, projectId }: Props) {
  const [name, setName] = useState("");
  const [projected, setProjected] = useState("");
  const [actual, setActual] = useState("");

  const create = useCreateBudgetCategory();
  const update = useUpdateBudgetCategory();
  const isEdit = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name); setProjected(String(category.projected)); setActual(String(category.actual));
    } else {
      setName(""); setProjected(""); setActual("0");
    }
  }, [category, open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (isEdit) {
      await update.mutateAsync({ id: category!.id, name: name.trim(), projected: Number(projected) || 0, actual: Number(actual) || 0 });
    } else {
      await create.mutateAsync({ project_id: projectId, name: name.trim(), projected: Number(projected) || 0, actual: Number(actual) || 0 });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Category" : "New Budget Category"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Category Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Materials" /></div>
          <div><Label>Projected ($)</Label><Input type="number" value={projected} onChange={(e) => setProjected(e.target.value)} /></div>
          <div><Label>Actual ($)</Label><Input type="number" value={actual} onChange={(e) => setActual(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || create.isPending || update.isPending}>{isEdit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
