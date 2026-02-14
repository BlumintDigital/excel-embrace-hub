import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, FolderKanban, ListTodo, DollarSign,
  CalendarRange, Users, FileText, Settings, LogOut, HardHat,
  Plus, Pencil, Trash2, Eye, Download, Upload,
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "overview",
    title: "Getting Started",
    icon: HardHat,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground print:text-black">
        <p><strong className="text-foreground print:text-black">PipeFlow</strong> is a construction and project management platform that helps teams plan, track, and deliver projects on time and within budget.</p>
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

export default function UserGuide() {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = sections.map((s) => `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px;">${s.title}</h2>
        <div id="section-${s.id}"></div>
      </div>
    `).join("");

    const plainSections: Record<string, string> = {
      overview: `
        <p><strong>PipeFlow</strong> is a construction and project management platform that helps teams plan, track, and deliver projects on time and within budget.</p>
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

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>PipeFlow User Guide</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; padding: 40px; line-height: 1.6; }
          h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
          h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #1a1a1a; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
          p { font-size: 14px; color: #333; margin-bottom: 8px; }
          ul { padding-left: 20px; margin-bottom: 8px; }
          li { font-size: 14px; color: #333; margin-bottom: 4px; }
          strong { color: #000; }
          .section { margin-bottom: 28px; page-break-inside: avoid; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>PipeFlow User Guide</h1>
        <p class="subtitle">Everything you need to know about using PipeFlow — Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        ${sections.map((s) => `<div class="section"><h2>${s.title}</h2>${plainSections[s.id] || ""}</div>`).join("")}
        <div class="footer">PipeFlow Project Manager • User Guide • ${new Date().getFullYear()}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">User Guide</h1>
          <p className="text-muted-foreground mt-1">Everything you need to know about using PipeFlow.</p>
        </div>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-3 text-base">
                <section.icon className="h-5 w-5 text-primary shrink-0" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>{section.content}</CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Need Help?</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you have questions or run into issues, reach out to your workspace administrator or contact support.
        </CardContent>
      </Card>
    </div>
  );
}
