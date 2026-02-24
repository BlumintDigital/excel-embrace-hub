

## Replace Native Date Inputs with Modern Calendar Popover

Currently, date fields across the app use plain `<Input type="date" />` which renders the browser's default date picker -- inconsistent across browsers and not visually aligned with the app's design system.

### What Changes

Replace all `type="date"` inputs with a modern **Popover + Calendar** date picker using the existing Shadcn Calendar component. This affects **3 date fields** across **2 dialogs**:

1. **TaskDialog.tsx** -- "Due Date" field
2. **ProjectDialog.tsx** -- "Start Date" and "End Date" fields

### How It Will Look

Each date field becomes a styled button that shows the selected date (e.g. "Jan 15, 2026") or placeholder text ("Pick a date"). Clicking it opens a dropdown calendar where users can navigate months and click a day to select it.

### Technical Details

**Files to modify:**

1. **`src/components/ui/calendar.tsx`**
   - Add `pointer-events-auto` to the root className so the calendar works inside dialogs/popovers

2. **`src/components/dialogs/TaskDialog.tsx`**
   - Import `Calendar`, `Popover`, `PopoverTrigger`, `PopoverContent`, `CalendarIcon`, `format` from date-fns, and `cn`
   - Replace `<Input type="date">` with a Popover-based calendar picker
   - Convert the `dueDate` string state to/from `Date` objects for the Calendar component (store continues as ISO string for the API)

3. **`src/components/dialogs/ProjectDialog.tsx`**
   - Same imports as above
   - Replace both Start Date and End Date `<Input type="date">` fields with Popover calendar pickers
   - Maintain the grid layout for the two date fields side by side

4. **`tsconfig.app.json`**
   - Add `"skipLibCheck": true` to fix the unrelated Dexie type error in the build

**No new dependencies needed** -- `date-fns`, `react-day-picker`, Popover, and Calendar are all already installed.
