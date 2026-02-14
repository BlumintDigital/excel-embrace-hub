

# Supabase Backend Integration: Auth, Protected Routes, and Database Schema

## Overview
This plan covers three things: (1) SQL migration scripts for your Supabase database, (2) an AuthProvider with protected routes, and (3) wiring Login/Signup to Supabase Auth.

---

## Part 1: SQL Migration Scripts

You'll run these in your Supabase Dashboard under **SQL Editor**. The scripts create all the tables, enums, functions, triggers, and RLS policies.

### Migration 1: Enums and Helper Functions
- Create `app_role` enum: `admin`, `project_manager`, `team_member`
- Create `project_status` enum: `Planning`, `In Progress`, `Completed`, `On Hold`
- Create `task_status` enum: `To Do`, `In Progress`, `Done`
- Create `task_priority` enum: `Low`, `Medium`, `High`

### Migration 2: Profiles Table
- `id` (UUID, PK, references `auth.users` with ON DELETE CASCADE)
- `full_name` (text), `email` (text), `avatar_url` (text)
- `created_at`, `updated_at` timestamps
- Database trigger: on `auth.users` INSERT, auto-create a profile row using `raw_user_meta_data`
- RLS: all authenticated users can read profiles; users can only update their own

### Migration 3: User Roles Table
- `id` (UUID, PK), `user_id` (references `auth.users`), `role` (app_role)
- Unique constraint on (user_id, role)
- `has_role()` security definer function for safe RLS checks
- Trigger: first user to sign up gets `admin` role automatically
- RLS: users can read their own roles; admins can manage all roles

### Migration 4: Core Data Tables
- **projects**: id, name, description, status, start_date, end_date, budget_projected, budget_actual, created_by
- **project_members**: id, project_id, user_id, role (text like "Lead", "Member")
- **tasks**: id, project_id, title, description, status, priority, assignee_id, due_date, start_date
- **budget_categories**: id, project_id, name, projected, actual
- **documents**: id, project_id, name, file_path, category, uploaded_by, size, created_at

### Migration 5: RLS Policies
- **Projects**: Authenticated users can read projects they're a member of; admins can read/write all
- **Tasks**: Members of a project can read its tasks; assignees and admins can update; admins and project creators can insert/delete
- **Budget categories**: Same access as projects
- **Documents**: Same access as projects
- **Project members**: Admins can manage; members can read their own projects

### Migration 6: Storage Bucket
- Create a `documents` bucket (private)
- Policies: project members can upload/download; admins can manage all

---

## Part 2: AuthProvider and Protected Routes

### New files to create:
1. **`src/contexts/AuthContext.tsx`** -- React context providing:
   - `user` (Supabase user object or null)
   - `profile` (from profiles table)
   - `role` (from user_roles table)
   - `loading` (boolean)
   - `signOut()` function
   - Uses `onAuthStateChange` listener (set up BEFORE `getSession()`)
   - On auth state change, fetches profile and role from Supabase

2. **`src/components/ProtectedRoute.tsx`** -- Wrapper component that:
   - Shows a loading spinner while auth is being determined
   - Redirects to `/login` if user is not authenticated
   - Renders children (via `<Outlet />`) if authenticated

### Changes to existing files:
- **`src/App.tsx`**: Wrap everything in `<AuthProvider>`, wrap the layout routes in `<ProtectedRoute>`
- **`src/components/layout/AppSidebar.tsx`**: Replace hardcoded "Alex Rivera" / "Admin" with real profile data and role from AuthContext; add a sign-out button
- **`src/pages/SettingsPage.tsx`**: Replace `mockUsers[0]` with real profile data from AuthContext

---

## Part 3: Wire Up Login and Signup

### Changes to `src/pages/Login.tsx`:
- Import `supabase` client
- Replace mock `handleSubmit` with `supabase.auth.signInWithPassword({ email, password })`
- Show error toast on failure
- On success, navigate to `/` (AuthProvider will handle state)
- Add loading state to disable button during request

### Changes to `src/pages/Signup.tsx`:
- Import `supabase` client
- Replace mock `handleSubmit` with `supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: window.location.origin } })`
- Show success toast ("Check your email to confirm") or error toast
- Add loading state

---

## Technical Details

### AuthContext Implementation Pattern
```text
1. Create context with user/profile/role/loading state
2. useEffect: subscribe to onAuthStateChange
3. On SIGNED_IN event: fetch profile + role from Supabase
4. On SIGNED_OUT event: clear state
5. Provide signOut function that calls supabase.auth.signOut()
```

### File Changes Summary
| File | Action |
|------|--------|
| `src/contexts/AuthContext.tsx` | Create |
| `src/components/ProtectedRoute.tsx` | Create |
| `src/App.tsx` | Modify (wrap in AuthProvider, add ProtectedRoute) |
| `src/pages/Login.tsx` | Modify (wire to Supabase Auth) |
| `src/pages/Signup.tsx` | Modify (wire to Supabase Auth) |
| `src/components/layout/AppSidebar.tsx` | Modify (use real user data + sign out) |
| `src/pages/SettingsPage.tsx` | Modify (use real user data) |
| SQL migration scripts | Provided as copyable SQL blocks |

### Important Notes
- The SQL scripts will be provided as ready-to-run blocks for your Supabase SQL Editor
- The pages will continue to use mock data for projects/tasks/budget for now (replacing those with real queries is a separate step)
- Email confirmation may be enabled by default in Supabase -- you can disable it in Authentication > Settings if you want instant sign-in during development

