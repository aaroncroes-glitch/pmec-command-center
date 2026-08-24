import calculateArubaPayroll from './payrollCalculator.js'

/** Full monthly breakdown for one employee */
export function getArubaFullBreakdown(
  grossMonthlySalary,
  ssEnabled = true,
  maritalStatus = 'single',
  svbRisk = 2.5,
  age = 30,
  options = {}
) {
  return calculateArubaPayroll(
    grossMonthlySalary,
    'monthly',
    maritalStatus,
    svbRisk,
    ssEnabled,
    age,
    options.reparatietoeslag ?? 0,
    options.pensionContributionEmployee ?? 0,
    options.savingsFundContribution ?? 0,
    options.taxYear ?? 2025
  )
}

export function calculateTax(grossMonthlySalary, ssEnabled = true, maritalStatus = 'single', age = 30) {
  return calculateArubaPayroll(grossMonthlySalary, 'monthly', maritalStatus, 2.5, ssEnabled, age).employee.wageTax
}

export function calculateSocialSecurity(grossMonthlySalary, ssEnabled = true, maritalStatus = 'single', age = 30) {
  const r = calculateArubaPayroll(grossMonthlySalary, 'monthly', maritalStatus, 2.5, ssEnabled, age)
  return r.employee.aovAww + r.employee.azv
}

export function calculateNetPay(gross, tax, ss, otherDeductions = 0) {
  return gross - tax - ss - otherDeductions
}

export function calculateEmployerCost(grossMonthlySalary, ssEnabled = true, svbRisk = 2.5, age = 30) {
  const r = calculateArubaPayroll(grossMonthlySalary, 'monthly', 'single', svbRisk, ssEnabled, age)
  return grossMonthlySalary + r.employer.totalContribution
}

export function calculateBonusTotal(bonuses = []) {
  return bonuses.reduce((sum, b) => sum + (b.amount || 0), 0)
}

export function calculateDeductionTotal(deductions = []) {
  return deductions.reduce((sum, d) => sum + (d.amount || 0), 0)
}

/** Build payroll line items for active employees */
export function calculatePayrollSummary(employees, taxYear = 2025) {
  return employees.map((emp) => {
    const result = calculateArubaPayroll(
      emp.grossMonthlySalary,
      'monthly',
      emp.maritalStatus || 'single',
      emp.svbGevarenklasse ?? 2.5,
      emp.socialSecurityEnabled !== false,
      emp.age ?? ageFromDob(emp.dateOfBirth),
      emp.reparatietoeslag ?? 0,
      emp.pensionContributionEmployee ?? 0,
      emp.savingsFundContribution ?? 0,
      taxYear
    )
    return {
      employeeId: emp.id,
      baseSalary: emp.grossMonthlySalary,
      taxAmount: result.employee.wageTax,
      aovAwwAmount: result.employee.aovAww,
      azvAmount: result.employee.azv,
      socialSecurityAmount: result.employee.aovAww + result.employee.azv,
      netPay: result.employee.netSalary,
      employerCost: emp.grossMonthlySalary + result.employer.totalContribution,
      breakdown: result,
    }
  })
}

export function calculateRunTotals(lineItems) {
  return lineItems.reduce(
    (acc, item) => {
      const bonusTotal = calculateBonusTotal(item.bonuses)
      const deductionTotal = calculateDeductionTotal(item.deductions)
      const gross = item.baseSalary + bonusTotal
      acc.totalGross += gross
      acc.totalTax += item.taxAmount
      acc.totalSS += item.socialSecurityAmount
      acc.totalDeductions += item.taxAmount + item.socialSecurityAmount + deductionTotal
      acc.totalNet += item.netPay
      acc.totalEmployerCost += item.employerCost ?? gross
      return acc
    },
    { totalGross: 0, totalTax: 0, totalSS: 0, totalDeductions: 0, totalNet: 0, totalEmployerCost: 0 }
  )
}

export function calculateYearToDate(lineItems, employeeId) {
  const empItems = lineItems.filter((li) => li.employeeId === employeeId)
  return {
    ytdGross: empItems.reduce((s, li) => s + li.baseSalary + calculateBonusTotal(li.bonuses), 0),
    ytdTax: empItems.reduce((s, li) => s + li.taxAmount, 0),
    ytdAovAww: empItems.reduce((s, li) => s + (li.aovAwwAmount ?? li.socialSecurityAmount * 0.7576), 0),
    ytdAzv: empItems.reduce((s, li) => s + (li.azvAmount ?? li.socialSecurityAmount * 0.2424), 0),
    ytdSS: empItems.reduce((s, li) => s + li.socialSecurityAmount, 0),
    ytdNet: empItems.reduce((s, li) => s + li.netPay, 0),
  }
}

function ageFromDob(dateOfBirth) {
  if (!dateOfBirth) return 30
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}
