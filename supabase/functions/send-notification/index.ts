import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") || "https://excel-embrace-hub.lovable.app";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "notifications@resend.dev";

const ALLOWED_ORIGINS = [
  SITE_URL,
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// Maps event_type to the notification preference key
const PREF_MAP: Record<string, string> = {
  task_assigned: "taskAssigned",
  project_updated: "projectUpdates",
  budget_alert: "budgetAlerts",
};

const EVENT_LABELS: Record<string, string> = {
  task_assigned: "Task Assigned",
  project_updated: "Project Update",
  budget_alert: "Budget Alert",
};

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

function buildEmailHtml(eventLabel: string, entityName: string, details: string, siteUrl: string) {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a2e">
      <div style="background:#5B4FE8;padding:24px 32px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;color:#fff;font-size:20px">Blumint Workspace</h1>
      </div>
      <div style="background:#f9f9fb;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em">${eventLabel}</p>
        <h2 style="margin:0 0 12px;font-size:18px">${entityName}</h2>
        <p style="margin:0 0 24px;color:#374151">${details}</p>
        <a href="${siteUrl}" style="display:inline-block;background:#5B4FE8;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px">Open Workspace</a>
        <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb"/>
        <p style="margin:0;font-size:12px;color:#9ca3af">You received this because your notification preferences are enabled. <a href="${siteUrl}/settings" style="color:#5B4FE8">Manage preferences</a></p>
      </div>
    </div>
  `;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_type, entity_name, details, target_user_ids } = await req.json() as {
      event_type: string;
      entity_name: string;
      details: string;
      target_user_ids?: string[];
    };

    if (!event_type || !entity_name) {
      return new Response(JSON.stringify({ error: "event_type and entity_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prefKey = PREF_MAP[event_type];
    if (!prefKey) {
      return new Response(JSON.stringify({ error: `Unknown event_type: ${event_type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all profiles with email notifications enabled and the relevant pref on
    let query = adminClient
      .from("profiles")
      .select("id, email, full_name, notification_preferences");

    if (target_user_ids && target_user_ids.length > 0) {
      query = query.in("id", target_user_ids);
    }

    const { data: profiles, error: profileError } = await query;
    if (profileError) throw profileError;

    const eventLabel = EVENT_LABELS[event_type] || event_type;
    const subject = `${eventLabel}: ${entity_name}`;
    const html = buildEmailHtml(eventLabel, entity_name, details || "", SITE_URL);

    const sends: Promise<void>[] = [];
    for (const profile of profiles || []) {
      if (!profile.email) continue;
      const prefs = (profile.notification_preferences as Record<string, boolean> | null) ?? {};
      const emailEnabled = prefs.emailNotifs !== false; // default true
      const prefEnabled = prefs[prefKey] !== false;     // default true
      if (emailEnabled && prefEnabled) {
        sends.push(sendEmail(profile.email, subject, html));
      }
    }

    await Promise.allSettled(sends);

    return new Response(JSON.stringify({ success: true, sent: sends.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
