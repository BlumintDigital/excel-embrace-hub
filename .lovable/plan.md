

## Fix Mobile Card Overlapping on Dashboard

### Problems Identified

From the screenshots, there are several overlapping/overflow issues on mobile:

1. **Budget chart card header**: The title ("Budget by Project (NGN)") and the legend (Projected/Actual dots) are in a `flex-row` layout that gets cramped on mobile, causing overlap.

2. **Bar chart Y-axis too wide**: The `YAxis width={80}` takes up too much horizontal space on mobile (375px screens), leaving too little room for the actual bars and X-axis labels.

3. **Mobile top bar height mismatch**: The top bar is `h-12` (48px) but the main content offset is `pt-14` (56px). This is a minor 8px gap, not causing overlap but should be consistent — either make the bar `h-14` or the padding `pt-12`.

4. **Stat cards grid**: The 4-column grid uses `sm:grid-cols-2 lg:grid-cols-4`. The budget card (4th card) in the "all projects" view lists multiple project progress bars — this card's content can get tall and look uneven next to the shorter stat cards. Not a critical overlap but worth noting.

### Changes

**File 1: `src/pages/Dashboard.tsx`**

- **Line 256** — Budget chart `CardHeader`: Change from `flex-row items-center justify-between` to `flex-col sm:flex-row sm:items-center sm:justify-between gap-1` so the title and legend stack vertically on mobile instead of overlapping.

- **Line 281** — `YAxis width`: Reduce from `width={80}` to `width={55}` and use a compact tick formatter that abbreviates large numbers (e.g., "12M" instead of "12,000,000") so charts fit better on mobile.

- **Line 280** — `XAxis`: Add `tick={{ fontSize: 10 }}` and `interval={0}` with `angle={-30}` or use `textAnchor="end"` so long project names don't overlap on mobile. Alternatively, keep `fontSize: 11` but let Recharts auto-hide overlapping labels (which is the default behavior).

**File 2: `src/components/layout/AppSidebar.tsx`**

- **Line 197** — Change the mobile top bar from `h-12` to `h-14` to match the `pt-14` offset in AppLayout, ensuring consistent spacing.

**File 3: `src/components/layout/AppLayout.tsx`**

- No change needed — `pt-14` is already correct once we fix the top bar to `h-14`.

### Technical Details

The main fix is making the budget chart card header responsive. Currently:
```
<CardHeader className="flex-row items-center justify-between pb-2">
```
This forces a single-row layout that doesn't have room on 375px screens. Changing to:
```
<CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2">
```
This stacks the title above the legend on mobile.

For the Y-axis, using a compact formatter like:
```typescript
tickFormatter={(v) => {
  const num = v as number;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}}
```
This reduces the Y-axis width from ~80px to ~55px, giving the chart bars more breathing room on small screens.

