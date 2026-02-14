import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "project_manager" | "team_member";

export interface Permissions {
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canCreateProjects: boolean;
  canEditAllProjects: boolean;
  canDeleteProjects: boolean;
  canManageBudget: boolean;
  canCreateTasks: boolean;
  canEditAllTasks: boolean;
  canDeleteAllTasks: boolean;
  canManageDocuments: boolean;
  canViewTeam: boolean;
}

const rolePermissions: Record<AppRole, Permissions> = {
  admin: {
    canManageUsers: true,
    canAssignRoles: true,
    canCreateProjects: true,
    canEditAllProjects: true,
    canDeleteProjects: true,
    canManageBudget: true,
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteAllTasks: true,
    canManageDocuments: true,
    canViewTeam: true,
  },
  project_manager: {
    canManageUsers: false,
    canAssignRoles: false,
    canCreateProjects: true,
    canEditAllProjects: true,
    canDeleteProjects: false,
    canManageBudget: true,
    canCreateTasks: true,
    canEditAllTasks: true,
    canDeleteAllTasks: false,
    canManageDocuments: true,
    canViewTeam: true,
  },
  team_member: {
    canManageUsers: false,
    canAssignRoles: false,
    canCreateProjects: false,
    canEditAllProjects: false,
    canDeleteProjects: false,
    canManageBudget: false,
    canCreateTasks: false,
    canEditAllTasks: false,
    canDeleteAllTasks: false,
    canManageDocuments: false,
    canViewTeam: true,
  },
};

export function usePermissions(): Permissions & { role: AppRole } {
  const { role } = useAuth();
  const appRole = (role as AppRole) || "team_member";
  return { ...rolePermissions[appRole] || rolePermissions.team_member, role: appRole };
}
