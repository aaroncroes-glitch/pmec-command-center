# PMEC HR Payroll Workspace Design

## Purpose and Scope

The new **Payroll** destination belongs only to the Human Resources Control Center. It adapts the uploaded Aruba payroll module into PMEC’s warm-paper editorial interface for payroll planning, review, and export readiness. It uses the existing employee workforce as a private HR roster and does not appear for Project Managers or employee mobile users.

> The implemented module is a **draft payroll review tool**, not a payment system, tax-filing service, or substitute for annual DIMP/SVb validation. It is deliberately labelled “Review before filing” because payroll rules, compensation allowances, employee declarations, and filing formats can change.[1] [2]

## Information Architecture

| Area | HR payroll experience | PMEC boundary |
|---|---|---|
| Payroll overview | Selected payroll period, employee count, gross, net, employer cost, filing date | HR only |
| Payroll roster | Employee draft pay, deductions, net pay, employer cost, review status | Contractors excluded by default |
| Run review | AOV/AWW, AZV, wage tax, ZV, OV, Cessantia, and payroll assumptions | No payment transfer or filing submission |
| Filing readiness | Monthly DIMP CSV, VZL annual XML, Jaaropgaaf readiness indicators | Export reference only until official verification |
| Exception queue | Missing payroll profile, pensioner rules, allowance/bonus review, pending HR checks | Resolves through HR data review |

## Data Boundary

Existing PMEC workforce records do not contain salary, national ID, marital status, date of birth, pension contribution, savings fund, risk class, or filing credentials. To avoid inventing or exposing personal payroll data, the first implementation creates a separate **demo payroll profile** layer.

| Field | Demo implementation | Future production source |
|---|---|---|
| Gross monthly salary | Curated non-identifying AWG scenario amount | Secure employee compensation record |
| Date of birth / national ID | Never seeded or displayed | Restricted employee payroll profile |
| Marital category | Scenario-only selector, default `single` | Approved DIMP declaration/employee record |
| SVb risk class | Department/job scenario value | HR/SVb classification record |
| Allowances/bonuses | Explicitly zero in draft run | Approved pay elements with audit trail |
| Employer tax ID / filing credentials | Not stored | Server-side protected employer configuration |

## Calculation Treatment

The adapted calculator ports the uploaded module’s order of operations: annualize gross pay, compute premium income after permitted deductions, apply employee AOV/AWW and AZV premiums, calculate annual table income and floored wage tax, then calculate employer premiums and monthly net pay. The 2026 pensioner AZV tier is supported in the draft calculator. Each run keeps AOV/AWW and AZV distinct so future CSV/VZL/Jaaropgaaf workflows can remain accurate.

## Screen Layout

The view uses the existing Control Center grammar: an editorial hero, restrained orange focal marks, black ink headings, paper panels, and high-density HR operations tables.

```text
┌ HR PAYROLL / ARUBA · REVIEW BEFORE FILING ──────────────────────────────┐
│ Aruba payroll, made reviewable.               APRIL 2026 · DRAFT         │
│ [28] PAYROLL PROFILES  [AWG …] NET PAY  [15 MAY] DIMP DUE               │
├ SELECTED PAYROLL RUN ──────────────────────────────────────────────────┤
│ GROSS PAYROLL       EMPLOYEE DEDUCTIONS       EMPLOYER COST              │
│ AWG …               AWG …                     AWG …                      │
├ PAYROLL REVIEW ROSTER ─────────────┬ FILING READINESS ─────────────────┤
│ Name / Dept / Gross / Net / Review │ Monthly DIMP · review required     │
│ AOV · AZV · Wage tax / employer    │ VZL XML · annual preparation       │
│                                    │ Jaaropgaaf · employee statement    │
├ PAYROLL EXCEPTIONS ────────────────┴ SOURCE + YEAR BOUNDARY ───────────┤
│ Review pensioner/allowance cases     2026 draft rates · verify annually │
└─────────────────────────────────────────────────────────────────────────┘
```

## HR Role Boundary

The payroll tab requires a new `payroll` permission that only the current HR demonstration role has. Project Manager navigation does not render the tab, and PM view switching automatically returns to a permitted tab. This maintains the current “demo role” limitation until Clerk-backed identity mapping is implemented.

## Payroll Run State

The first release creates a deterministic selected-month **draft** run derived from the demo payroll profiles. It supports month navigation and a per-person details panel. It never finalizes a run, moves money, transmits a declaration, or lets employee/mobile users view compensation.

## References

[1] [Departamento di Impuesto — Loonbelasting](https://www.impuesto.aw/zakelijk-formulieren-en-toelichten/loonbelasting)

[2] [SVb Aruba — Summary of Tariffs 2026](https://www.svbaruba.org/employer/summary-of-tariffs/summary-of-tariffs-2026/?lang=en)
