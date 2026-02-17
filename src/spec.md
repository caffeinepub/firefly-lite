# Specification

## Summary
**Goal:** Add a Bank Connections section where authenticated users can create/manage bank connections and manually sync transactions into the app via a built-in Mock Bank provider.

**Planned changes:**
- Backend: Add canister APIs to create/list/delete bank connections scoped to the caller Internet Identity Principal.
- Backend: Add a per-connection sync API that returns a structured result (created/ignored counts and any error) and tracks sync status (idle/in progress/last synced/last error).
- Backend: Implement a built-in “Mock Bank” provider that simulates downloading transaction history and imports transactions while avoiding unbounded duplicates across repeated syncs.
- Frontend: Add navigation + routing for a new Bank Connections screen, gated behind existing authentication rules.
- Frontend: Build the Bank Connections UI to list connections, add/remove a connection, and run “Sync now” with clear English success/error feedback and disabled state while syncing.
- Frontend: Add React Query hooks for bank connections (list/create/delete/sync) and invalidate/refetch Transactions (and Accounts if impacted) after successful sync so imported data appears without manual refresh.

**User-visible outcome:** Authenticated users can open Bank Connections, add a Mock Bank connection, click “Sync now” to import transactions, and then see the new transactions appear in the Transactions page with visible sync status and error feedback.
