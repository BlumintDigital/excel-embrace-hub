

# Connect PipeFlow to Supabase Backend

## Overview
Set up Supabase as the backend for PipeFlow, replacing mock data with a real database, authentication, and role-based access control.

---

## Step 1: Enable Supabase
- Connect the project to Supabase (Lovable Cloud) to provision a database, auth, and storage.

## Step 2: Database Schema
Create the following tables via migrations:

### Roles System
- **app_role enum**: `admin`, `project_manager`, `team_member`
- **user_roles table**: Links `auth.users` to roles (separate from profiles to prevent privilege escalation)
- **has_role() function**: Security definer function for safe RLS checks

### Profiles Table
- `id` (UUID, references auth.users)
- `full_name`, `avatar_url`, `email`
- Auto-created via trigger on user signup

### Projects Table
- `id`, `name`, `description`, `status` (enum: Planning, In Progress, Completed, On Hold)
- `start_date`, `end_date`, `budget_projected`, `budget_actual`
- `created_by` (references auth.users)

### Project Members Table
- Links users to projects with their role on that project

### Tasks Table
- `id`, `project_id`, `title`, `description`, `status`, `priority`
- `assignee_id`, `due_date`, `start_date`

### Budget Categories Table
- `id`, `project_id`, `name`, `projected`, `actual`

### Documents Table
- `id`, `project_id`, `name`, `file_path`, `category`, `uploaded_by`

## Step 3: Row-Level Security (RLS)
- All tables have RLS enabled
- Admins can read/write everything (via `has_role()` function)
- Project Managers can manage projects they belong to
- Team Members can view their assigned projects and update their own tasks
- Profiles: users can read all profiles, update only their own

## Step 4: Storage
- Create a `documents` storage bucket for project file uploads
- RLS policies so only project members can upload/download files

## Step 5: Seed Budget Data
- Insert your Excel budget categories (Consumables, Transportation, Food, Insurance, Personal Care, Entertainment) as the initial budget template data

## Step 6: Frontend Integration
- **Auth context**: Create an `AuthProvider` wrapping the app with `onAuthStateChange` listener
- **Protected routes**: Redirect unauthenticated users to `/login`
- **Login/Signup pages**: Wire up to Supabase Auth (email + password)
- **Replace mock data**: Swap all `mockUsers`, `mockProjects`, etc. with Supabase queries using TanStack Query
- **Role-based UI**: Show/hide admin features based on user role

## Step 7: Auto-assign First User as Admin
- Create a trigger so the first user who signs up gets the `admin` role automatically

---

## Technical Details

### Database Trigger for Profile Creation
```text
On auth.users INSERT -> create profiles row with id, email, full_name from metadata
```

### Auth Flow
```text
Signup -> creates auth.users row -> trigger creates profile -> trigger assigns role
Login -> onAuthStateChange fires -> fetch profile + role -> set context
```

### Migration Order
1. Enums and helper functions
2. Profiles table + trigger
3. User roles table + has_role function + trigger
4. Projects, project_members, tasks, budget_categories, documents tables
5. RLS policies for all tables
6. Storage bucket + policies
7. Seed budget data

