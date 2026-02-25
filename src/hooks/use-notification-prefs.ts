import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface NotificationPrefs {
  emailNotifs: boolean;
  taskAssigned: boolean;
  projectUpdates: boolean;
  budgetAlerts: boolean;
  weeklyDigest: boolean;
}

const DEFAULTS: NotificationPrefs = {
  emailNotifs: true,
  taskAssigned: true,
  projectUpdates: true,
  budgetAlerts: true,
  weeklyDigest: false,
};

function storageKey(userId: string | undefined) {
  return `blumint_notif_prefs_${userId || "anon"}`;
}

function loadLocal(userId: string | undefined): NotificationPrefs {
  try {
    const stored = localStorage.getItem(storageKey(userId));
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function useNotificationPrefs() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadLocal(user?.id));
  const [saving, setSaving] = useState(false);

  // Load from DB on mount (profiles.notification_preferences column)
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data && data.notification_preferences) {
          const merged = { ...DEFAULTS, ...(data.notification_preferences as Partial<NotificationPrefs>) };
          setPrefs(merged);
          localStorage.setItem(storageKey(user.id), JSON.stringify(merged));
        }
      })
      .catch(() => {
        // Column not yet added — localStorage-only mode
      });
  }, [user?.id]);

  const savePrefs = async (updated: NotificationPrefs) => {
    setPrefs(updated);
    localStorage.setItem(storageKey(user?.id), JSON.stringify(updated));
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ notification_preferences: updated as unknown as Record<string, unknown> })
        .eq("id", user.id);
    } catch {
      // Silently ignore — localStorage already saved
    } finally {
      setSaving(false);
    }
  };

  return { prefs, savePrefs, saving };
}
