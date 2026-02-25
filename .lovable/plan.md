

## Mobile Optimization Plan

### Problems Identified

1. **Stretched logo in mobile top bar** (AppSidebar.tsx line 201): The logo has `flex-1` which stretches it across the available space instead of maintaining its natural size.

2. **Build error** (tsconfig.app.json): Dexie `.d.ts` namespace error -- `skipLibCheck: true` is already set but the build still fails, likely needs to be applied differently.

3. **PageHeader action bar overflow on mobile**: Pages like Tasks, Documents, Team, Activity Log, and Budget pack multiple controls (search input + select dropdown + tabs + button) into the header action area. On mobile these wrap awkwardly or overflow because they use `flex-wrap` at full width inside a `justify-between` container.

4. **Dashboard charts section filter row**: The project filter `Select` has a fixed `w-48` that may overflow on narrow screens.

5. **Documents table not scrollable on mobile**: The documents table has no `overflow-x-auto` wrapper, so columns get squished or cut off.

6. **Task board columns**: The 3-column board grid (`md:grid-cols-3`) stacks on mobile but the board view isn't ideal -- the columns are full width vertically which is fine, but padding could be tighter.

7. **Activity Log cards**: Badge + timestamp row can overflow on small screens. Timestamp is hidden on mobile (`hidden sm:inline`) which is good, but the badge text can still be long.

### Changes

**File 1: `src/components/layout/AppSidebar.tsx`**
- Line 201: Remove `flex-1` from the mobile top bar logo image and add `object-contain` with a max width so it doesn't stretch. Change to: `className="h-5 ml-2 object-contain max-w-[120px]"`

**File 2: `src/components/layout/PageHeader.tsx`**
- Make the header stack vertically on mobile when there's an action bar. On small screens, the title and action should be in a column layout so controls don't get cramped. Change the outer div from `flex items-start justify-between gap-4` to `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4`.
- This gives all action bars (Tasks, Documents, Team, Activity Log, Budget) room to breathe on mobile without editing each page individually.

**File 3: `src/pages/Dashboard.tsx`**
- Line 101: Reduce padding on mobile: `p-4 sm:p-6`
- Line 234: Make project filter select responsive: `w-full sm:w-48`
- Line 223-244: Stack the filter row vertically on mobile: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`

**File 4: `src/pages/Tasks.tsx`**
- Line 85: Reduce padding on mobile: `p-4 sm:p-6`
- Line 95: Make search input full width on mobile: `w-full sm:w-40`
- Line 102: Make project select full width on mobile: `w-full sm:w-48`

**File 5: `src/pages/Documents.tsx`**
- Line 53: Reduce padding on mobile: `p-4 sm:p-6`
- Line 62-63: Make search and select inputs responsive: `w-full sm:w-44` and `w-full sm:w-48`
- Line 101: Add `overflow-x-auto` wrapper around the table (already partly there but needs the table wrapped properly)

**File 6: `src/pages/Clients.tsx`**
- Line 44: Reduce padding on mobile: `p-4 sm:p-6 lg:p-8`

**File 7: `src/pages/Team.tsx`**
- Line 46: Reduce padding on mobile: `p-4 sm:p-6`
- Line 56: Make search input responsive: `w-full sm:w-44`

**File 8: `src/pages/Budget.tsx`**
- Line 79: Already has responsive padding `p-6 lg:p-8`, change to `p-4 sm:p-6 lg:p-8`

**File 9: `src/pages/ActivityLog.tsx`**
- Line 96: Reduce padding: `p-4 sm:p-6 lg:p-8`
- Line 106: Make search responsive: `w-full sm:w-44`
- Line 114: Make month select responsive: `w-full sm:w-44`

**File 10: `src/pages/Timeline.tsx`**
- Line 79: Reduce padding: `p-4 sm:p-6 lg:p-8`
- Line 85: Make select responsive: `w-full sm:w-52`

**File 11: `src/pages/SettingsPage.tsx`**
- Line 150: Reduce padding: `p-4 sm:p-6 lg:p-8`

**File 12: `src/pages/Projects.tsx`**
- Line 44: Reduce padding: `p-4 sm:p-6`

**File 13: `tsconfig.app.json`**
- Verify `skipLibCheck: true` is set (already confirmed it is -- the build error should resolve with this in place; if not, will exclude `node_modules` from include paths)

### Summary
The core pattern is: (1) fix the stretched logo, (2) make `PageHeader` stack vertically on mobile so action bars don't overflow, (3) reduce page padding on mobile from `p-6` to `p-4 sm:p-6`, (4) make fixed-width inputs/selects use `w-full sm:w-XX` for full-width on mobile. No new dependencies needed.

