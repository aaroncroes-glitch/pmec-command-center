/**
 * Aruba Payroll Export Module — CSV, VZL XML, Jaaropgaaf, Monthly DIMP declaration
 * Standalone (browser or Node). No React dependencies.
 */

// ─── CSV ────────────────────────────────────────────────────────────────────

export function exportToCSV(data, filename = 'export.csv') {
  if (!data?.length) return
  const headers = Object.keys(data[0])
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = data.map((row) => headers.map((h) => escape(row[h])).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  downloadBlob(csv, filename, 'text/csv;charset=utf-8')
}

/** Per-employee payroll run export */
export function exportPayrollRunCSV(lineItems, employees, period) {
  const data = lineItems.map((item) => {
    const emp = employees.find((e) => e.id === item.employeeId)
    const bonusTotal = (item.bonuses || []).reduce((s, b) => s + (b.amount || 0), 0)
    const gross = item.baseSalary + bonusTotal
    return {
      Personeelsnummer: emp?.personeelsnummer ?? '',
      Werknemersnaam: emp ? `${emp.firstName} ${emp.lastName}` : '',
      Afdeling: emp?.department ?? '',
      Periode: period,
      'Bruto Salaris': gross.toFixed(2),
      Loonbelasting: item.taxAmount.toFixed(2),
      'AOV/AWW': (item.aovAwwAmount ?? splitSS(item.socialSecurityAmount).aovAww).toFixed(2),
      AZV: (item.azvAmount ?? splitSS(item.socialSecurityAmount).azv).toFixed(2),
      'Netto Salaris': item.netPay.toFixed(2),
    }
  })
  exportToCSV(data, `payroll-${period}.csv`)
}

/** Monthly DIMP declaration CSV (Maandelijkse Aangifte) */
export function exportMonthlyDeclarationCSV(lineItems, employees, period) {
  return exportPayrollRunCSV(lineItems, employees, period)
}

/** Annual tax report CSV */
export function exportTaxReportCSV(employeeSummary, selectedYear) {
  const data = employeeSummary.map((row) => ({
    Werknemer: `${row.employee.firstName} ${row.employee.lastName}`,
    Jaar: selectedYear,
    'Bruto Jaarloon': row.gross.toFixed(2),
    'Ingehouden Loonbelasting': row.tax.toFixed(2),
    'AOV/AWW Premie': (row.aovAww ?? splitSS(row.ss).aovAww).toFixed(2),
    'AZV Premie': (row.azv ?? splitSS(row.ss).azv).toFixed(2),
    'Netto Jaarloon': row.net.toFixed(2),
    'Effectief Tarief': row.gross > 0 ? `${((row.tax / row.gross) * 100).toFixed(1)}%` : '0.0%',
  }))
  exportToCSV(data, `tax-report-${selectedYear}.csv`)
}

// ─── VZL XML (Verzamelloonstaat) ────────────────────────────────────────────

/**
 * Generate Verzamelloonstaat XML for DIMP annual filing.
 * Deadline: March 31 of the following year.
 *
 * NOTE: Validate output against the official DIMP/BO Impuesto portal schema
 * before production submission. Field names follow common Aruba payroll practice.
 */
export function generateVZLXml(employeeSummary, employer, selectedYear) {
  const timestamp = new Date().toISOString().split('T')[0]
  const rows = employeeSummary
    .map((row) => {
      const emp = row.employee
      const ss = splitSS(row.ss, row.aovAww, row.azv)
      const dob = formatDateXml(emp?.dateOfBirth)
      return `    <Werknemer>
      <Persoonsnummer>${xmlEscape(emp?.nationalId || emp?.identiteitsnummer || '')}</Persoonsnummer>
      <Naam>${xmlEscape(`${emp?.lastName || ''}, ${emp?.firstName || ''}`)}</Naam>
      <Geboortedatum>${dob}</Geboortedatum>
      <BrutoJaarloon>${row.gross.toFixed(2)}</BrutoJaarloon>
      <IngehoudeLoonbelasting>${row.tax.toFixed(2)}</IngehoudeLoonbelasting>
      <AOV_AWW_Premie>${ss.aovAww.toFixed(2)}</AOV_AWW_Premie>
      <AZV_Premie>${ss.azv.toFixed(2)}</AZV_Premie>
      <NettoJaarloon>${row.net.toFixed(2)}</NettoJaarloon>
    </Werknemer>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Verzamelloonstaat xmlns="urn:dimp:aruba:vzl:1.0">
  <Werkgever>
    <Naam>${xmlEscape(employer?.name || employer?.legalName || 'Werkgever')}</Naam>
    <SchakelNummer>${xmlEscape(employer?.taxId || employer?.tradeRegisterNumber || '')}</SchakelNummer>
    <Periode>${selectedYear}</Periode>
    <AangifteDatum>${timestamp}</AangifteDatum>
  </Werkgever>
  <Werknemers>
${rows}
  </Werknemers>
</Verzamelloonstaat>`
}

export function downloadVZLXml(employeeSummary, employer, selectedYear) {
  const xml = generateVZLXml(employeeSummary, employer, selectedYear)
  downloadBlob(xml, `VZL-verzamelloonstaat-${selectedYear}.xml`, 'application/xml')
}

// ─── Jaaropgaaf (Annual employee statement) ─────────────────────────────────

export function generateJaaropgaafHtml(row, selectedYear, employer) {
  const emp = row.employee
  const ss = splitSS(row.ss, row.aovAww, row.azv)
  const effRate = row.gross > 0 ? ((row.tax / row.gross) * 100).toFixed(1) : '0.0'
  const marital = emp?.maritalStatus === 'married' ? 'Gehuwd (Cat. 1)' : 'Ongehuwd (Cat. 2)'

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8" />
  <title>Jaaropgaaf ${selectedYear} — ${emp.firstName} ${emp.lastName}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; max-width: 680px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
    .sub { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
    .section { border-top: 2px solid #111; margin-top: 24px; padding-top: 16px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
    .label { font-size: 12px; color: #555; }
    .value { font-size: 12px; font-weight: bold; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; margin-top: 8px; border-top: 2px solid #111; }
    .total-label { font-size: 14px; font-weight: 900; text-transform: uppercase; }
    .total-value { font-size: 16px; font-weight: 900; }
    .footer { margin-top: 40px; font-size: 10px; color: #999; }
  </style>
</head>
<body>
  <h1>Jaaropgaaf ${selectedYear}</h1>
  <div class="sub">Departamento di Impuesto (DIMP) — Aruba</div>
  <div class="section">
    <div class="sub" style="margin-bottom:8px">Werkgever</div>
    <div class="row"><span class="label">Naam</span><span class="value">${htmlEscape(employer?.name || '—')}</span></div>
    <div class="row"><span class="label">Fiscaal Nummer</span><span class="value">${htmlEscape(employer?.taxId || '—')}</span></div>
  </div>
  <div class="section">
    <div class="sub" style="margin-bottom:8px">Werknemer</div>
    <div class="row"><span class="label">Naam</span><span class="value">${htmlEscape(`${emp.firstName} ${emp.lastName}`)}</span></div>
    <div class="row"><span class="label">Persoonsnummer</span><span class="value">${htmlEscape(emp.nationalId || emp.identiteitsnummer || '—')}</span></div>
    <div class="row"><span class="label">Geboortedatum</span><span class="value">${htmlEscape(formatDateNl(emp.dateOfBirth))}</span></div>
    <div class="row"><span class="label">Burgerlijke Staat</span><span class="value">${marital}</span></div>
    <div class="row"><span class="label">Maanden In Dienst</span><span class="value">${row.monthsActive ?? '—'}</span></div>
  </div>
  <div class="section">
    <div class="sub" style="margin-bottom:8px">Jaarinkomen ${selectedYear}</div>
    <div class="row"><span class="label">Bruto Jaarloon</span><span class="value">AWG ${row.gross.toFixed(2)}</span></div>
    <div class="row"><span class="label">Ingehouden Loonbelasting</span><span class="value">AWG ${row.tax.toFixed(2)}</span></div>
    <div class="row"><span class="label">AOV/AWW Premie Werknemer</span><span class="value">AWG ${ss.aovAww.toFixed(2)}</span></div>
    <div class="row"><span class="label">AZV Premie Werknemer</span><span class="value">AWG ${ss.azv.toFixed(2)}</span></div>
    <div class="row"><span class="label">Effectief Belastingtarief</span><span class="value">${effRate}%</span></div>
    <div class="total-row">
      <span class="total-label">Netto Jaarloon</span>
      <span class="total-value">AWG ${row.net.toFixed(2)}</span>
    </div>
  </div>
  <div class="footer">
    Gegenereerd op ${new Date().toLocaleDateString('nl-NL')}.<br/>
    Jaaropgaaf voor persoonlijke belastingaangifte. Bewaar voor uw administratie.
  </div>
</body>
</html>`
}

export function downloadJaaropgaaf(row, selectedYear, employer) {
  const html = generateJaaropgaafHtml(row, selectedYear, employer)
  downloadBlob(html, `jaaropgaaf-${selectedYear}-${row.employee.lastName}.html`, 'text/html')
}

// ─── Aggregation helpers ────────────────────────────────────────────────────

/** Aggregate finalized payroll line items into annual employee summary */
export function aggregateEmployeeSummary(lineItems, employees, payrollRuns, selectedYear, employeeIdFilter = null) {
  const yearRuns = payrollRuns.filter((r) => r.period.startsWith(`${selectedYear}-`))
  const yearRunIds = new Set(yearRuns.map((r) => r.id))
  const grouped = {}

  lineItems
    .filter((li) => yearRunIds.has(li.runId))
    .forEach((li) => {
      if (employeeIdFilter != null && li.employeeId !== employeeIdFilter) return
      if (!grouped[li.employeeId]) {
        grouped[li.employeeId] = { gross: 0, tax: 0, ss: 0, aovAww: 0, azv: 0, net: 0, byPeriod: {}, months: new Set() }
      }
      const bonusTotal = (li.bonuses || []).reduce((s, b) => s + (b.amount || 0), 0)
      const gross = li.baseSalary + bonusTotal
      const aov = li.aovAwwAmount ?? li.socialSecurityAmount * 0.7576
      const azv = li.azvAmount ?? li.socialSecurityAmount * 0.2424

      grouped[li.employeeId].gross += gross
      grouped[li.employeeId].tax += li.taxAmount
      grouped[li.employeeId].ss += li.socialSecurityAmount
      grouped[li.employeeId].aovAww += aov
      grouped[li.employeeId].azv += azv
      grouped[li.employeeId].net += li.netPay

      const run = yearRuns.find((r) => r.id === li.runId)
      if (run) {
        grouped[li.employeeId].months.add(run.period)
        grouped[li.employeeId].byPeriod[run.period] = grouped[li.employeeId].byPeriod[run.period] || { gross: 0, tax: 0, ss: 0, net: 0 }
        grouped[li.employeeId].byPeriod[run.period].gross += gross
        grouped[li.employeeId].byPeriod[run.period].tax += li.taxAmount
        grouped[li.employeeId].byPeriod[run.period].ss += li.socialSecurityAmount
        grouped[li.employeeId].byPeriod[run.period].net += li.netPay
      }
    })

  return Object.entries(grouped)
    .map(([empId, data]) => {
      const employee = employees.find((e) => e.id === parseInt(empId) || e.id === empId)
      return { employee, ...data, monthsActive: data.months.size }
    })
    .filter((row) => row.employee)
}

/** DIMP monthly filing deadline: 15th of month following payroll period */
export function getDimpDeadline(period) {
  const [year, month] = period.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return new Date(nextYear, nextMonth - 1, 15)
}

export function getFilingStatus(period, isFinalized) {
  if (!isFinalized) return 'draft'
  const deadline = getDimpDeadline(period)
  const today = new Date()
  if (today > deadline) return 'overdue'
  const sevenDays = new Date(today)
  sevenDays.setDate(today.getDate() + 7)
  if (deadline <= sevenDays) return 'due-soon'
  return 'on-track'
}

// ─── Internals ──────────────────────────────────────────────────────────────

/** Split combined SS into AOV/AWW + AZV when stored separately unavailable */
function splitSS(totalSS, aovAww, azv) {
  if (aovAww != null && azv != null) return { aovAww, azv }
  // Exact ratio: 5% AOV/AWW + 1.6% AZV = 6.6% total → 5/6.6 ≈ 0.7576, 1.6/6.6 ≈ 0.2424
  return { aovAww: totalSS * 0.7576, azv: totalSS * 0.2424 }
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function htmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function formatDateXml(d) {
  if (!d) return ''
  const date = new Date(d)
  return date.toISOString().split('T')[0]
}

function formatDateNl(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL')
}

function downloadBlob(content, filename, mimeType) {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return
  }
  // Node.js fallback
  import('fs').then(({ writeFileSync }) => writeFileSync(filename, content, 'utf8'))
}
