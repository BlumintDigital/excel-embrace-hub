import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDocument } from "@/hooks/use-supabase-mutations";
import type { DbProject } from "@/hooks/use-supabase-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: DbProject[];
}

const categories = ["Drawings", "Reports", "Permits", "Specifications", "Other"];

export default function DocumentDialog({ open, onOpenChange, projects }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Reports");
  const [projectId, setProjectId] = useState("");
  const [size, setSize] = useState("");

  const create = useCreateDocument();

  useEffect(() => {
    if (open) { setName(""); setCategory("Reports"); setProjectId(""); setSize(""); }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await create.mutateAsync({ name: name.trim(), category, project_id: projectId || undefined, size: Number(size) || 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Document Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Site Plan v2.pdf" /></div>
          <div><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>File Size (bytes)</Label><Input type="number" value={size} onChange={(e) => setSize(e.target.value)} placeholder="0" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
