# PMEC Aruba Payroll Module Validation

The HR-only Payroll destination was verified from the PMEC Control Center. The page rendered the warm-paper editorial dashboard, 28 employee-only scenario profiles, selected-period draft-run navigation, gross/deductions/employer-cost totals, per-employee calculation detail, and filing-readiness/exception panels. Selecting Sofia Arends updated the calculation detail from the roster. Moving from April 2026 to May 2026 updated the selected run and filing date from 15 May to 15 June.

The Project Manager role was then selected and its sidebar showed only Control Room, PM + HR View, Job Orders, Hours & Attendance, and Capacity. Payroll was absent, confirming the new `payroll` permission remains HR-scoped in the current demonstration access model.

Automated validation passed TypeScript and 34 deterministic tests. The dedicated payroll suite validates the supplied low-salary, multi-bracket, pensioner AZV, capped employer premium, employee-only draft run, DIMP due-date, and HR-only permission fixtures. The module uses non-identifying scenario compensation; it does not process payments or submit filings. DIMP/SVb reference values must be rechecked and formally approved before live payroll use.
