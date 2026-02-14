import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  created_at: string;
}

export function useActivityLogs(limit = 50) {
  return useQuery({
    queryKey: ["activity_logs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as ActivityLog[];
    },
    refetchInterval: 10000, // auto-refresh every 10s
  });
}
