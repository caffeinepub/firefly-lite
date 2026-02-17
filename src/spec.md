# Specification

## Summary
**Goal:** Add a Budgets module that supports monthly per-category budget limits and rollover-aware budget summaries.

**Planned changes:**
- Add a Budgets data model to the Motoko backend, stored per authenticated caller (Principal), keyed by month (year, month) and category, with data needed to support rollover between months.
- Implement backend APIs to upsert/delete budget limits, list budget limits for a selected month, and compute per-category monthly budget summaries (limit, spent, remaining, carryover) using existing transactions/categories and only counting expense categories.
- If needed, update upgrade/migration handling so existing user data remains intact while initializing Budgets state safely on upgrade.
- Add frontend React Query hooks for budgets queries and mutations, including cache invalidation/refetch after updates.
- Create a new Budgets screen with month navigation, per-category limit editing, and a per-category status view (spent/remaining/carryover), including clear empty states.
- Add “Budgets” to the main navigation and route it to the new Budgets page with active-route styling.

**User-visible outcome:** Users can navigate to a Budgets page, choose a month, set monthly budget limits per expense category, and see per-category budget status (spent, remaining, and carryover/rollover) for that month.
