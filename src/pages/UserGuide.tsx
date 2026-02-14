import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, FolderKanban, ListTodo, DollarSign,
  CalendarRange, Users, FileText, Settings, LogOut, HardHat,
  Plus, Pencil, Trash2, Search, Filter, Eye, Download, Upload,
} from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "Getting Started",
    icon: HardHat,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p><strong className="text-foreground">PipeFlow</strong> is a construction and project management platform that helps teams plan, track, and deliver projects on time and within budget.</p>
        <p>After signing up and logging in, you'll land on the <strong className="text-foreground">Dashboard</strong> — your central hub showing project stats, recent activity, and key metrics at a glance.</p>
        <p>Use the <strong className="text-foreground">sidebar</strong> on the left (or the hamburger menu on mobile) to navigate between sections.</p>
      </div>
    ),
  },
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>The Dashboard provides an at-a-glance overview of your workspace:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Summary Cards</strong> — Total projects, active tasks, team members, and budget utilization.</li>
          <li><strong className="text-foreground">Charts</strong> — Visual breakdowns of budget allocation and task status distribution.</li>
          <li><strong className="text-foreground">Recent Activity</strong> — A feed of the latest updates across all projects.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "projects",
    title: "Projects",
    icon: FolderKanban,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Manage all your construction projects in one place.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Create a Project</strong> — Click <Badge variant="secondary" className="text-xs"><Plus className="h-3 w-3 mr-1 inline" />New Project</Badge> and fill in the name, description, status, and budget.</li>
          <li><strong className="text-foreground">Edit / Delete</strong> — Use the <Pencil className="h-3 w-3 inline" /> and <Trash2 className="h-3 w-3 inline" /> options in the project card's menu.</li>
          <li><strong className="text-foreground">Manage Members</strong> — Click <Users className="h-3 w-3 inline" /> Members to assign team members to a project.</li>
          <li><strong className="text-foreground">Search</strong> — Use the search bar to filter projects by name.</li>
          <li><strong className="text-foreground">Budget Progress</strong> — Each card shows a progress bar comparing actual vs. projected spend.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "tasks",
    title: "Tasks",
    icon: ListTodo,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Track work items across all projects with two flexible views:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Kanban Board</strong> — Drag-and-drop cards across columns: <Badge variant="outline" className="text-[10px]">To Do</Badge> <Badge variant="outline" className="text-[10px]">In Progress</Badge> <Badge variant="outline" className="text-[10px]">Review</Badge> <Badge variant="outline" className="text-[10px]">Done</Badge></li>
          <li><strong className="text-foreground">List View</strong> — A table-style view for quick scanning and bulk actions.</li>
          <li><strong className="text-foreground">Create a Task</strong> — Click <Badge variant="secondary" className="text-xs"><Plus className="h-3 w-3 mr-1 inline" />New Task</Badge>, then set the title, project, assignee, priority, and due date.</li>
          <li><strong className="text-foreground">Filter & Search</strong> — Filter tasks by project, status, or priority using the toolbar.</li>
          <li><strong className="text-foreground">Change Status</strong> — Click the status badge on any task to update it inline.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "budget",
    title: "Budget",
    icon: DollarSign,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Monitor financial health across all projects.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Project Selector</strong> — Choose a project from the dropdown to see its budget breakdown.</li>
          <li><strong className="text-foreground">Summary Cards</strong> — View projected budget, actual spend, remaining balance, and utilization percentage.</li>
          <li><strong className="text-foreground">Budget Categories</strong> — Add categories (e.g., Materials, Labor) with projected and actual amounts.</li>
          <li><strong className="text-foreground">Charts</strong> — Bar and pie charts visualize spending by category.</li>
          <li><strong className="text-foreground">Add / Edit Categories</strong> — Use the <Plus className="h-3 w-3 inline" /> button or click a category to edit its values.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "timeline",
    title: "Timeline",
    icon: CalendarRange,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Visualize project schedules and milestones.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Gantt-style View</strong> — See all projects and their tasks laid out across a timeline.</li>
          <li><strong className="text-foreground">Date Ranges</strong> — Each bar represents the start and end dates of a task or project.</li>
          <li><strong className="text-foreground">Status Indicators</strong> — Color-coded bars show whether items are on track, delayed, or completed.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "team",
    title: "Team",
    icon: Users,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>View and manage your workspace members.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Member List</strong> — See all team members with their roles, email, and assigned projects.</li>
          <li><strong className="text-foreground">Roles</strong> — Members can be Admins, Project Managers, or regular Members.</li>
          <li><strong className="text-foreground">Project Assignments</strong> — Assign members to specific projects from the Projects page.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "documents",
    title: "Documents",
    icon: FileText,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Store and organize project-related files.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Upload</strong> — Click <Badge variant="secondary" className="text-xs"><Upload className="h-3 w-3 mr-1 inline" />Upload</Badge> to add a new document and assign it to a project and category.</li>
          <li><strong className="text-foreground">Categories</strong> — Organize files as Drawings, Reports, or Permits.</li>
          <li><strong className="text-foreground">Actions</strong> — <Eye className="h-3 w-3 inline" /> Preview, <Download className="h-3 w-3 inline" /> Download, or <Trash2 className="h-3 w-3 inline" /> Delete documents.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "settings",
    title: "Settings & Account",
    icon: Settings,
    content: (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>Manage your profile and preferences.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong className="text-foreground">Profile</strong> — Update your display name from the Settings page.</li>
          <li><strong className="text-foreground">Access Settings</strong> — Click your avatar in the sidebar footer or navigate to the Settings page.</li>
          <li><strong className="text-foreground">Sign Out</strong> — Click <LogOut className="h-3 w-3 inline" /> Sign Out in the sidebar to securely log out.</li>
        </ul>
      </div>
    ),
  },
];

export default function UserGuide() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">User Guide</h1>
        <p className="text-muted-foreground mt-1">Everything you need to know about using PipeFlow.</p>
      </div>

      <Accordion type="multiple" defaultValue={["overview"]} className="space-y-3">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-1">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <section.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-heading font-semibold">{section.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {section.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card>
        <CardHeader><CardTitle className="text-base">Need Help?</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you have questions or run into issues, reach out to your workspace administrator or contact support.
        </CardContent>
      </Card>
    </div>
  );
}
