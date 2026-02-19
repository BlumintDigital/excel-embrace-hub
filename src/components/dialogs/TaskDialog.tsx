import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTask, useUpdateTask } from "@/hooks/use-supabase-mutations";
import type { DbTask, DbProject, TeamMember } from "@/hooks/use-supabase-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: DbTask | null;
  projects: DbProject[];
  team: TeamMember[];
  defaultProjectId?: string;
}

const statusOptions = ["To Do", "In Progress", "Done"];
const priorityOptions = ["High", "Medium", "Low"];

export default function TaskDialog({ open, onOpenChange, task, projects, team, defaultProjectId }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [priority, setPriority] = useState("Medium");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const create = useCreateTask();
  const update = useUpdateTask();
  const isEdit = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title); setDescription(task.description || ""); setStatus(task.status);
      setPriority(task.priority); setProjectId(task.project_id || ""); setAssigneeId(task.assignee_id || ""); setDueDate(task.due_date || "");
    } else {
      setTitle(""); setDescription(""); setStatus("To Do"); setPriority("Medium"); setProjectId(defaultProjectId || ""); setAssigneeId(""); setDueDate("");
    }
  }, [task, open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const data = { title: title.trim(), description: description.trim() || undefined, status, priority, project_id: projectId || undefined, assignee_id: assigneeId || undefined, due_date: dueDate || undefined };
    if (isEdit) {
      await update.mutateAsync({ id: task!.id, ...data });
    } else {
      await create.mutateAsync(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Status</Label>
              <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{priorityOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId}><SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}><SelectTrigger><SelectValue placeholder="Select assignee" /></SelectTrigger>
              <SelectContent>{team.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.email || "Unknown"}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || create.isPending || update.isPending}>{isEdit ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
