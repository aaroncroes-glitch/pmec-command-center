# Aruba Payroll Rules & Export Module — Production Reference

> **For:** Integrating into another application (Manus or any payroll/HR system)  
> **Jurisdiction:** Aruba (AWG — Aruban Florin)  
> **Authority:** Departamento di Impuesto (DIMP) + Sociale Verzekeringsbank (SVb)  
> **Tax years covered:** 2025, 2026  
> **Package location:** `exports/aruba-payroll/`

---

## Package Contents

| File | Purpose |
|------|---------|
| `constants.aruba.json` | Official rate tables, caps, deadlines |
| `payrollCalculator.js` | Core DIMP calculation engine (standalone ESM) |
| `payrollCalculations.js` | Helper functions for runs, YTD, summaries |
| `payrollExports.js` | CSV, VZL XML, Jaaropgaaf, DIMP deadline helpers |
| `ARUBA_PAYROLL_RULES.md` | This document |

---

## 1. Legal Framework

### Authorities

| Body | Role |
|------|------|
| **DIMP** (Departamento di Impuesto) | Wage tax (Loonbelasting), income tax tables, monthly declarations, Verzamelloonstaat (VZL) |
| **SVb** (Sociale Verzekeringsbank Aruba) | AOV/AWW, AZV collection; ZV/OV employer premiums |

### Official sources (verify annually)

- [DIMP Loonbelasting forms & calculators](https://www.impuesto.aw/zakelijk-formulieren-en-toelichten/loonbelasting)
- [2025 tax rate change (Government of Aruba)](https://www.gobierno.aw/nl/het-tarief-van-de-inkomstenbelasting-en-de-loonbelasting-verandert-vanaf-1-januari-2025)
- [AOV/AWW premiegrenzen](https://www.impuesto.aw/premiegrenzen-aovaww)
- [AZV premiegrenzen](https://www.impuesto.aw/premiegrenzen-azv)
- [SVb Tariffs 2025](https://www.svbaruba.org/employer/summary-of-tariffs/summary-of-tariffs-2025/)
- [2026 pensioner AZV change](https://www.gobierno.aw/en/pensioners-to-pay-lower-azv-premiums-starting-january-1-2026)

### Filing deadlines

| Obligation | Deadline |
|------------|----------|
| Monthly loonbelasting + AOV/AWW + AZV | **15th of the month following** the payroll period |
| Verzamelloonstaat (VZL) — annual wage summary | **March 31** of the following year |
| Jaaropgaaf — employee annual statement | Issued by employer; employee uses for personal tax return |

---

## 2. Calculation Order (DIMP)

Every payroll period follows this exact sequence:

```
1. Bruto loon (gross salary + taxable bonuses)
2. Premie-inkomen base:
   Bruto − Verwervingskosten − Pensioen (recognized) − Spaarfonds (capped)
3. AOV/AWW employee premium (5% of premie-inkomen, capped at AWG 85,000/year)
4. AZV employee premium (1.6% of premie-inkomen, capped at AWG 85,000/year)
   — OR pensioner tiered rates (see §4)
5. Tabelinkomen (table income):
   Bruto − AOV/AWW EE − AZV EE − Belastingvrije som (AWG 30,000/year)
6. Loonbelasting — progressive brackets, rounded DOWN to whole florin
7. Netto = Bruto − (AOV/AWW + AZV + Loonbelasting) + Reparatietoeslag (non-taxable)
8. Employer costs (parallel): AOV/AWW ER + AZV ER + ZV + OV + Cessantia
```

---

## 3. Rate Tables — 2025/2026

### 3.1 Belastingvrije som (Tax-free allowance)

| Item | Annual amount |
|------|---------------|
| Belastingvrije som | **AWG 30,000** |

All individuals with table income up to AWG 30,000 pay **zero loonbelasting**.

### 3.2 Loonbelasting brackets (2025+, unchanged 2026)

Applied to **Tabelinkomen** (after SS deductions and belastingvrije som):

| Bracket | Table income range (annual) | Marginal rate | Fixed amount (column III) |
|---------|----------------------------|---------------|---------------------------|
| 1 | AWG 0 – 34,930 | **0%** | AWG 0.00 |
| 2 | AWG 34,930 – 63,904 | **21%** | AWG 0.00 |
| 3 | AWG 63,904 – 135,527 | **42%** | AWG 6,084.54 |
| 4 | Above AWG 135,527 | **52%** | AWG 36,166.20 |

**Calculation method:** For each bracket, tax = fixed amount + (marginal rate × amount exceeding bracket floor).  
**Rounding:** Annual wage tax is **rounded DOWN** (`Math.floor`) to the nearest whole florin (DIMP rule, in taxpayer's favor).

**Example — AWG 10,000/month (AWG 120,000/year):**

```
AOV/AWW EE = 5% × 85,000 = 4,250
AZV EE     = 1.6% × 85,000 = 1,360
Tabelinkomen = 120,000 − 4,250 − 1,360 − 30,000 = 84,390

Bracket 2: 21% × (63,904 − 34,930) = 6,084.54
Bracket 3: 42% × (84,390 − 63,904) = 8,604.12
Annual tax = floor(14,688.66) = 14,688
Monthly tax = 14,688 / 12 = AWG 1,224.00
Net ≈ AWG 8,308.50/month
```

### 3.3 AOV/AWW (Algemene Ouderdomsvoorziening / Weduwen- en Wezenverzekering)

| | Employee | Employer | Total |
|---|----------|----------|-------|
| Rate | **5.0%** | **10.5%** | **15.5%** |
| Premiegrens (cap) | **AWG 85,000/year** | same | same |
| Max annual EE | AWG 4,250 | — | — |
| Max annual ER | — | AWG 8,925 | — |

**Rules:**
- Calculated on **premie-inkomen** (after Verwervingskosten deduction), not raw gross
- Employees aged **65+** are **exempt** from AOV/AWW employee premium
- Employer AOV/AWW also exempt for pensioners

### 3.4 AZV (Algemene Ziektekostenverzekering)

| | Employee | Employer | Total |
|---|----------|----------|-------|
| Rate (standard) | **1.6%** | **8.9%** | **10.5%** |
| Premiegrens | **AWG 85,000/year** | same | same |
| Max annual EE | AWG 1,360 | — | — |
| Max annual ER | — | AWG 7,565 | — |

**Pensioners (age 65+) — AZV tiers:**

| Year | First AWG 30,000 | Above AWG 30,000 (up to cap) |
|------|------------------|------------------------------|
| **2025** | 5.0% | 10.5% |
| **2026+** | **0.0%** | 10.5% |

Pass `taxYear: 2026` to the calculator for 2026 pensioner rules.

### 3.5 SVb employer premiums (not withheld from employee)

| Premium | Rate | Income cap | Paid by |
|---------|------|------------|---------|
| **ZV** (Ziekteverzekering) | **2.65%** | AWG 70,200/year | Employer |
| **OV** (Ongevallenverzekering) | **0.25% – 2.5%** (Gevarenklasse) | AWG 70,200/year | Employer |
| **Cessantia** | **AWG 40/year** flat | Per employee on Jan 1 | Employer |

OV rate is set per employee based on **SVb Gevarenklasse** (hazard class). Default in this module: **2.5%**.

**SVb income thresholds (2025):**

| Period | Cap |
|--------|-----|
| Daily (5-day week) | AWG 270 |
| Daily (6-day week) | AWG 225 |
| Weekly | AWG 1,350 |
| Monthly | AWG 5,850 |
| **Yearly** | **AWG 70,200** |

### 3.6 Pre-tax deductions (reduce premie-inkomen)

| Deduction | Rule |
|-----------|------|
| **Verwervingskosten** | 3% of gross, max **AWG 1,500/year** |
| **Pensioen** (recognized fund) | Full employee contribution deducted |
| **Spaarfonds / Voorzieningsfonds** | Max 5% of gross, cap **AWG 3,360/year** |

### 3.7 Non-taxable additions

| Item | Treatment |
|------|-----------|
| **Reparatietoeslag** | Added directly to net pay; not subject to loonbelasting or SS. Amount from DIMP reparatietoeslag table (varies by gross salary band — see DIMP Excel calculator). |

---

## 4. Employee Input Fields

Minimum fields required per employee for accurate calculation:

```typescript
interface EmployeePayrollInput {
  id: string | number
  firstName: string
  lastName: string
  grossMonthlySalary: number          // AWG
  socialSecurityEnabled: boolean        // false for pensioners past AOV age
  maritalStatus: 'single' | 'married'  // Cat. 2 / Cat. 1 (see §7)
  svbGevarenklasse: number              // 0.25 – 2.5 (OV rate %)
  dateOfBirth: string                   // ISO date — for age-based rules
  nationalId: string                    // Persoonsnummer (for exports)
  identiteitsnummer?: string
  personeelsnummer?: string
  reparatietoeslag?: number             // Monthly AWG (from DIMP table)
  pensionContributionEmployee?: number  // Annual AWG
  savingsFundContribution?: number      // Annual AWG
}
```

---

## 5. Payroll Run Data Model

```typescript
interface PayrollRun {
  id: number
  period: string              // "YYYY-MM"
  status: 'Draft' | 'Finalized'
  employeeCount: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  employerId: number
  createdAt: string
  finalizedAt: string | null
}

interface PayrollLineItem {
  id: number
  runId: number
  employeeId: number
  baseSalary: number
  bonuses: { description: string; amount: number }[]
  deductions: { description: string; amount: number }[]
  taxAmount: number              // Loonbelasting
  aovAwwAmount: number           // Store separately for accurate exports
  azvAmount: number              // Store separately for accurate exports
  socialSecurityAmount: number   // aovAwwAmount + azvAmount
  netPay: number
}
```

**Production rule:** Always store `aovAwwAmount` and `azvAmount` separately on line items. Do not rely on ratio splits in exports.

---

## 6. Export Module Reference

### 6.1 CSV exports

```javascript
import {
  exportPayrollRunCSV,
  exportMonthlyDeclarationCSV,
  exportTaxReportCSV,
} from './payrollExports.js'

// Monthly payroll per employee
exportPayrollRunCSV(lineItems, employees, '2025-08')

// Monthly DIMP declaration (same format)
exportMonthlyDeclarationCSV(lineItems, employees, '2025-08')

// Annual tax summary
exportTaxReportCSV(employeeSummary, 2025)
```

**Monthly DIMP CSV columns:**

| Column | Description |
|--------|-------------|
| Personeelsnummer | Employee number |
| Werknemersnaam | Full name |
| Afdeling | Department |
| Periode | YYYY-MM |
| Bruto Salaris | Gross pay |
| Loonbelasting | Wage tax withheld |
| AOV/AWW | Employee AOV/AWW premium |
| AZV | Employee AZV premium |
| Netto Salaris | Net pay |

### 6.2 VZL XML (Verzamelloonstaat)

```javascript
import { downloadVZLXml, generateVZLXml, aggregateEmployeeSummary } from './payrollExports.js'

const summary = aggregateEmployeeSummary(lineItems, employees, payrollRuns, 2025)
downloadVZLXml(summary, employer, 2025)
// → VZL-verzamelloonstaat-2025.xml
```

**XML structure:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Verzamelloonstaat xmlns="urn:dimp:aruba:vzl:1.0">
  <Werkgever>
    <Naam>PMEC N.V.</Naam>
    <SchakelNummer>123456789</SchakelNummer>  <!-- employer tax ID -->
    <Periode>2025</Periode>
    <AangifteDatum>2026-03-15</AangifteDatum>
  </Werkgever>
  <Werknemers>
    <Werknemer>
      <Persoonsnummer>79110700</Persoonsnummer>
      <Naam>Solagnier, Percy</Naam>
      <Geboortedatum>1979-11-07</Geboortedatum>
      <BrutoJaarloon>85200.00</BrutoJaarloon>
      <IngehoudeLoonbelasting>4200.00</IngehoudeLoonbelasting>
      <AOV_AWW_Premie>3230.00</AOV_AWW_Premie>
      <AZV_Premie>1032.00</AZV_Premie>
      <NettoJaarloon>76738.00</NettoJaarloon>
    </Werknemer>
  </Werknemers>
</Verzamelloonstaat>
```

> **Production note:** Validate XML against the official BO Impuesto / DIMP portal schema before live submission. The namespace `urn:dimp:aruba:vzl:1.0` is an application convention — confirm against current DIMP XSD if available.

### 6.3 Jaaropgaaf (employee annual statement)

```javascript
import { downloadJaaropgaaf } from './payrollExports.js'

downloadJaaropgaaf(summaryRow, 2025, employer)
// → jaaropgaaf-2025-Solagnier.html (printable)
```

### 6.4 DIMP deadline tracking

```javascript
import { getDimpDeadline, getFilingStatus } from './payrollExports.js'

getDimpDeadline('2025-08')  // → Date: 2025-09-15
getFilingStatus('2025-08', true)  // → 'on-track' | 'due-soon' | 'overdue' | 'draft'
```

---

## 7. Known Limitations & Production Checklist

### Implemented ✅

- [x] 2025/2026 loonbelasting brackets (0/21/42/52%)
- [x] Belastingvrije som AWG 30,000
- [x] AOV/AWW 5% EE / 10.5% ER with AWG 85,000 cap
- [x] AZV 1.6% EE / 8.9% ER with AWG 85,000 cap
- [x] Pensioner AOV/AWW exemption (65+)
- [x] Pensioner AZV tiers (2025: 5%/10.5%; 2026: 0%/10.5%)
- [x] Verwervingskosten deduction (3%, max AWG 1,500)
- [x] Pension & savings fund deductions
- [x] Reparatietoeslag (non-taxable net addition)
- [x] SVb ZV 2.65% + OV gevarenklasse + Cessantia AWG 40
- [x] DIMP floor rounding on wage tax
- [x] CSV, VZL XML, Jaaropgaaf exports
- [x] Monthly/annual aggregation

### Requires manual DIMP table lookup ⚠️

- [ ] **Reparatietoeslag amount** — must be looked up from DIMP reparatietoeslag table by salary band (not auto-calculated)
- [ ] **Category 1 vs Category 2** — `maritalStatus` parameter exists but standard table applies to both; verify if married employees need separate DIMP Category 1 table
- [ ] **Verzoek vermindering loon** — reduced withholding requests not implemented
- [ ] **13th month / vakantiebijslag** — bonus handling exists but Aruba-specific holiday pay rules need business rules
- [ ] **VZL XML schema** — validate against official DIMP portal before production filing

### Annual maintenance 🔄

1. Download new DIMP Excel calculator each January from [impuesto.aw](https://www.impuesto.aw/zakelijk-formulieren-en-toelichten/loonbelasting)
2. Compare brackets, premiegrenzen, and rates against `constants.aruba.json`
3. Update `payrollCalculator.js` if rates change
4. Re-run verification tests (see §8)

---

## 8. Verification Test Cases

Run after any rate change:

```javascript
import calculateArubaPayroll from './payrollCalculator.js'

// Case 1: AWG 4,500/month — low salary, zero wage tax
const low = calculateArubaPayroll(4500, 'monthly', 'single', 2.5, true, 30)
// Expected: wageTax = 0, net ≈ AWG 4,211.25
// (AOV/AWW = 218.75, AZV = 70.00 after Verwervingskosten adjustment)

// Case 2: AWG 10,000/month — high salary, multi-bracket tax
const high = calculateArubaPayroll(10000, 'monthly', 'single', 2.5, true, 30)
// Expected: wageTax = 1224.00, net = 8308.50

// Case 3: Pensioner 66 years, 2026 AZV rules
const pensioner = calculateArubaPayroll(5000, 'monthly', 'single', 2.5, true, 66, 0, 0, 0, 2026)
// Expected: aovAww = 0, azv uses 0%/10.5% tiers
```

---

## 9. Integration Example

```javascript
import calculateArubaPayroll from './payrollCalculator.js'
import { calculatePayrollSummary, calculateRunTotals } from './payrollCalculations.js'
import { exportPayrollRunCSV, downloadVZLXml, aggregateEmployeeSummary } from './payrollExports.js'

// 1. Calculate one employee
const breakdown = calculateArubaPayroll(
  7100,           // gross monthly AWG
  'monthly',
  'married',      // maritalStatus
  0.25,           // SVb gevarenklasse 0.25%
  true,           // socialSecurityEnabled
  46,             // age
  0,              // reparatietoeslag
  0, 0,           // pension, savings
  2025            // taxYear
)
console.log(breakdown.employee.netSalary)  // → net monthly AWG

// 2. Run payroll for all active employees
const lineItems = calculatePayrollSummary(activeEmployees, 2025)
const totals = calculateRunTotals(lineItems)

// 3. Export monthly DIMP file
exportPayrollRunCSV(lineItems, activeEmployees, '2025-08')

// 4. Export annual VZL
const summary = aggregateEmployeeSummary(allLineItems, employees, runs, 2025)
downloadVZLXml(summary, employer, 2025)
```

---

## 10. Employer Record for Exports

```typescript
interface Employer {
  name: string
  legalName?: string
  taxId: string              // SchakelNummer / fiscaal nummer — required for VZL
  tradeRegisterNumber?: string
  street?: string
  city?: string
  country: 'Aruba'
  currency: 'AWG'
}
```

---

*Document version: 2026-08-24. Rates verified against DIMP 2025 publications and SVb 2025 tariff summary. Re-verify before each tax year.*
