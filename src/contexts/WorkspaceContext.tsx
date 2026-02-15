import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WorkspaceSettings {
  companyName: string;
  companyTagline: string;
  primaryColor: string;
  accentColor: string;
  sidebarStyle: "Dark" | "Light" | "Branded";
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  companyName: "Blumint Workspace",
  companyTagline: "Project Management Platform",
  primaryColor: "#5B4FE8",
  accentColor: "#4DD9AC",
  sidebarStyle: "Dark",
};

const STORAGE_KEY = "blumint_workspace_settings";

interface WorkspaceContextValue {
  settings: WorkspaceSettings;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch: Partial<WorkspaceSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  return (
    <WorkspaceContext.Provider value={{ settings, updateSettings }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
