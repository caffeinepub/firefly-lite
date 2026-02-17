# Specification

## Summary
**Goal:** Build a Firefly 3-like personal finance tracker with Internet Identity authentication, per-user data isolation, and core workflows for accounts, transactions, categories, and spending overview.

**Planned changes:**
- Add Internet Identity sign-in/sign-out and restrict all finance data access to the authenticated Principal.
- Implement a single-canister Motoko backend with models and APIs for accounts, categories, transactions, and summary queries (monthly totals, category totals over a range, account balances).
- Build core UI screens: Dashboard, Accounts (list + details with transactions), Transactions (list with filters + search), Categories (list + totals over date range), Settings (per-user preferences like default currency).
- Add transaction create/edit UX supporting income/expense/transfer with validation and live UI updates (no full refresh).
- Add dashboard spending overview with charts, quick stats (income/expense/net), top categories, and empty-state prompts.
- Apply a consistent, polished visual theme suitable for personal finance, avoiding blue/purple as primary colors.

**User-visible outcome:** Users can sign in with Internet Identity, manage their own accounts/categories/transactions, view balances and filtered transaction history, see spending summaries and charts on a dashboard, adjust basic settings (e.g., default currency), and sign out.
