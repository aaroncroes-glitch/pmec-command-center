# PMEC Job Order Module Notes

## Sources reviewed

- `PMEC-JOB-ORDER-MODULE-SPEC.md.pdf`, pages 1–15.

## Core implementation direction

- The module is a **project-manager/job-order execution tracker** for PMEC, not a generic Kanban board.
- It should live at `/job-orders` under **Project Delivery** and preserve job-order currency per record rather than hardcoding one global currency.
- The spec explicitly reuses a proven architecture of **list → right-side detail panel → grouped work breakdown → task editor**.
- The dashboard should read directly from the full `JobOrder` shape rather than from a simplified teaser type.

## Roles and permissions

- Staff roles allowed to open the module are **EXECUTIVE_ADMIN**, **DEPARTMENT_HEAD**, **QUOTING_SPECIALIST**, and **STAFF_ENGINEER**.
- Only **EXECUTIVE_ADMIN** can create a new job order.
- **EXECUTIVE_ADMIN** can advance phase, edit WBS, and upload cost documents for any job order.
- **DEPARTMENT_HEAD** can manage work packages only for their own discipline.
- **STAFF_ENGINEER** can update only their own assigned tasks, specifically status, progress, and notes.
- Future client roles must not see the route or nav item.

## Domain model requirements

- The specification defines exact enums and interfaces for:
  - `JobOrderPhase`
  - `EngineeringDiscipline`
  - `WorkPackageStatus`
  - `JobOrderPriority`
  - `CostLineItem`
  - `WorkPackageTask`
  - `JobOrderMilestone`
  - `CostDocument`
  - `JobOrder`
- The job order includes lead discipline, phase, priority, currency, budget, contingency percentage, quotation linkage, PM name, region, dates, task list, milestones, cost documents, timestamps, and tags.

## Derived calculations

- The spec requires spend and progress to be **derived, never stored**.
- Required derived metrics include:
  - average task progress across the job order
  - total spent from labor plus material cost
  - contingency amount and total authorized
  - spent percentage of budget
  - remaining authorized amount
  - over-budget flag
  - completed task count and completion percentage
  - implied labor multiplier for profitability tracking
- Portfolio totals must never silently mix currencies. If visible records contain multiple currencies, totals must be grouped by currency instead of converted.

## Visual/status rules from reviewed pages

- Completed and cancelled phases have specific badge treatments.
- The lifecycle strip excludes **ON_HOLD** and **CANCELLED** from the normal connected phase strip.
- If the current phase is **EXECUTION**, the phase pill dot pulses.
- Work package statuses include **NOT_STARTED**, **IN_PROGRESS**, **BLOCKED**, **UNDER_REVIEW**, and **COMPLETED** with specific icon/color treatments.
- Discipline chips also map to specific colors.
- Priority chips map to low/medium/high/critical color states.

## Screen and UX requirements from reviewed pages

- Detail and create flows must use a **right-side slide panel**, not a centered modal.
- Panel styling in the source spec uses a cream/light surface, strong editorial typography, and glass-style cards; for this adaptation, the interaction model matters more than copying the exact token set because the user asked to keep current Lumen branding.
- The list page is named **Job Order Tracker** and includes:
  - header with title/subtitle
  - New Job Order action for executive admin only
  - KPI row with total budget, total spent, active job orders, and completed work packages
  - segmented filter for **ACTIVE | COMPLETED | ALL**
  - discipline chips and optional region filter
  - clickable grid cards opening the detail panel
- Job-order cards must show phase, priority, discipline, title, client/description, overall progress, budget burn, subcontractor/target date, and lifecycle strip.
- The detail panel header includes phase, priority, discipline, tags, title, description, lifecycle/timeline, subcontractor, PM, region, dates, optional client approval info, and advance-phase action when permitted.
- Detail stats row includes budget, spent, contingency, and remaining authorized.
- Budget utilization must show percent vs budget, a dashed contingency threshold, and optional implied labor multiplier flagging if it drifts by more than 0.3.

## Additional detail behavior from pages 16–20

- The milestones section shows achieved versus pending items, with achieved items displaying a checkmark and achieved date.
- The cost-documents section is always shown, with an upload action for eligible users, document type selection, optional amount, and support for image or PDF files.
- Cost-document cards should show type, description, uploader, local date, and an external link; the empty state explicitly says no cost documents have been uploaded yet.
- The work breakdown header shows completed versus total work packages and groups tasks by `wbsPhase`, with a fallback group of `General`.
- Collapsed task rows show status, optional WBS phase, discipline, title, assignee, progress, and labor/material totals.
- Expanded task rows show description, dates, material line items, notes, and an inline edit mode for permitted users.
- The task status editor includes status, progress in 5-point steps, notes, and save/cancel behavior.
- If a task is set to `COMPLETED`, `completedDate` should be set to today if not already present and should not be cleared later.

## Create-panel and mutation requirements

- The create panel is a right-side panel titled **New Job Order**.
- Required create fields include title, client name, currency, budget, start date, and target end date.
- Additional fields include description, discipline, priority, contingency percentage, region, subcontractor/vendor, project manager, and linked quotation ID.
- New records are created with phase `PLANNING`, empty tasks and milestones, and fresh timestamps, then prepended to the active list.
- Required store mutations include:
  - adding a job order
  - updating a job-order phase
  - updating a work-package task status/progress/notes
  - adding a work-package task
  - adding a cost document

## Integration and must-ship items

- Quote-to-job-order conversion should eventually prefill title, client name, budget, currency, multiplier, and quotation ID from an awarded quotation, but a standalone creation path is acceptable now with a clearly marked integration hook.
- The cost-document upload flow assumes stored files under a job-order-specific path and appends a new `CostDocument` record after upload.
- The specification explicitly says not to skip these features even if a lighter reference implementation might:
  - **Add Work Package** in the detail panel, including materials line items
  - **Add/toggle milestones** directly in the job-order detail workflow

## Remaining required behaviors from pages 21–25

- Achieved milestones can be undone, and there must be an add-milestone form with label plus target date.
- Job-order headers must be editable after creation for permitted roles, but **currency must become locked after creation** because changing it would corrupt derived calculations.
- Executive admin only can delete a job order, with confirmation.
- Tags must be editable on create and edit, comma-separated.
- Advancing to `CLIENT_SIGNOFF` should prompt for `clientApprovedBy` and set `clientApprovalDate` to today.
- Work packages must be deletable by permitted roles with confirmation.
- Completing all tasks must **not** auto-advance the job-order phase; phase advancement remains manual.
- If cost-document amounts exist, they should appear on cards and support small document-type summaries when there are several documents.
- When saving a task, if materials exist, `materialCost` should be recalculated from `quantity * unitCost` across the materials list.
- The UI should surface **implied labor multiplier** versus quoted `netLaborMultiplier` before the job closes.

## Routing, dashboard, and motion notes

- The intended route is `/job-orders`, with a **Job Orders** navigation label under Project Delivery.
- The dashboard teaser should show active/execution job-order visibility and link into `/job-orders`.
- Material job-order changes should eventually emit audit-style update activity events.
- Motion guidance includes page fade-in, panel slide-in from the right, animated progress transitions, and reduced-motion support.

## Persistence guidance

- The long-term architecture expects persisted job orders in PostgreSQL, with enums for phases, disciplines, priorities, work-package statuses, and cost-document types.
- The `job_orders` table schema includes title, description, client, discipline, phase, priority, currency, budget, contingency, quotation linkage, multiplier, subcontractor, PM, region, dates, tasks, milestones, cost documents, tags, and timestamps.
- The spec recommends normalizing work packages into a real child table if integrating tightly with timesheets later, while milestones and cost documents can remain JSON-backed.
- RLS policy intent mirrors the application permissions: PMEC staff read, executive admin plus owning department head update, executive admin insert/delete.

## Implication for this Lumen adaptation

- The user asked for a **project-manager-only PMEC demo** while preserving existing Lumen branding. That means the current implementation should prioritize the PM-facing route structure, job-order list/detail workflow, WBS/task mechanics, milestones, derived budget views, and local demo data over full multi-role auth or database rollout.

## Final reviewed findings from pages 26–30

- Storage guidance uses a bucket-style uploads path per job order and expects PDFs/images with a moderate size cap; for the current local demo, we should preserve the attachment concept in data and UI even if we keep the files mocked locally.
- The spec recommends splitting implementation into a dedicated `job-orders` module with separate files for types, calculations, configs, page, card, detail panel, task row, add-job-order panel, add-work-package form, milestone list, cost-document list, phase timeline, and phase-advance menu.
- Three seeded job orders are required so the portfolio spans multiple phases, budgets, regions, and disciplines.

## Seed job order details captured

- **Job order 1** is a coastal substation electrical retrofit in **Aruba**, discipline **Electrical**, phase **Execution**, priority **High**, currency **AWG**, with subcontractor **ELMAR N.V.** and PM **Aaron Croes**.
- This first job includes achieved and pending milestones plus four work packages spanning site investigation, procurement, installation, and commissioning/handover. It is particularly useful for demonstrating grouped WBS phases, materials line items, and budget burn.
- **Job order 2** is a municipal water treatment plant upgrade in **Egypt**, discipline **Process/Instrumentation**, phase **Design**, priority **Critical**, currency **EGP**, and PM **Nour El-Sayed**. It has no subcontractor yet and is suitable for demonstrating early-phase technical planning and critical-priority treatment.
- The visible seed data confirms the module is intended to handle mixed currencies and multi-region operational reporting directly in one portfolio view.

## Implementation direction for the PMEC demo

- For this user request, the existing broad HR/admin framing should be narrowed into a **PMEC project-manager workspace** centered on job orders, WBS execution, milestones, budget utilization, and project delivery.
- The remaining reviewed seed pages confirm the third required sample job order and reinforce that the demo must span multiple disciplines, regions, and lifecycle states rather than showing only one active execution job.

## Final seed-data findings from pages 31–35

- **Job order 2** includes detailed phase-grouped tasks for process/instrumentation work: one completed hydraulic-model task, one in-progress instrumentation/control philosophy task, one not-started P&ID issue-for-review task, and one not-started HAZOP workshop/action close-out task. This seed demonstrates design-phase progression and mixed task states within grouped WBS phases.
- **Job order 3** is a hospital wing structural assessment and seismic retrofit in **Panama**, discipline **Civil/Structural**, phase **QA_INSPECTION**, priority **High**, currency **USD**, subcontractor **Estructuras del Istmo S.A.**, and PM **Luis Herrera**.
- The third job-order seed is intentionally deep into QA/inspection, with five milestones where only the final structural recertification remains unachieved.
- Its work packages show a late-stage delivery pattern: four tasks completed and one `UNDER_REVIEW`, making it ideal for demonstrating PMEC’s punch/inspection review posture rather than only procurement or design execution.
- Across the three seeds, the portfolio covers:
  - Aruba / AWG / Electrical / Execution
  - Egypt / EGP / Process-Instrumentation / Design
  - Panama / USD / Civil-Structural / QA Inspection

## Clear design consequence for implementation

- The PMEC demo should feature at least these three seeded job orders because they are not filler; they are the mechanism by which the portfolio view can demonstrate mixed currencies, multi-region operations, multi-discipline delivery, and varied lifecycle states exactly as the specification intends.

## Closing implementation guidance from pages 36–40

- The recommended implementation order is: types and calculations first, then persistence/API helpers, then list page with KPIs and filters, then slide-panel shell, then read-only detail, then task editor, phase advance, create job order, cost-document upload, and finally the remaining gap-closure items.
- The acceptance checklist emphasizes several exact behaviors that should guide the local demo even without full PMEC auth wiring:
  - portfolio tabs must support **ACTIVE**, **COMPLETED**, and **ALL**
  - mixed-currency totals must display grouped amounts rather than a fake blended number
  - progress is the average of task progress, not completed-task percentage
  - budget burn uses derived spend in the job order’s own currency
  - timeline strips highlight current phase and EXECUTION pulses
  - grouped WBS phases, material lines, contingency marker, milestone counts, and inline task edits must all update without closing the panel
  - new job orders start at `PLANNING` with zero tasks and zero spend
  - currency is required at creation and locked afterward
  - upload states and failures need explicit UI treatment
  - add work package, milestone toggle, edit metadata, and delete job order are all part of the required gap closure
- Suggested copy includes **Job Order Tracker**, **Active engineering delivery — work breakdown, budget, and schedule across every discipline**, **New Job Order**, **Advance Phase**, and **Work Breakdown — {n}/{m} work packages complete**.
- Out of scope for this module includes quotation generation itself, timesheet entry flow, HR/capacity dashboards, CRM/lead pipeline, Gantt/cross-project dependency planning, client portal/status pages, comments/mentions, email/WhatsApp notifications, and FX conversion.

## Final direction for this Lumen-to-PMEC adaptation

- Because the user wants this specifically as a **project-manager-only PMEC engineer company demo**, the practical target is to transform the current admin console into a PMEC-branded job-order tracker route experience within the existing app shell, preserve the Lumen warm-paper editorial styling, and implement the project-delivery mechanisms from the uploaded spec while intentionally leaving the listed out-of-scope items untouched.
- The current Lumen editorial styling should remain, but the information architecture should shift toward PMEC’s required route mechanics: portfolio KPIs, active/completed filters, job-order cards, slide-panel detail, grouped work packages, task status editing, milestones, and cost-document sections.
