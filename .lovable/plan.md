
# Piping Project Management Portal

## Overview
A visual, modern project management portal for piping projects, supporting a team of 5+ members with role-based access (Admin, Manager, Member). The Excel budget data will be imported as initial seed data, and all project management will happen within the portal going forward.

---

## 1. Authentication & Role-Based Access
- **Login/signup** with email and password
- **Three roles**: Admin, Project Manager, Team Member
- Admins can manage users, roles, and all projects
- Project Managers can create/edit projects and assign tasks
- Team Members can view assigned projects and update their tasks
- User profiles with name, role, and avatar

## 2. Dashboard (Home)
- Visual overview with summary cards: total projects, active tasks, budget health, team members
- Charts showing budget utilization across projects (projected vs. actual)
- Recent activity feed
- Quick-access links to active projects

## 3. Multi-Project Management
- Create, edit, and archive multiple piping projects
- Each project has its own budget, team, tasks, timeline, and documents
- Project status indicators (Planning, In Progress, Completed, On Hold)
- Project list view with filtering and search

## 4. Budget Tracker (from Excel data)
- Import the Excel budget structure as the initial template for new projects
- Budget categories matching your spreadsheet: Consumables, Transportation, Food, Insurance, Personal Care, Entertainment, etc.
- **Projected vs. Actual cost** tracking per category with automatic difference calculation
- Income tracking (projected and actual)
- Visual budget summary with charts (bar charts for category comparison, donut chart for expense breakdown)
- Budget health indicator showing projected vs. actual balance

## 5. Task Management
- Create tasks within each project
- Assign tasks to team members
- Task statuses: To Do, In Progress, Done
- Priority levels and due dates
- Task list and board (Kanban) views

## 6. Timeline / Gantt Chart
- Visual project timeline showing milestones and task durations
- Drag-and-drop to adjust dates
- Color-coded by status or assignee

## 7. Team & Workforce Tracking
- Add team members to projects
- View member assignments and workload across projects
- Contact details and role information

## 8. Document Management
- Upload and organize project documents per project
- File categories (drawings, permits, reports, etc.)
- Preview and download files

## 9. Backend (Lovable Cloud with Supabase)
- Database for projects, budgets, tasks, team members, documents
- Role-based Row Level Security policies
- File storage for document uploads
- User authentication and profile management

---

## Implementation Approach
We'll start with authentication and the core dashboard, then build out the budget tracker (seeded from your Excel data), followed by task management, timeline, team tracking, and document management — each as incremental steps.
