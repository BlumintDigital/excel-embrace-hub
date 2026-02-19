import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export interface WorkspaceSettings {
  companyName: string;
  companyTagline: string;
  primaryColor: string;
  accentColor: string;
  sidebarStyle: "Dark" | "Light" | "Branded";
  currency: string;
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  companyName: "Blumint Workspace",
  companyTagline: "Project Management Platform",
  primaryColor: "#5B4FE8",
  accentColor: "#4DD9AC",
  sidebarStyle: "Dark",
  currency: "USD",
};

const STORAGE_KEY = "blumint_workspace_settings";

// Accepts #rrggbb, #rgb, rgb(...), rgba(...), hsl(...), hsla(...)
const COLOR_PATTERN = /^(#([0-9a-fA-F]{3}){1,2}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)|hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*\)|hsla\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*,\s*[\d.]+\s*\))$/;

function sanitizeSettings(patch: Partial<WorkspaceSettings>): Partial<WorkspaceSettings> {
  const safe = { ...patch };
  if (safe.primaryColor !== undefined && !COLOR_PATTERN.test(safe.primaryColor)) {
    delete safe.primaryColor;
  }
  if (safe.accentColor !== undefined && !COLOR_PATTERN.test(safe.accentColor)) {
    delete safe.accentColor;
  }
  // Only allow known sidebar styles
  if (safe.sidebarStyle !== undefined && !["Dark", "Light", "Branded"].includes(safe.sidebarStyle)) {
    delete safe.sidebarStyle;
  }
  // Only allow known currency codes
  const knownCurrencies = ["USD","NGN","EUR","GBP","CAD","KES","GHS","ZAR","INR","JPY"];
  if (safe.currency !== undefined && !knownCurrencies.includes(safe.currency)) {
    delete safe.currency;
  }
  return safe;
}

interface WorkspaceContextValue {
  settings: WorkspaceSettings;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch settings from database on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("workspace_settings")
          .select("setting_value")
          .eq("setting_key", "workspace")
          .maybeSingle();

        if (!error && data?.setting_value) {
          const dbSettings = { ...DEFAULT_SETTINGS, ...(data.setting_value as Partial<WorkspaceSettings>) };
          setSettings(dbSettings);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbSettings));
        }
      } catch {
        // Fall back to localStorage (already loaded in initial state)
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Sync to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = async (patch: Partial<WorkspaceSettings>) => {
    const newSettings = { ...settings, ...sanitizeSettings(patch) };
    setSettings(newSettings);

    // Persist to database
    try {
      const { error } = await supabase
        .from("workspace_settings")
        .update({ setting_value: newSettings as any, updated_at: new Date().toISOString() })
        .eq("setting_key", "workspace");

      if (error) {
        console.error("Failed to save workspace settings to database:", error.message);
      }
    } catch (err) {
      console.error("Failed to save workspace settings:", err);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
