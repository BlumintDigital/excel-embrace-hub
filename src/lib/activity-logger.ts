import { supabase } from "@/integrations/supabase/client";

export async function logActivity(params: {
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  details?: string;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user name from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    await supabase.from("activity_logs").insert({
      user_id: user.id,
      user_name: profile?.full_name || user.email || "Unknown",
      ...params,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
