# Lumen Administration Dashboard Plan

## Product boundary

The current Lumen mobile app remains **employee-only**. The administrative dashboard is a separate desktop/iPad experience for HR managers and project managers, using the same warm paper background, dense ink typography, hairline dividers, controlled orange signal color, and editorial clarity.

The first iteration uses the same local demo data contract as the employee app. It demonstrates the operating model for **28 employees and multiple contractors** without introducing a shared database or user-account system. A future shared backend will make the pipelines live; this build keeps the entities, decision states, and audit-ready fields compatible with that next step.

## Roles and access

| Role | Primary responsibilities | Default dashboard access |
| --- | --- | --- |
| **HR manager** | Workforce overview, leave approvals/rejections, attendance exceptions, employment status, contractor directory, payroll readiness, balance policies | People, Leave, Time, Payroll, Workforce Analytics |
| **Project manager** | Project health, assigned teams, contractor capacity, task/phase delivery, time allocation, delivery risks | Overview, Projects, Work Allocation, Contractors, Delivery Analytics |

The web route will gate phone-sized screens with a concise desktop/iPad-only message. Tablet landscape and desktop widths provide the full sidebar, data-table, and split-panel layout.

## Information architecture

| Area | HR operations | Project management operations |
| --- | --- | --- |
| **Overview** | Headcount, leave approvals, attendance exceptions, payroll cutoff, workforce status | Active-project health, late milestones, unallocated capacity, delivery risks |
| **People** | Employee/contractor directory, department, leave balance, status, employment type | Project assignment, availability, role, allocation |
| **Leave & time** | Review requests, write approval/rejection notes, see working-day totals and carry-over balances | See leave conflicts against phases and project delivery windows |
| **Projects** | Read project resourcing context | Project details, phase task completion, owner, delivery status, team composition |
| **Payroll** | Payslip readiness, hours exceptions, payroll status | Read-only cost and allocation context |

## Shared data pipeline

| Mobile employee event | Administrative dashboard read model | Future shared backend operation |
| --- | --- | --- |
| Clock-in/out | Attendance feed, late/absence exception, project allocation | `attendance_records` upsert + manager notification rule |
| Leave request | Leave approval queue, working-day balance forecast, staffing conflict | `leave_requests` workflow with audit event and status transition |
| Task/project update | Project health, phase completion, allocation overview | `project_tasks` update + project aggregate recalculation |
| Payslip availability | Payroll readiness and employee payroll history | `payslips` publication record with secure file storage |

## Dashboard layout and motion

The desktop layout uses a fixed left navigation rail, a top contextual toolbar, and a fluid main canvas that alternates between large operational headlines, compact metric blocks, and high-density line-item tables. iPad uses a collapsible rail and horizontal-scroll table treatment. Content reveals with restrained fades; interactive filters and status transitions use opacity/scale feedback and no distracting chart motion.
