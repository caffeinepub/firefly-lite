# Specification

## Summary
**Goal:** Add a Reports module that lets users create, view, manage, and download financial reports, with supporting backend persistence, report generation, and navigation entry points.

**Planned changes:**
- Backend: add per-user Report persistence and CRUD APIs (create/update/delete/get/list) including reportType, date range, optional JSON filters, timestamps, and a displayable derived report name.
- Backend: add report-generation API for supported report types (Profit & Loss, Cash Flow, Invoice Summary, Payment Summary, Budget vs. Actual, Category Breakdown) using existing finance data, supporting date range + optional filters (category/account/tag) and returning structured results for UI.
- Frontend: add protected routes/pages for reports: list (/reports), create (/reports/new), detail (/reports/$reportId), and edit (/reports/$reportId/edit) reusing the create form.
- Frontend: implement Reports List page with table columns (name, type, date range, created date), filters (type, date range), and actions (View, Download PDF, Delete) plus “Create New Report”.
- Frontend: implement Report Create/Edit form (type, start/end date, optional filters) with live preview generation, validation, Save, and Download PDF (works before saving).
- Frontend: implement Report Detail page with summary + dynamic charts/tables per report type, and actions Edit, Delete, Download PDF.
- Frontend: add React Query hooks for listing/fetching/creating/updating/deleting reports and generating previews/results, following existing query/invalidation patterns.
- Frontend: add a Dashboard “Reports” card showing last report type run, most used report type, and a “Run New Report” button.
- Frontend: add “Reports” to main navigation under Financial with a bar chart icon linking to /reports.

**User-visible outcome:** Users can navigate to a new Reports area, create/edit reports with a live preview, view report details with charts/tables, delete reports, and download reports as English PDFs; the dashboard and navigation include new Reports entry points.
