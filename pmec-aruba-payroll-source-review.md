# Aruba Payroll Module Source Review for PMEC

## Source Review

The uploaded Aruba payroll module supplies a compact 2025/2026 calculation engine, supporting run/YTD aggregation, monthly payroll and DIMP CSV workflows, annual VZL XML/Jaaropgaaf export helpers, and filing-deadline logic. The core implementation calculates gross pay, premies, progressive wage tax, employee deductions, employer contributions, and net salary in AWG. It also keeps AOV/AWW and AZV line items separate, which is necessary for accurate employee reporting and annual summaries.

## PMEC Integration Decision

PMEC will integrate the module as an **HR-only payroll planning and review workspace**. It will use curated demo payroll profiles for the existing workforce, a selected-period draft run, deterministic payroll previews, HR review flags, and an export-readiness panel. It will not submit a DIMP/SVb filing, make employee payments, expose payroll data to employees/PM users, or claim live legal compliance.

## Official Source Check

The DIMP wage-tax page currently publishes 2026 payroll resources, including the 2026 wage-tax calculator, premium-limit references, reparatietoeslag, and employee declaration materials.[1] The SVb 2026 tariff summary confirms AOV/AWW, AZV, ZV, OV, income limits, and Cessantia reference values, while explicitly noting that amounts can change by law.[2]

The supplied module's core 2026 premium structure is aligned with those published SVb categories and limits. However, the DIMP calculator, reparatietoeslag, employee category/tax declaration, reduced-withholding requests, bonus/holiday-pay treatment, and VZL portal schema must be rechecked and formally approved for each payroll year before the module is used for live payroll.

## References

[1] [Departamento di Impuesto — Loonbelasting](https://www.impuesto.aw/zakelijk-formulieren-en-toelichten/loonbelasting)

[2] [SVb Aruba — Summary of Tariffs 2026](https://www.svbaruba.org/employer/summary-of-tariffs/summary-of-tariffs-2026/?lang=en)
