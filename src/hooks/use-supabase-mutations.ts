import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity-logger";
import { usePermissions } from "@/hooks/use-permissions";

// ── Projects ──
export function useCreateProject() {
  const qc = useQueryClient();
  const { canCreateProjects } = usePermissions();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; status: string; start_date?: string; end_date?: string; budget_projected: number }) => {
      if (!canCreateProjects) throw new Error("Insufficient permissions");
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("projects").insert({ ...data, created_by: user.user?.id ?? null, budget_actual: 0 });
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project created"); logActivity({ action: "created", entity_type: "project", entity_name: data.name }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  const { canEditAllProjects } = usePermissions();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; status?: string; start_date?: string; end_date?: string; budget_projected?: number; budget_actual?: number }) => {
      if (!canEditAllProjects) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("projects").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project updated"); logActivity({ action: "updated", entity_type: "project", entity_name: data.name || "project", entity_id: data.id }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  const { canDeleteProjects } = usePermissions();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!canDeleteProjects) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, id) => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); logActivity({ action: "deleted", entity_type: "project", entity_id: id }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Tasks ──
export function useCreateTask() {
  const qc = useQueryClient();
  const { canCreateTasks } = usePermissions();
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; status: string; priority: string; project_id?: string; assignee_id?: string; due_date?: string; start_date?: string }) => {
      if (!canCreateTasks) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("tasks").insert(data);
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task created"); logActivity({ action: "created", entity_type: "task", entity_name: data.title }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { canEditAllTasks } = usePermissions();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; status?: string; priority?: string; project_id?: string; assignee_id?: string; due_date?: string; start_date?: string }) => {
      if (!canEditAllTasks) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("tasks").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task updated"); logActivity({ action: "updated", entity_type: "task", entity_id: data.id, details: data.status ? `Status → ${data.status}` : undefined }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const { canDeleteAllTasks } = usePermissions();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!canDeleteAllTasks) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, id) => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task deleted"); logActivity({ action: "deleted", entity_type: "task", entity_id: id }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Budget Categories ──
export function useCreateBudgetCategory() {
  const qc = useQueryClient();
  const { canManageBudget } = usePermissions();
  return useMutation({
    mutationFn: async (data: { project_id: string; name: string; projected: number; actual: number }) => {
      if (!canManageBudget) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("budget_categories").insert(data);
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["budget_categories"] }); toast.success("Category created"); logActivity({ action: "created", entity_type: "budget_category", entity_name: data.name }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBudgetCategory() {
  const qc = useQueryClient();
  const { canManageBudget } = usePermissions();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; projected?: number; actual?: number }) => {
      if (!canManageBudget) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("budget_categories").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["budget_categories"] }); toast.success("Category updated"); logActivity({ action: "updated", entity_type: "budget_category", entity_id: data.id }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBudgetCategory() {
  const qc = useQueryClient();
  const { canManageBudget } = usePermissions();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!canManageBudget) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("budget_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, id) => { qc.invalidateQueries({ queryKey: ["budget_categories"] }); toast.success("Category deleted"); logActivity({ action: "deleted", entity_type: "budget_category", entity_id: id }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Documents ──
export function useCreateDocument() {
  const qc = useQueryClient();
  const { canManageDocuments } = usePermissions();
  return useMutation({
    mutationFn: async (data: { name: string; project_id?: string; category?: string; size: number; file_path?: string }) => {
      if (!canManageDocuments) throw new Error("Insufficient permissions");
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("documents").insert({ ...data, uploaded_by: user.user?.id ?? null });
      if (error) throw error;
    },
    onSuccess: (_v, data) => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Document created"); logActivity({ action: "created", entity_type: "document", entity_name: data.name }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  const { canManageDocuments } = usePermissions();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!canManageDocuments) throw new Error("Insufficient permissions");
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_v, id) => { qc.invalidateQueries({ queryKey: ["documents"] }); toast.success("Document deleted"); logActivity({ action: "deleted", entity_type: "document", entity_id: id }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Project Members ──
export function useAddProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; user_id: string; role?: string }) => {
      const { error } = await supabase.from("project_members").insert(data);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project_members"] }); toast.success("Member added"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveProjectMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["project_members"] }); toast.success("Member removed"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── User Management (via edge functions) ──
export function useInviteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; full_name: string; role: string }) => {
      const { data: result, error } = await supabase.functions.invoke("invite-user", { body: data });
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
    },
    onSuccess: (_v, userId) => { qc.invalidateQueries({ queryKey: ["team_members"] }); toast.success("User removed"); logActivity({ action: "deleted", entity_type: "user", entity_id: userId }); },
    onError: (e: Error) => toast.error(e.message),
  });
}
