import {
  LayoutDashboard, FolderKanban, ListTodo, DollarSign,
  CalendarRange, Users, FileText, Settings, HardHat,
} from "lucide-react";

export interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export function UserGuideSections(appName: string): Section[] {
  return [
    {
      id: "overview",
      title: "Getting Started",
      icon: HardHat,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p><strong className="text-foreground print:text-black">{appName}</strong> is a construction and project management platform that helps teams plan, track, and deliver projects on time and within budget.</p>
          <p>After signing up and logging in, you'll land on the <strong className="text-foreground print:text-black">Dashboard</strong> — your central hub showing project stats, recent activity, and key metrics at a glance.</p>
          <p>Use the <strong className="text-foreground print:text-black">sidebar</strong> on the left (or the hamburger menu on mobile) to navigate between sections.</p>
        </div>
      ),
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>The Dashboard provides an at-a-glance overview of your workspace:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Summary Cards</strong> — Total projects, active tasks, team members, and budget utilization.</li>
            <li><strong className="text-foreground print:text-black">Charts</strong> — Visual breakdowns of budget allocation and task status distribution.</li>
            <li><strong className="text-foreground print:text-black">Recent Activity</strong> — A feed of the latest updates across all projects.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "projects",
      title: "Projects",
      icon: FolderKanban,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>Manage all your construction projects in one place.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Create a Project</strong> — Click "New Project" and fill in the name, description, status, and budget.</li>
            <li><strong className="text-foreground print:text-black">Edit / Delete</strong> — Use the edit and delete options in the project card's menu.</li>
            <li><strong className="text-foreground print:text-black">Manage Members</strong> — Click "Members" to assign team members to a project.</li>
            <li><strong className="text-foreground print:text-black">Search</strong> — Use the search bar to filter projects by name.</li>
            <li><strong className="text-foreground print:text-black">Budget Progress</strong> — Each card shows a progress bar comparing actual vs. projected spend.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "tasks",
      title: "Tasks",
      icon: ListTodo,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>Track work items across all projects with two flexible views:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Kanban Board</strong> — Drag-and-drop cards across columns: To Do, In Progress, Review, Done.</li>
            <li><strong className="text-foreground print:text-black">List View</strong> — A table-style view for quick scanning and bulk actions.</li>
            <li><strong className="text-foreground print:text-black">Create a Task</strong> — Click "New Task", then set the title, project, assignee, priority, and due date.</li>
            <li><strong className="text-foreground print:text-black">Filter & Search</strong> — Filter tasks by project, status, or priority using the toolbar.</li>
            <li><strong className="text-foreground print:text-black">Change Status</strong> — Click the status badge on any task to update it inline.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "budget",
      title: "Budget",
      icon: DollarSign,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>Monitor financial health across all projects.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Project Selector</strong> — Choose a project from the dropdown to see its budget breakdown.</li>
            <li><strong className="text-foreground print:text-black">Summary Cards</strong> — View projected budget, actual spend, remaining balance, and utilization percentage.</li>
            <li><strong className="text-foreground print:text-black">Budget Categories</strong> — Add categories (e.g., Materials, Labor) with projected and actual amounts.</li>
            <li><strong className="text-foreground print:text-black">Charts</strong> — Bar and pie charts visualize spending by category.</li>
            <li><strong className="text-foreground print:text-black">Add / Edit Categories</strong> — Use the "+" button or click a category to edit its values.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "timeline",
      title: "Timeline",
      icon: CalendarRange,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>Visualize project schedules and milestones.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Gantt-style View</strong> — See all projects and their tasks laid out across a timeline.</li>
            <li><strong className="text-foreground print:text-black">Date Ranges</strong> — Each bar represents the start and end dates of a task or project.</li>
            <li><strong className="text-foreground print:text-black">Status Indicators</strong> — Color-coded bars show whether items are on track, delayed, or completed.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "team",
      title: "Team",
      icon: Users,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>View and manage your workspace members.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Member List</strong> — See all team members with their roles, email, and assigned projects.</li>
            <li><strong className="text-foreground print:text-black">Roles</strong> — Members can be Admins, Project Managers, or regular Members.</li>
            <li><strong className="text-foreground print:text-black">Project Assignments</strong> — Assign members to specific projects from the Projects page.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "documents",
      title: "Documents",
      icon: FileText,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>Store and organize project-related files.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Upload</strong> — Click "Upload" to add a new document and assign it to a project and category.</li>
            <li><strong className="text-foreground print:text-black">Categories</strong> — Organize files as Drawings, Reports, or Permits.</li>
            <li><strong className="text-foreground print:text-black">Actions</strong> — Preview, Download, or Delete documents using the action buttons.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "settings",
      title: "Settings & Account",
      icon: Settings,
      content: (
        <div className="space-y-3 text-sm text-muted-foreground print:text-black">
          <p>Manage your profile and preferences.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-foreground print:text-black">Profile</strong> — Update your display name from the Settings page.</li>
            <li><strong className="text-foreground print:text-black">Access Settings</strong> — Click your avatar in the sidebar footer or navigate to the Settings page.</li>
            <li><strong className="text-foreground print:text-black">Sign Out</strong> — Click Sign Out in the sidebar to securely log out.</li>
          </ul>
        </div>
      ),
    },
  ];
}

export function getPlainSections(appName: string): Record<string, string> {
  return {
    overview: `
      <p><strong>${appName}</strong> is a construction and project management platform that helps teams plan, track, and deliver projects on time and within budget.</p>
      <p>After signing up and logging in, you'll land on the <strong>Dashboard</strong> — your central hub showing project stats, recent activity, and key metrics at a glance.</p>
      <p>Use the <strong>sidebar</strong> on the left (or the hamburger menu on mobile) to navigate between sections.</p>
    `,
    dashboard: `
      <p>The Dashboard provides an at-a-glance overview of your workspace:</p>
      <ul>
        <li><strong>Summary Cards</strong> — Total projects, active tasks, team members, and budget utilization.</li>
        <li><strong>Charts</strong> — Visual breakdowns of budget allocation and task status distribution.</li>
        <li><strong>Recent Activity</strong> — A feed of the latest updates across all projects.</li>
      </ul>
    `,
    projects: `
      <p>Manage all your construction projects in one place.</p>
      <ul>
        <li><strong>Create a Project</strong> — Click "New Project" and fill in the name, description, status, and budget.</li>
        <li><strong>Edit / Delete</strong> — Use the edit and delete options in the project card's menu.</li>
        <li><strong>Manage Members</strong> — Click "Members" to assign team members to a project.</li>
        <li><strong>Search</strong> — Use the search bar to filter projects by name.</li>
        <li><strong>Budget Progress</strong> — Each card shows a progress bar comparing actual vs. projected spend.</li>
      </ul>
    `,
    tasks: `
      <p>Track work items across all projects with two flexible views:</p>
      <ul>
        <li><strong>Kanban Board</strong> — Drag-and-drop cards across columns: To Do, In Progress, Review, Done.</li>
        <li><strong>List View</strong> — A table-style view for quick scanning and bulk actions.</li>
        <li><strong>Create a Task</strong> — Click "New Task", then set the title, project, assignee, priority, and due date.</li>
        <li><strong>Filter & Search</strong> — Filter tasks by project, status, or priority using the toolbar.</li>
        <li><strong>Change Status</strong> — Click the status badge on any task to update it inline.</li>
      </ul>
    `,
    budget: `
      <p>Monitor financial health across all projects.</p>
      <ul>
        <li><strong>Project Selector</strong> — Choose a project from the dropdown to see its budget breakdown.</li>
        <li><strong>Summary Cards</strong> — View projected budget, actual spend, remaining balance, and utilization percentage.</li>
        <li><strong>Budget Categories</strong> — Add categories (e.g., Materials, Labor) with projected and actual amounts.</li>
        <li><strong>Charts</strong> — Bar and pie charts visualize spending by category.</li>
        <li><strong>Add / Edit Categories</strong> — Use the "+" button or click a category to edit its values.</li>
      </ul>
    `,
    timeline: `
      <p>Visualize project schedules and milestones.</p>
      <ul>
        <li><strong>Gantt-style View</strong> — See all projects and their tasks laid out across a timeline.</li>
        <li><strong>Date Ranges</strong> — Each bar represents the start and end dates of a task or project.</li>
        <li><strong>Status Indicators</strong> — Color-coded bars show whether items are on track, delayed, or completed.</li>
      </ul>
    `,
    team: `
      <p>View and manage your workspace members.</p>
      <ul>
        <li><strong>Member List</strong> — See all team members with their roles, email, and assigned projects.</li>
        <li><strong>Roles</strong> — Members can be Admins, Project Managers, or regular Members.</li>
        <li><strong>Project Assignments</strong> — Assign members to specific projects from the Projects page.</li>
      </ul>
    `,
    documents: `
      <p>Store and organize project-related files.</p>
      <ul>
        <li><strong>Upload</strong> — Click "Upload" to add a new document and assign it to a project and category.</li>
        <li><strong>Categories</strong> — Organize files as Drawings, Reports, or Permits.</li>
        <li><strong>Actions</strong> — Preview, Download, or Delete documents using the action buttons.</li>
      </ul>
    `,
    settings: `
      <p>Manage your profile and preferences.</p>
      <ul>
        <li><strong>Profile</strong> — Update your display name from the Settings page.</li>
        <li><strong>Access Settings</strong> — Click your avatar in the sidebar footer or navigate to the Settings page.</li>
        <li><strong>Sign Out</strong> — Click Sign Out in the sidebar to securely log out.</li>
      </ul>
    `,
  };
}
