export type ProjectStatus = "Planning" | "In Progress" | "Completed" | "On Hold";
export type TaskStatus = "To Do" | "In Progress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";
export type UserRole = "Admin" | "Project Manager" | "Team Member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  budgetProjected: number;
  budgetActual: number;
  teamIds: string[];
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
  startDate: string;
}

export interface BudgetCategory {
  id: string;
  projectId: string;
  name: string;
  projected: number;
  actual: number;
}

export const mockUsers: User[] = [
  { id: "u1", name: "Alex Rivera", email: "alex@pipeworks.com", role: "Admin" },
  { id: "u2", name: "Jordan Chen", email: "jordan@pipeworks.com", role: "Project Manager" },
  { id: "u3", name: "Sam Patel", email: "sam@pipeworks.com", role: "Team Member" },
  { id: "u4", name: "Morgan Lee", email: "morgan@pipeworks.com", role: "Team Member" },
  { id: "u5", name: "Casey Brooks", email: "casey@pipeworks.com", role: "Team Member" },
  { id: "u6", name: "Taylor Kim", email: "taylor@pipeworks.com", role: "Project Manager" },
];

export const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Refinery Pipeline Upgrade",
    description: "Complete overhaul of the main refinery pipeline system including valve replacements and pressure testing.",
    status: "In Progress",
    startDate: "2026-01-15",
    endDate: "2026-06-30",
    budgetProjected: 450000,
    budgetActual: 187500,
    teamIds: ["u1", "u2", "u3", "u4"],
  },
  {
    id: "p2",
    name: "Water Treatment Plant Piping",
    description: "New piping installation for the municipal water treatment facility expansion.",
    status: "Planning",
    startDate: "2026-03-01",
    endDate: "2026-09-15",
    budgetProjected: 320000,
    budgetActual: 12000,
    teamIds: ["u2", "u5", "u6"],
  },
  {
    id: "p3",
    name: "Gas Distribution Network",
    description: "Expansion of the natural gas distribution network to the new industrial zone.",
    status: "In Progress",
    startDate: "2025-11-01",
    endDate: "2026-04-30",
    budgetProjected: 680000,
    budgetActual: 412000,
    teamIds: ["u1", "u3", "u6"],
  },
  {
    id: "p4",
    name: "Steam System Maintenance",
    description: "Annual maintenance and inspection of the steam distribution system.",
    status: "Completed",
    startDate: "2025-10-01",
    endDate: "2026-01-31",
    budgetProjected: 95000,
    budgetActual: 88000,
    teamIds: ["u4", "u5"],
  },
];

export const mockTasks: Task[] = [
  { id: "t1", projectId: "p1", title: "Site survey and assessment", description: "Complete initial site survey", status: "Done", priority: "High", assigneeId: "u3", dueDate: "2026-02-01", startDate: "2026-01-15" },
  { id: "t2", projectId: "p1", title: "Procurement of materials", description: "Order all required piping materials", status: "In Progress", priority: "High", assigneeId: "u2", dueDate: "2026-02-28", startDate: "2026-01-20" },
  { id: "t3", projectId: "p1", title: "Valve replacement - Section A", description: "Replace all valves in section A", status: "To Do", priority: "Medium", assigneeId: "u4", dueDate: "2026-03-15", startDate: "2026-03-01" },
  { id: "t4", projectId: "p1", title: "Pressure testing", description: "Conduct pressure testing on new installations", status: "To Do", priority: "High", assigneeId: "u3", dueDate: "2026-04-15", startDate: "2026-04-01" },
  { id: "t5", projectId: "p2", title: "Design review", description: "Review and approve piping design drawings", status: "In Progress", priority: "High", assigneeId: "u6", dueDate: "2026-02-20", startDate: "2026-02-01" },
  { id: "t6", projectId: "p2", title: "Permit applications", description: "Submit all required permits", status: "To Do", priority: "Medium", assigneeId: "u5", dueDate: "2026-03-01", startDate: "2026-02-15" },
  { id: "t7", projectId: "p3", title: "Trench excavation - Phase 1", description: "Complete excavation for main trunk line", status: "Done", priority: "High", assigneeId: "u3", dueDate: "2026-01-15", startDate: "2025-12-01" },
  { id: "t8", projectId: "p3", title: "Pipe laying - Phase 1", description: "Install main trunk line pipes", status: "In Progress", priority: "High", assigneeId: "u6", dueDate: "2026-02-28", startDate: "2026-01-16" },
  { id: "t9", projectId: "p3", title: "Welding inspections", description: "Inspect all weld joints", status: "To Do", priority: "Medium", assigneeId: "u1", dueDate: "2026-03-15", startDate: "2026-03-01" },
  { id: "t10", projectId: "p4", title: "Final inspection report", description: "Complete and submit final report", status: "Done", priority: "Low", assigneeId: "u5", dueDate: "2026-01-31", startDate: "2026-01-20" },
];

export const mockBudgetCategories: BudgetCategory[] = [
  { id: "b1", projectId: "p1", name: "Materials", projected: 180000, actual: 92000 },
  { id: "b2", projectId: "p1", name: "Labor", projected: 150000, actual: 58000 },
  { id: "b3", projectId: "p1", name: "Transportation", projected: 45000, actual: 18500 },
  { id: "b4", projectId: "p1", name: "Equipment Rental", projected: 35000, actual: 12000 },
  { id: "b5", projectId: "p1", name: "Insurance", projected: 20000, actual: 5000 },
  { id: "b6", projectId: "p1", name: "Consumables", projected: 20000, actual: 2000 },
  { id: "b7", projectId: "p3", name: "Materials", projected: 300000, actual: 195000 },
  { id: "b8", projectId: "p3", name: "Labor", projected: 200000, actual: 120000 },
  { id: "b9", projectId: "p3", name: "Transportation", projected: 80000, actual: 52000 },
  { id: "b10", projectId: "p3", name: "Equipment Rental", projected: 60000, actual: 30000 },
  { id: "b11", projectId: "p3", name: "Insurance", projected: 25000, actual: 10000 },
  { id: "b12", projectId: "p3", name: "Consumables", projected: 15000, actual: 5000 },
];

export const recentActivities = [
  { id: "a1", user: "Jordan Chen", action: "updated task", target: "Procurement of materials", project: "Refinery Pipeline Upgrade", time: "2 hours ago" },
  { id: "a2", user: "Sam Patel", action: "completed", target: "Site survey and assessment", project: "Refinery Pipeline Upgrade", time: "5 hours ago" },
  { id: "a3", user: "Taylor Kim", action: "started", target: "Design review", project: "Water Treatment Plant Piping", time: "1 day ago" },
  { id: "a4", user: "Casey Brooks", action: "uploaded", target: "Inspection Report Q4", project: "Steam System Maintenance", time: "1 day ago" },
  { id: "a5", user: "Morgan Lee", action: "commented on", target: "Valve replacement - Section A", project: "Refinery Pipeline Upgrade", time: "2 days ago" },
];
