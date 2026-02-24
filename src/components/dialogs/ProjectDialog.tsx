import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCreateProject, useUpdateProject } from "@/hooks/use-supabase-mutations";
import { useClients } from "@/hooks/use-supabase-data";
import type { DbProject } from "@/hooks/use-supabase-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: DbProject | null;
}

const statuses = ["Planning", "In Progress", "Completed", "On Hold"];

export default function ProjectDialog({ open, onOpenChange, project }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [budgetProjected, setBudgetProjected] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [clientId, setClientId] = useState("");

  const create = useCreateProject();
  const update = useUpdateProject();
  const { data: clients = [] } = useClients();
  const isEdit = !!project;

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setStatus(project.status);
      setBudgetProjected(String(project.budget_projected || ""));
      setStartDate(project.start_date ? new Date(project.start_date + "T00:00:00") : undefined);
      setEndDate(project.end_date ? new Date(project.end_date + "T00:00:00") : undefined);
      setClientId(project.client_id || "");
    } else {
      setName(""); setDescription(""); setStatus("Planning"); setBudgetProjected(""); setStartDate(undefined); setEndDate(undefined); setClientId("");
    }
  }, [project, open]);

  const handleSubmit = async () => {
    const data = { name: name.trim(), description: description.trim() || undefined, status, budget_projected: Number(budgetProjected) || 0, start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined, end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined, client_id: clientId || undefined };
    if (!data.name) return;
    try {
      if (isEdit) {
        await update.mutateAsync({ id: project!.id, ...data });
      } else {
        await create.mutateAsync(data);
      }
      onOpenChange(false);
    } catch {
      // onError in the mutation hook handles the toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={2} /></div>
          <div><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Client</Label>
            <Select value={clientId || "__none"} onValueChange={(v) => setClientId(v === "__none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— No client —</SelectItem>
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Budget Projected ($)</Label><Input type="number" value={budgetProjected} onChange={(e) => setBudgetProjected(e.target.value)} placeholder="0" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div><Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || create.isPending || update.isPending}>
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
