# Lumen Employee Self-Service Extension

## Scope adaptation

Lumen will absorb the specification’s **Phase 1 employee self-service capabilities** as a local-first mobile experience. The existing warm-paper, bold editorial typography, hairline dividers, restrained signal orange, spring motion, and one-handed controls remain unchanged. The requested administrative web portal, external domain routing, Supabase synchronization, and database schema are deliberately excluded.

## Local demo identity

The local employee demo uses the specified employee profile: **Percy Solagnier**, employee number **76**, PIN **1234**, Mechanical Engineer at PMEC N.V. The demo contains four projects, task phases, attendance history, leave entries, payslip summaries, and personal events. All changes are stored only on the device.

## Feature mapping

| Specification capability | Lumen implementation |
| --- | --- |
| ESS onboarding and PIN access | A three-card first-run sequence and a local employee number/PIN gate. |
| Attendance and face scan | Attendance workspace with project → phase → task selection and a subtle 2.2-second simulated scan. |
| Projects | Project list, current-week hours, phase progress, and inline task-status changes. |
| Leave | Personal leave request list and a lightweight create request sheet. |
| Payslips | Local payslip summaries, PIN check, and a readable gross-to-net breakdown. |
| Personal calendar | Existing Lumen calendar extended with personal events and leave overlays. |
| Analytics | Local attendance-rate, late-day, and project-hour summaries. |
| Profile | Local profile, theme choice, demo PIN update, and session sign-out. |
| Task workspace | Existing tasks, recurrence, tags, priority filters, and local reminders stay available as the daily work view. |

## Navigation

The main bottom navigation evolves into **Home**, **Work**, **Projects**, **Pay**, and **Profile**. Home prioritizes attendance and daily tasks. Work keeps the existing task and calendar tooling. Project, leave, analytics, activity, attendance, payslips, and event views are pushed as focused portrait screens rather than creating a crowded tab bar.

## Data and privacy

The extension uses existing device persistence only. The onboarding flag, local session, mutable demo records, employee profile, work projects, activity feed, leave requests, payslips, personal events, and existing Lumen workspace are not sent to a server. No domain, remote authentication, database, synchronization, or payroll/tax calculation feature is introduced in this scope.
