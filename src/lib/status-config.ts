// Centralized status and priority configuration
// Used across Dashboard, Projects, Tasks, Budget, Timeline, ActivityLog

/** Dot color class for project/task status */
export const STATUS_DOT_COLORS: Record<string, string> = {
  "Planning": "bg-warning",
  "In Progress": "bg-primary",
  "Completed": "bg-success",
  "On Hold": "bg-muted-foreground",
  "To Do": "bg-muted-foreground",
  "Done": "bg-success",
};

/** Badge classes for project/task status */
export const STATUS_BADGE_CLASSES: Record<string, string> = {
  "Planning": "bg-warning/10 text-warning border-warning/20",
  "In Progress": "bg-primary/10 text-primary border-primary/20",
  "Completed": "bg-success/10 text-success border-success/20",
  "On Hold": "bg-muted text-muted-foreground border-border",
  "To Do": "bg-muted text-muted-foreground border-border",
  "In Progress (Task)": "bg-primary/10 text-primary border-primary/20",
  "Done": "bg-success/10 text-success border-success/20",
};

/** Badge classes for task priority */
export const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  "High": "bg-destructive/10 text-destructive border-destructive/20",
  "Medium": "bg-warning/10 text-warning border-warning/20",
  "Low": "bg-success/10 text-success border-success/20",
};

/** Dot color class for task priority */
export const PRIORITY_DOT_COLORS: Record<string, string> = {
  "High": "bg-destructive",
  "Medium": "bg-warning",
  "Low": "bg-success",
};

/** Role badge classes */
export const ROLE_BADGE_CLASSES: Record<string, string> = {
  "admin": "bg-primary/10 text-primary border-primary/20",
  "project_manager": "bg-warning/10 text-warning border-warning/20",
  "team_member": "bg-muted text-muted-foreground border-border",
};

/** Role display labels */
export const ROLE_LABELS: Record<string, string> = {
  "admin": "Admin",
  "project_manager": "Project Manager",
  "team_member": "Team Member",
};

/** Flat chart colors — no gradients */
export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(220, 13%, 55%)",
];
