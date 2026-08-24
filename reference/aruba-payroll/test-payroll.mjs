/**
 * Verification tests for Aruba payroll calculator
 * Run: node exports/aruba-payroll/test-payroll.mjs
 */
import calculateArubaPayroll from './payrollCalculator.js'

let passed = 0
let failed = 0

function assert(label, actual, expected, tolerance = 0.01) {
  const ok = Math.abs(actual - expected) <= tolerance
  if (ok) {
    console.log(`✅ ${label}: ${actual}`)
    passed++
  } else {
    console.log(`❌ ${label}: expected ${expected}, got ${actual}`)
    failed++
  }
}

console.log('=== Aruba Payroll Verification ===\n')

// Case 1: AWG 4,500/month — zero wage tax bracket
const low = calculateArubaPayroll(4500, 'monthly', 'single', 2.5, true, 30)
assert('Case 1 wageTax', low.employee.wageTax, 0)
assert('Case 1 AOV/AWW', low.employee.aovAww, 218.75)
assert('Case 1 AZV', low.employee.azv, 70)
assert('Case 1 net', low.employee.netSalary, 4211.25)

// Case 2: AWG 10,000/month — multi-bracket
const high = calculateArubaPayroll(10000, 'monthly', 'single', 2.5, true, 30)
assert('Case 2 wageTax', high.employee.wageTax, 1224)
assert('Case 2 net', high.employee.netSalary, 8308.5)
assert('Case 2 AOV ER', high.employer.aovAww, 743.75)
assert('Case 2 AZV ER', high.employer.azv, 630.42)
assert('Case 2 ZV ER (cap 70200)', high.employer.zv, 155.03)

// Case 3: Pensioner 66, 2025 AZV tiers
const pen2025 = calculateArubaPayroll(5000, 'monthly', 'single', 2.5, true, 66, 0, 0, 0, 2025)
assert('Pensioner 2025 AOV/AWW exempt', pen2025.employee.aovAww, 0)

// Case 4: Pensioner 66, 2026 AZV — 0% on first 30k
const pen2026 = calculateArubaPayroll(5000, 'monthly', 'single', 2.5, true, 66, 0, 0, 0, 2026)
assert('Pensioner 2026 AOV/AWW exempt', pen2026.employee.aovAww, 0)
assert('Pensioner 2026 AZV', pen2026.employee.azv, 249.38)
assert('Pensioner 2026 AZV < 2025', pen2025.employee.azv - pen2026.employee.azv, 125, 1)

// Case 5: SS disabled
const noSS = calculateArubaPayroll(5000, 'monthly', 'single', 2.5, false, 30)
assert('No SS: AOV=0', noSS.employee.aovAww, 0)
assert('No SS: AZV=0', noSS.employee.azv, 0)

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
process.exit(failed > 0 ? 1 : 0)
