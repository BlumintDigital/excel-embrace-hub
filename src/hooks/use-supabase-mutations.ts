import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity-logger";
import { usePermissions } from "@/hooks/use-permissions";
import { retryOrQueue } from "@/lib/sync-queue";
import type {
  DbProject,
  DbTask,
  DbBudgetCategory,
  DbDocument,
  DbProjectMember,
  DbClient,
} from "./use-supabase-data";

// Fire-and-forget email notification helper
function sendEmailNotification(params: {
  event_type: "task_assigned" | "project_updated" | "budget_alert";
  entity_name: string;
  details: string;
  target_user_ids?: string[];
}) {
  supabase.functions.invoke("send-notification", { body: params }).catch(() => {
    // silently ignore — email is best-effort
  });
}

// ── Projects ──
export function useCreateProject() {
  const qc = useQueryClient();
  const { canCreateProjects } = usePermissions();
  return useMutation({
    onMutate: async (data: { name: string; description?: string; status: string; start_date?: string; end_date?: string; budget_projected: number; currency?: string; client_id?: string }) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<DbProject[]>(["projects"]) ?? [];
      qc.setQueryData<DbProject[]>(["projects"], [
        { ...data, id: `offline_${crypto.randomUUID()}`, budget_actual: 0, currency: data.currency ?? null, created_by: null, created_at: new Date().toISOString() } as DbProject,
        ...prev,
      ]);
      return { prev };
    },
    mutationFn: async (data: { name: string; description?: string; status: string; start_date?: string; end_date?: string; budget_projected: number; currency?: string; client_id?: string }) => {
      if (!canCreateProjects) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "projects", op: "insert", payload: data, queryKeys: [["projects"]] },
        async () => {
          const { data: user } = await supabase.auth.getUser();
          const { error } = await supabase.from("projects").insert({ ...data, created_by: user.user?.id ?? null, budget_actual: 0 });
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      logActivity({ action: "created", entity_type: "project", entity_name: data.name });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const { canEditAllProjects } = usePermissions();
  return useMutation({
    onMutate: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string; start_date?: string; end_date?: string; budget_projected?: number; budget_actual?: number; currency?: string; client_id?: string }) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<DbProject[]>(["projects"]) ?? [];
      qc.setQueryData<DbProject[]>(["projects"], prev.map(p => p.id === id ? { ...p, ...data } : p));
      return { prev };
    },
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string; start_date?: string; end_date?: string; budget_projected?: number; budget_actual?: number; currency?: string; client_id?: string }) => {
      if (!canEditAllProjects) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "projects", op: "update", payload: data, filter: { id }, queryKeys: [["projects"]] },
        async () => {
          const { error } = await supabase.from("projects").update(data).eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project updated");
      logActivity({ action: "updated", entity_type: "project", entity_name: data.name || "project", entity_id: data.id });
      if (data.status) {
        sendEmailNotification({
          event_type: "project_updated",
          entity_name: data.name || "A project",
          details: `Project status changed to: ${data.status}`,
        });
      }
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const { canDeleteProjects } = usePermissions();
  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["projects"] });
      const prev = qc.getQueryData<DbProject[]>(["projects"]) ?? [];
      qc.setQueryData<DbProject[]>(["projects"], prev.filter(p => p.id !== id));
      return { prev };
    },
    mutationFn: async (id: string) => {
      if (!canDeleteProjects) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "projects", op: "delete", payload: {}, filter: { id }, queryKeys: [["projects"]] },
        async () => {
          const { error } = await supabase.from("projects").delete().eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, id) => {
      if (result?.queuedOffline) { toast.info("Deleted offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
      logActivity({ action: "deleted", entity_type: "project", entity_id: id });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["projects"], ctx.prev);
      toast.error(e.message);
    },
  });
}

// ── Tasks ──
export function useCreateTask() {
  const qc = useQueryClient();
  const { canCreateTasks } = usePermissions();
  return useMutation({
    onMutate: async (data: { title: string; description?: string; status: string; priority: string; project_id?: string; assignee_id?: string; due_date?: string; start_date?: string }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<DbTask[]>(["tasks"]) ?? [];
      qc.setQueryData<DbTask[]>(["tasks"], [
        { ...data, id: `offline_${crypto.randomUUID()}`, created_at: new Date().toISOString() } as DbTask,
        ...prev,
      ]);
      return { prev };
    },
    mutationFn: async (data: { title: string; description?: string; status: string; priority: string; project_id?: string; assignee_id?: string; due_date?: string; start_date?: string }) => {
      if (!canCreateTasks) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "tasks", op: "insert", payload: data, queryKeys: [["tasks"]] },
        async () => {
          const { error } = await supabase.from("tasks").insert(data);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
      logActivity({ action: "created", entity_type: "task", entity_name: data.title });
      if (data.assignee_id) {
        sendEmailNotification({
          event_type: "task_assigned",
          entity_name: data.title,
          details: `You have been assigned a new task.`,
          target_user_ids: [data.assignee_id],
        });
      }
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { canEditAllTasks } = usePermissions();
  return useMutation({
    onMutate: async ({ id, ...data }: { id: string; title?: string; description?: string; status?: string; priority?: string; project_id?: string; assignee_id?: string; due_date?: string; start_date?: string }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<DbTask[]>(["tasks"]) ?? [];
      qc.setQueryData<DbTask[]>(["tasks"], prev.map(t => t.id === id ? { ...t, ...data } : t));
      return { prev };
    },
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; status?: string; priority?: string; project_id?: string; assignee_id?: string; due_date?: string; start_date?: string }) => {
      if (!canEditAllTasks) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "tasks", op: "update", payload: data, filter: { id }, queryKeys: [["tasks"]] },
        async () => {
          const { error } = await supabase.from("tasks").update(data).eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task updated");
      logActivity({ action: "updated", entity_type: "task", entity_id: data.id, details: data.status ? `Status → ${data.status}` : undefined });
      if (data.assignee_id) {
        sendEmailNotification({
          event_type: "task_assigned",
          entity_name: `Task ${data.id}`,
          details: `You have been assigned to a task.`,
          target_user_ids: [data.assignee_id],
        });
      }
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { canDeleteAllTasks } = usePermissions();
  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      const prev = qc.getQueryData<DbTask[]>(["tasks"]) ?? [];
      qc.setQueryData<DbTask[]>(["tasks"], prev.filter(t => t.id !== id));
      return { prev };
    },
    mutationFn: async (id: string) => {
      if (!canDeleteAllTasks) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "tasks", op: "delete", payload: {}, filter: { id }, queryKeys: [["tasks"]] },
        async () => {
          const { error } = await supabase.from("tasks").delete().eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, id) => {
      if (result?.queuedOffline) { toast.info("Deleted offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
      logActivity({ action: "deleted", entity_type: "task", entity_id: id });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["tasks"], ctx.prev);
      toast.error(e.message);
    },
  });
}

// ── Budget Categories ──
export function useCreateBudgetCategory() {
  const qc = useQueryClient();
  const { canManageBudget } = usePermissions();
  return useMutation({
    onMutate: async (data: { project_id: string; name: string; projected: number; actual: number }) => {
      await qc.cancelQueries({ queryKey: ["budget_categories"] });
      const prev = qc.getQueryData<DbBudgetCategory[]>(["budget_categories", data.project_id]) ?? [];
      qc.setQueryData<DbBudgetCategory[]>(["budget_categories", data.project_id], [
        { ...data, id: `offline_${crypto.randomUUID()}` },
        ...prev,
      ]);
      return { prev, projectId: data.project_id };
    },
    mutationFn: async (data: { project_id: string; name: string; projected: number; actual: number }) => {
      if (!canManageBudget) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "budget_categories", op: "insert", payload: data, queryKeys: [["budget_categories"]] },
        async () => {
          const { error } = await supabase.from("budget_categories").insert(data);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["budget_categories"] });
      toast.success("Category created");
      logActivity({ action: "created", entity_type: "budget_category", entity_name: data.name });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev && ctx?.projectId) qc.setQueryData(["budget_categories", ctx.projectId], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useUpdateBudgetCategory() {
  const qc = useQueryClient();
  const { canManageBudget } = usePermissions();
  return useMutation({
    onMutate: async ({ id, ...data }: { id: string; name?: string; projected?: number; actual?: number }) => {
      await qc.cancelQueries({ queryKey: ["budget_categories"] });
      const snapshots: Array<{ key: unknown[]; prev: DbBudgetCategory[] }> = [];
      for (const q of qc.getQueryCache().findAll({ queryKey: ["budget_categories"] })) {
        const prev = q.state.data as DbBudgetCategory[] | undefined;
        if (prev) {
          snapshots.push({ key: q.queryKey as unknown[], prev });
          qc.setQueryData(q.queryKey, prev.map(c => c.id === id ? { ...c, ...data } : c));
        }
      }
      return { snapshots };
    },
    mutationFn: async ({ id, ...data }: { id: string; name?: string; projected?: number; actual?: number }) => {
      if (!canManageBudget) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "budget_categories", op: "update", payload: data, filter: { id }, queryKeys: [["budget_categories"]] },
        async () => {
          const { error } = await supabase.from("budget_categories").update(data).eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["budget_categories"] });
      toast.success("Category updated");
      logActivity({ action: "updated", entity_type: "budget_category", entity_id: data.id });
      if (data.actual !== undefined && data.projected !== undefined && data.actual > data.projected) {
        sendEmailNotification({
          event_type: "budget_alert",
          entity_name: data.name || "Budget category",
          details: `Actual spend ($${data.actual}) has exceeded the projected budget ($${data.projected}).`,
        });
      }
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.snapshots) for (const { key, prev } of ctx.snapshots) qc.setQueryData(key, prev);
      toast.error(e.message);
    },
  });
}

export function useDeleteBudgetCategory() {
  const qc = useQueryClient();
  const { canManageBudget } = usePermissions();
  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["budget_categories"] });
      const snapshots: Array<{ key: unknown[]; prev: DbBudgetCategory[] }> = [];
      for (const q of qc.getQueryCache().findAll({ queryKey: ["budget_categories"] })) {
        const prev = q.state.data as DbBudgetCategory[] | undefined;
        if (prev) {
          snapshots.push({ key: q.queryKey as unknown[], prev });
          qc.setQueryData(q.queryKey, prev.filter(c => c.id !== id));
        }
      }
      return { snapshots };
    },
    mutationFn: async (id: string) => {
      if (!canManageBudget) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "budget_categories", op: "delete", payload: {}, filter: { id }, queryKeys: [["budget_categories"]] },
        async () => {
          const { error } = await supabase.from("budget_categories").delete().eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, id) => {
      if (result?.queuedOffline) { toast.info("Deleted offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["budget_categories"] });
      toast.success("Category deleted");
      logActivity({ action: "deleted", entity_type: "budget_category", entity_id: id });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.snapshots) for (const { key, prev } of ctx.snapshots) qc.setQueryData(key, prev);
      toast.error(e.message);
    },
  });
}

// ── Documents ──
export function useCreateDocument() {
  const qc = useQueryClient();
  const { canManageDocuments } = usePermissions();
  return useMutation({
    onMutate: async (data: { name: string; project_id?: string; category?: string; size: number; file_path?: string }) => {
      await qc.cancelQueries({ queryKey: ["documents"] });
      const prev = qc.getQueryData<DbDocument[]>(["documents"]) ?? [];
      qc.setQueryData<DbDocument[]>(["documents"], [
        { ...data, id: `offline_${crypto.randomUUID()}`, uploaded_by: null, created_at: new Date().toISOString() } as DbDocument,
        ...prev,
      ]);
      return { prev };
    },
    mutationFn: async (data: { name: string; project_id?: string; category?: string; size: number; file_path?: string }) => {
      if (!canManageDocuments) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "documents", op: "insert", payload: data, queryKeys: [["documents"]] },
        async () => {
          const { data: user } = await supabase.auth.getUser();
          const { error } = await supabase.from("documents").insert({ ...data, uploaded_by: user.user?.id ?? null });
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document created");
      logActivity({ action: "created", entity_type: "document", entity_name: data.name });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["documents"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  const { canManageDocuments } = usePermissions();
  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["documents"] });
      const prev = qc.getQueryData<DbDocument[]>(["documents"]) ?? [];
      qc.setQueryData<DbDocument[]>(["documents"], prev.filter(d => d.id !== id));
      return { prev };
    },
    mutationFn: async (id: string) => {
      if (!canManageDocuments) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "documents", op: "delete", payload: {}, filter: { id }, queryKeys: [["documents"]] },
        async () => {
          const { error } = await supabase.from("documents").delete().eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, id) => {
      if (result?.queuedOffline) { toast.info("Deleted offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
      logActivity({ action: "deleted", entity_type: "document", entity_id: id });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["documents"], ctx.prev);
      toast.error(e.message);
    },
  });
}

// ── Project Members ──
export function useAddProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    onMutate: async (data: { project_id: string; user_id: string; role?: string }) => {
      await qc.cancelQueries({ queryKey: ["project_members"] });
      const prev = qc.getQueryData<DbProjectMember[]>(["project_members"]) ?? [];
      qc.setQueryData<DbProjectMember[]>(["project_members"], [
        { ...data, id: `offline_${crypto.randomUUID()}`, role: data.role ?? null },
        ...prev,
      ]);
      return { prev };
    },
    mutationFn: async (data: { project_id: string; user_id: string; role?: string }) => {
      return retryOrQueue(
        { table: "project_members", op: "insert", payload: data, queryKeys: [["project_members"]] },
        async () => {
          const { error } = await supabase.from("project_members").insert(data);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["project_members"] });
      toast.success("Member added");
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["project_members"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useRemoveProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["project_members"] });
      const prev = qc.getQueryData<DbProjectMember[]>(["project_members"]) ?? [];
      qc.setQueryData<DbProjectMember[]>(["project_members"], prev.filter(m => m.id !== id));
      return { prev };
    },
    mutationFn: async (id: string) => {
      return retryOrQueue(
        { table: "project_members", op: "delete", payload: {}, filter: { id }, queryKeys: [["project_members"]] },
        async () => {
          const { error } = await supabase.from("project_members").delete().eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result) => {
      if (result?.queuedOffline) { toast.info("Removed offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["project_members"] });
      toast.success("Member removed");
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["project_members"], ctx.prev);
      toast.error(e.message);
    },
  });
}

// ── Clients ──
export function useCreateClient() {
  const qc = useQueryClient();
  const { canCreateProjects } = usePermissions();
  return useMutation({
    onMutate: async (data: { name: string; email?: string; phone?: string; notes?: string }) => {
      await qc.cancelQueries({ queryKey: ["clients"] });
      const prev = qc.getQueryData<DbClient[]>(["clients"]) ?? [];
      qc.setQueryData<DbClient[]>(["clients"], [
        { ...data, id: `offline_${crypto.randomUUID()}`, email: data.email ?? null, phone: data.phone ?? null, notes: data.notes ?? null, address: null, contact_person: null, created_by: null, created_at: new Date().toISOString() },
        ...prev,
      ]);
      return { prev };
    },
    mutationFn: async (data: { name: string; email?: string; phone?: string; notes?: string }) => {
      if (!canCreateProjects) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "clients", op: "insert", payload: data, queryKeys: [["clients"]] },
        async () => {
          const { data: user } = await supabase.auth.getUser();
          const { error } = await supabase.from("clients").insert({ ...data, created_by: user.user?.id ?? null });
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client created");
      logActivity({ action: "created", entity_type: "client", entity_name: data.name });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["clients"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  const { canEditAllProjects } = usePermissions();
  return useMutation({
    onMutate: async ({ id, ...data }: { id: string; name?: string; email?: string; phone?: string; notes?: string }) => {
      await qc.cancelQueries({ queryKey: ["clients"] });
      const prev = qc.getQueryData<DbClient[]>(["clients"]) ?? [];
      qc.setQueryData<DbClient[]>(["clients"], prev.map(c => c.id === id ? { ...c, ...data } : c));
      return { prev };
    },
    mutationFn: async ({ id, ...data }: { id: string; name?: string; email?: string; phone?: string; notes?: string }) => {
      if (!canEditAllProjects) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "clients", op: "update", payload: data, filter: { id }, queryKeys: [["clients"]] },
        async () => {
          const { error } = await supabase.from("clients").update(data).eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, data) => {
      if (result?.queuedOffline) { toast.info("Saved offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client updated");
      logActivity({ action: "updated", entity_type: "client", entity_name: data.name || "client", entity_id: data.id });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["clients"], ctx.prev);
      toast.error(e.message);
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  const { canDeleteProjects } = usePermissions();
  return useMutation({
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["clients"] });
      const prev = qc.getQueryData<DbClient[]>(["clients"]) ?? [];
      qc.setQueryData<DbClient[]>(["clients"], prev.filter(c => c.id !== id));
      return { prev };
    },
    mutationFn: async (id: string) => {
      if (!canDeleteProjects) throw new Error("Insufficient permissions");
      return retryOrQueue(
        { table: "clients", op: "delete", payload: {}, filter: { id }, queryKeys: [["clients"], ["projects"]] },
        async () => {
          const { error } = await supabase.from("clients").delete().eq("id", id);
          if (error) throw error;
        }
      );
    },
    onSuccess: (result, id) => {
      if (result?.queuedOffline) { toast.info("Deleted offline — will sync when connected"); return; }
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Client deleted");
      logActivity({ action: "deleted", entity_type: "client", entity_id: id });
    },
    onError: (e: Error, _v, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(["clients"], ctx.prev);
      toast.error(e.message);
    },
  });
}

// ── User Management (via edge functions) — online-only, not queued ──
export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; full_name: string; role: string }) => {
      const { data: result, error } = await supabase.functions.invoke("invite-user", { body: data });
      if (error) {
        let msg = error.message || "Failed to invite user";
        const ctx = (error as any).context as Response | undefined;
        if (ctx) {
          try {
            const text = await ctx.text();
            const body = JSON.parse(text);
            if (body?.error) msg = body.error;
          } catch { /* ignore */ }
        }
        throw new Error(msg);
      }
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (_result, data) => {
      qc.invalidateQueries({ queryKey: ["team_members"] });
      toast.success(`Invitation sent to ${data.email}. They will receive an email to set their password.`);
      logActivity({ action: "invited", entity_type: "user", entity_name: data.full_name, details: `Role: ${data.role}` });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { user_id: string; role: string }) => {
      const { data: result, error } = await supabase.functions.invoke("update-user-role", { body: data });
      if (error) {
        let msg = error.message || "Failed to update role";
        const ctx = (error as any).context as Response | undefined;
        if (ctx) {
          try {
            const text = await ctx.text();
            const body = JSON.parse(text);
            if (body?.error) msg = body.error;
          } catch { /* ignore */ }
        }
        throw new Error(msg);
      }
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["team_members"] }); toast.success("Role updated"); logActivity({ action: "changed role", entity_type: "role", entity_id: data.user_id, details: `New role: ${data.role}` }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: result, error } = await supabase.functions.invoke("delete-user", { body: { user_id: userId } });
      if (error) {
        let msg = error.message || "Failed to delete user";
        const ctx = (error as any).context as Response | undefined;
        if (ctx) {
          try {
            const text = await ctx.text();
            const body = JSON.parse(text);
            if (body?.error) msg = body.error;
          } catch { /* ignore */ }
        }
        throw new Error(msg);
      }
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: (_v, userId) => { qc.invalidateQueries({ queryKey: ["team_members"] }); toast.success("User removed"); logActivity({ action: "deleted", entity_type: "user", entity_id: userId }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
