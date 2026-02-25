import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

// Converts #rrggbb → "H S% L%" (Tailwind HSL format, no wrapper)
function hexToHsl(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyFavicon(url: string | undefined) {
  const href = url || "/favicon.ico";
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = href;
}

function applyTheme(settings: { primaryColor: string; accentColor: string; sidebarStyle: "Dark" | "Light" | "Branded" }) {
  const root = document.documentElement;
  const primaryHsl = hexToHsl(settings.primaryColor);
  const accentHsl = hexToHsl(settings.accentColor);

  if (primaryHsl) {
    root.style.setProperty("--primary", primaryHsl);
    root.style.setProperty("--ring", primaryHsl);
    root.style.setProperty("--sidebar-primary", primaryHsl);
    root.style.setProperty("--sidebar-ring", primaryHsl);
  }
  if (accentHsl) {
    root.style.setProperty("--accent", accentHsl);
  }

  if (settings.sidebarStyle === "Light") {
    root.style.setProperty("--sidebar-background", "0 0% 100%");
    root.style.setProperty("--sidebar-foreground", "222 47% 11%");
    root.style.setProperty("--sidebar-accent", "220 14% 96%");
    root.style.setProperty("--sidebar-border", "220 13% 88%");
    root.style.setProperty("--sidebar-muted", "220 9% 46%");
  } else if (settings.sidebarStyle === "Dark") {
    root.style.setProperty("--sidebar-background", "222 47% 11%");
    root.style.setProperty("--sidebar-foreground", "220 14% 96%");
    root.style.setProperty("--sidebar-accent", "222 40% 18%");
    root.style.setProperty("--sidebar-border", "222 30% 20%");
    root.style.setProperty("--sidebar-muted", "220 9% 46%");
  } else if (settings.sidebarStyle === "Branded" && primaryHsl) {
    const hue = Math.round(parseFloat(primaryHsl.split(" ")[0]));
    const sat = Math.round(parseFloat(primaryHsl.split(" ")[1]));
    root.style.setProperty("--sidebar-background", `${hue} ${sat}% 22%`);
    root.style.setProperty("--sidebar-foreground", "0 0% 100%");
    root.style.setProperty("--sidebar-accent", `${hue} ${sat}% 32%`);
    root.style.setProperty("--sidebar-border", `${hue} ${Math.round(sat * 0.7)}% 28%`);
    root.style.setProperty("--sidebar-muted", `${hue} ${Math.round(sat * 0.4)}% 70%`);
  }
}

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
  faviconUrl?: string;
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
  // Validate faviconUrl: must be a data URL (data:image/...) or empty string (reset)
  if (safe.faviconUrl !== undefined) {
    if (safe.faviconUrl !== "" && !safe.faviconUrl.startsWith("data:image/")) {
      delete safe.faviconUrl;
    }
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

  // Apply CSS variables to document root whenever theme settings change
  useEffect(() => {
    applyTheme(settings);
  }, [settings.primaryColor, settings.accentColor, settings.sidebarStyle]);

  // Apply favicon whenever it changes
  useEffect(() => {
    applyFavicon(settings.faviconUrl);
  }, [settings.faviconUrl]);

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
