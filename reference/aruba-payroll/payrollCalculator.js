/**
 * Aruba Payroll Calculator — DIMP 2025/2026 compliant
 *
 * Standalone module (no framework dependencies).
 * Import: import calculateArubaPayroll from './payrollCalculator.js'
 *
 * @param {number} grossSalary - Gross salary amount
 * @param {'monthly'|'annual'} frequency
 * @param {'single'|'married'} maritalStatus - Reserved for future Category 1/2 tables
 * @param {number} svbRiskPercentage - SVb OV gevarenklasse (0.25–2.5)
 * @param {boolean} ssEnabled - Apply social premiums
 * @param {number} age - Employee age (65+ affects AOV/AZV)
 * @param {number} reparatietoeslag - Monthly non-taxable allowance (AWG)
 * @param {number} pensionContributionEmployee - Annual recognized pension (AWG)
 * @param {number} savingsFundContribution - Annual savings/provident fund (AWG)
 * @param {number} taxYear - 2025 or 2026 (affects pensioner AZV tier)
 */

const RATES_2025 = {
  AOV_AWW_LIMIT: 85000,
  AOV_AWW_EE: 0.05,
  AOV_AWW_ER: 0.105,
  AZV_LIMIT: 85000,
  AZV_EE: 0.016,
  AZV_ER: 0.089,
  SVB_LIMIT: 70200,
  ZV_ER: 0.0265,
  CESSANTIA: 40,
  TAX_FREE: 30000,
  VERWERVING_RATE: 0.03,
  VERWERVING_MAX: 1500,
  SAVINGS_MAX_RATE: 0.05,
  SAVINGS_MAX: 3360,
  PENSIONER_AGE: 65,
  BRACKETS: [
    { limit: 34930, rate: 0.0 },
    { limit: 63904, rate: 0.21 },
    { limit: 135527, rate: 0.42 },
    { limit: Infinity, rate: 0.52 },
  ],
}

function getPensionerAzvRates(taxYear) {
  // DIMP: from 2026-01-01 pensioners pay 0% on first AWG 30,000 (was 5% in 2025)
  if (taxYear >= 2026) {
    return { tier1Rate: 0.0, tier1Limit: 30000, tier2Rate: 0.105 }
  }
  return { tier1Rate: 0.05, tier1Limit: 30000, tier2Rate: 0.105 }
}

export default function calculateArubaPayroll(
  grossSalary,
  frequency = 'monthly',
  maritalStatus = 'single',
  svbRiskPercentage = 2.5,
  ssEnabled = true,
  age = 30,
  reparatietoeslag = 0,
  pensionContributionEmployee = 0,
  savingsFundContribution = 0,
  taxYear = 2025
) {
  const R = RATES_2025
  const isMonthly = frequency === 'monthly'
  const annualGross = isMonthly ? grossSalary * 12 : grossSalary
  const isPensioner = age >= R.PENSIONER_AGE
  const div = isMonthly ? 12 : 1

  // Step 1 — Premie-inkomen (DIMP: deduct Verwervingskosten before social premiums)
  const verwervingskosten = Math.min(annualGross * R.VERWERVING_RATE, R.VERWERVING_MAX)
  const cappedSavings = Math.min(savingsFundContribution, annualGross * R.SAVINGS_MAX_RATE, R.SAVINGS_MAX)
  const premieInkomen = Math.max(0, annualGross - verwervingskosten - pensionContributionEmployee - cappedSavings)
  const cappedPremieInkomen = Math.min(premieInkomen, R.AOV_AWW_LIMIT)

  // Step 2 — AOV/AWW employee (exempt for pensioners 65+)
  const aovAwwEe = ssEnabled && !isPensioner ? cappedPremieInkomen * R.AOV_AWW_EE : 0

  // Step 3 — AZV employee
  let azvEe = 0
  if (ssEnabled) {
    if (isPensioner) {
      const { tier1Rate, tier1Limit, tier2Rate } = getPensionerAzvRates(taxYear)
      const tier1 = Math.min(cappedPremieInkomen, tier1Limit)
      const tier2 = Math.max(0, cappedPremieInkomen - tier1Limit)
      azvEe = tier1 * tier1Rate + tier2 * tier2Rate
    } else {
      azvEe = cappedPremieInkomen * R.AZV_EE
    }
  }

  // Step 4 — Table income (Tabelinkomen)
  const annualTaxableBase = Math.max(0, annualGross - aovAwwEe - azvEe - R.TAX_FREE)

  // Step 5 — Progressive wage tax (Loonbelasting) — round DOWN per DIMP
  let annualWageTax = 0
  let remaining = annualTaxableBase
  let previousLimit = 0
  for (const bracket of R.BRACKETS) {
    const bracketSize = bracket.limit - previousLimit
    const taxableInBracket = Math.min(remaining, bracketSize)
    if (taxableInBracket > 0) {
      annualWageTax += taxableInBracket * bracket.rate
      remaining -= taxableInBracket
    }
    previousLimit = bracket.limit
    if (remaining <= 0) break
  }
  annualWageTax = Math.floor(annualWageTax)

  // Step 6 — Employer contributions
  const aovAwwEr = ssEnabled && !isPensioner ? cappedPremieInkomen * R.AOV_AWW_ER : 0
  const azvEr = ssEnabled ? Math.min(cappedPremieInkomen, R.AZV_LIMIT) * R.AZV_ER : 0
  const svbBase = Math.min(annualGross, R.SVB_LIMIT)
  const zvEr = ssEnabled ? svbBase * R.ZV_ER : 0
  const ovEr = ssEnabled ? svbBase * (svbRiskPercentage / 100) : 0

  // Step 7 — Net (Reparatietoeslag is non-taxable, added to net)
  const annualReparatie = reparatietoeslag * 12
  const totalEeDeductions = aovAwwEe + azvEe + annualWageTax
  const netAnnual = annualGross - totalEeDeductions + annualReparatie

  return {
    grossSalary: round2(annualGross / div),
    taxableBase: round2(annualTaxableBase / div),
    premieInkomen: round2(cappedPremieInkomen / div),
    verwervingskosten: round2(verwervingskosten / div),
    reparatietoeslag: round2(reparatietoeslag),
    employee: {
      aovAww: round2(aovAwwEe / div),
      azv: round2(azvEe / div),
      wageTax: round2(annualWageTax / div),
      totalDeductions: round2(totalEeDeductions / div),
      netSalary: round2(netAnnual / div),
    },
    employer: {
      aovAww: round2(aovAwwEr / div),
      azv: round2(azvEr / div),
      zv: round2(zvEr / div),
      ov: round2(ovEr / div),
      cessantia: round2(R.CESSANTIA / div),
      totalContribution: round2((aovAwwEr + azvEr + zvEr + ovEr + R.CESSANTIA) / div),
    },
    metadata: {
      currency: 'AWG',
      frequency,
      maritalStatus,
      ssEnabled,
      isPensioner,
      taxYear,
      svbRiskPercentage,
    },
  }
}

function round2(n) {
  return Number(n.toFixed(2))
}
