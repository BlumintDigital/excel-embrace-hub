import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types matching the DB schema
export interface DbProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_projected: number;
  budget_actual: number;
  created_by: string | null;
  created_at: string;
}

export interface DbTask {
  id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  created_at: string;
}

export interface DbBudgetCategory {
  id: string;
  project_id: string;
  name: string;
  projected: number;
  actual: number;
}

export interface DbDocument {
  id: string;
  project_id: string | null;
  name: string;
  file_path: string | null;
  category: string | null;
  uploaded_by: string | null;
  size: number;
  created_at: string;
}

export interface DbProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export interface DbProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string | null;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role: string;
}

// Team member with role info
export interface TeamMember extends DbProfile {
  app_role: string | null;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DbProject[];
    },
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DbTask[];
    },
  });
}

export function useBudgetCategories(projectId?: string) {
  return useQuery({
    queryKey: ["budget_categories", projectId],
    queryFn: async () => {
      let query = supabase.from("budget_categories").select("*");
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as DbBudgetCategory[];
    },
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DbDocument[];
    },
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      // Fetch profiles and user_roles separately, then merge
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("*"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const profiles = (profilesRes.data || []) as DbProfile[];
      const roles = (rolesRes.data || []) as DbUserRole[];

      return profiles.map((p) => ({
        ...p,
        app_role: roles.find((r) => r.user_id === p.id)?.role || "team_member",
      })) as TeamMember[];
    },
  });
}

export function useProjectMembers() {
  return useQuery({
    queryKey: ["project_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_members").select("*");
      if (error) throw error;
      return (data || []) as DbProjectMember[];
    },
  });
}
