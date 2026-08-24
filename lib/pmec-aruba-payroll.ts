import type { PmecWorkforcePerson } from "@/lib/pmec-control-workspace";

export type ArubaPayrollProfile = {
  employeeId: string;
  personnelNumber: string;
  grossMonthlySalary: number;
  age: number;
  maritalStatus: "single" | "married";
  socialSecurityEnabled: boolean;
  svbRiskPercentage: number;
  reparatietoeslag: number;
  pensionContributionAnnual: number;
  savingsFundContributionAnnual: number;
  profileStatus: "scenario" | "review";
};

export type ArubaPayrollBreakdown = {
  grossSalary: number;
  taxableBase: number;
  premieInkomen: number;
  verwervingskosten: number;
  employee: { aovAww: number; azv: number; wageTax: number; totalDeductions: number; netSalary: number };
  employer: { aovAww: number; azv: number; zv: number; ov: number; cessantia: number; totalContribution: number };
  metadata: { currency: "AWG"; taxYear: number; isPensioner: boolean; svbRiskPercentage: number };
};

export type ArubaPayrollLine = ArubaPayrollBreakdown & {
  employeeId: string;
  employeeName: string;
  department: string;
  role: string;
  personnelNumber: string;
  reviewFlags: string[];
};

export type ArubaPayrollRun = {
  period: string;
  taxYear: number;
  status: "draft";
  filingDeadline: string;
  lines: ArubaPayrollLine[];
  totals: { gross: number; employeeDeductions: number; net: number; employerCost: number; wageTax: number; aovAww: number; azv: number };
};

const AOV_AWW_LIMIT = 85_000;
const AOV_AWW_EE_RATE = 0.05;
const AOV_AWW_ER_RATE = 0.105;
const AZV_EE_RATE = 0.016;
const AZV_ER_RATE = 0.089;
const ZV_OV_LIMIT = 70_200;
const ZV_ER_RATE = 0.0265;
const TAX_FREE_ALLOWANCE = 30_000;
const ACQUISITION_COST_RATE = 0.03;
const ACQUISITION_COST_CAP = 1_500;
const SAVINGS_FUND_RATE_CAP = 0.05;
const SAVINGS_FUND_CAP = 3_360;
const PENSIONER_AGE = 65;
const CESSANTIA_ANNUAL = 40;

const round2 = (value: number) => Number(value.toFixed(2));

export const formatAwg = (value: number) => `AWG ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(value))}`;

export function calculateArubaPayroll(profile: ArubaPayrollProfile, taxYear = 2026): ArubaPayrollBreakdown {
  const annualGross = profile.grossMonthlySalary * 12;
  const isPensioner = profile.age >= PENSIONER_AGE;
  const verwervingskosten = Math.min(annualGross * ACQUISITION_COST_RATE, ACQUISITION_COST_CAP);
  const cappedSavings = Math.min(profile.savingsFundContributionAnnual, annualGross * SAVINGS_FUND_RATE_CAP, SAVINGS_FUND_CAP);
  const annualPremieIncome = Math.max(0, annualGross - verwervingskosten - profile.pensionContributionAnnual - cappedSavings);
  const cappedPremieIncome = Math.min(annualPremieIncome, AOV_AWW_LIMIT);

  const aovAwwEe = profile.socialSecurityEnabled && !isPensioner ? cappedPremieIncome * AOV_AWW_EE_RATE : 0;
  let azvEe = 0;
  if (profile.socialSecurityEnabled) {
    if (isPensioner) {
      const tierOne = Math.min(cappedPremieIncome, 30_000);
      const tierTwo = Math.max(0, cappedPremieIncome - tierOne);
      azvEe = tierOne * (taxYear >= 2026 ? 0 : 0.05) + tierTwo * 0.105;
    } else azvEe = cappedPremieIncome * AZV_EE_RATE;
  }

  const annualTaxableBase = Math.max(0, annualGross - aovAwwEe - azvEe - TAX_FREE_ALLOWANCE);
  const annualWageTax = calculateAnnualWageTax(annualTaxableBase);
  const aovAwwEr = profile.socialSecurityEnabled && !isPensioner ? cappedPremieIncome * AOV_AWW_ER_RATE : 0;
  const azvEr = profile.socialSecurityEnabled ? cappedPremieIncome * AZV_ER_RATE : 0;
  const svbBase = Math.min(annualGross, ZV_OV_LIMIT);
  const zvEr = profile.socialSecurityEnabled ? svbBase * ZV_ER_RATE : 0;
  const ovEr = profile.socialSecurityEnabled ? svbBase * (profile.svbRiskPercentage / 100) : 0;
  const cessantia = CESSANTIA_ANNUAL;
  const annualDeductions = aovAwwEe + azvEe + annualWageTax;
  const annualNet = annualGross - annualDeductions + profile.reparatietoeslag * 12;

  return {
    grossSalary: round2(annualGross / 12),
    taxableBase: round2(annualTaxableBase / 12),
    premieInkomen: round2(cappedPremieIncome / 12),
    verwervingskosten: round2(verwervingskosten / 12),
    employee: { aovAww: round2(aovAwwEe / 12), azv: round2(azvEe / 12), wageTax: round2(annualWageTax / 12), totalDeductions: round2(annualDeductions / 12), netSalary: round2(annualNet / 12) },
    employer: { aovAww: round2(aovAwwEr / 12), azv: round2(azvEr / 12), zv: round2(zvEr / 12), ov: round2(ovEr / 12), cessantia: round2(cessantia / 12), totalContribution: round2((aovAwwEr + azvEr + zvEr + ovEr + cessantia) / 12) },
    metadata: { currency: "AWG", taxYear, isPensioner, svbRiskPercentage: profile.svbRiskPercentage },
  };
}

function calculateAnnualWageTax(tableIncome: number) {
  let tax = 0;
  if (tableIncome > 34_930) tax += (Math.min(tableIncome, 63_904) - 34_930) * 0.21;
  if (tableIncome > 63_904) tax += (Math.min(tableIncome, 135_527) - 63_904) * 0.42;
  if (tableIncome > 135_527) tax += (tableIncome - 135_527) * 0.52;
  return Math.floor(tax);
}

export function buildDemoPayrollProfiles(workforce: PmecWorkforcePerson[]): ArubaPayrollProfile[] {
  return workforce.filter((person) => person.type === "Employee").map((person, index) => ({
    employeeId: person.id,
    personnelNumber: `PMEC-${String(index + 1).padStart(3, "0")}`,
    grossMonthlySalary: 4_500 + ((index * 379) % 6_600),
    age: index === 27 ? 66 : 28 + ((index * 3) % 31),
    maritalStatus: index % 3 === 0 ? "married" : "single",
    socialSecurityEnabled: true,
    svbRiskPercentage: [0.25, 0.75, 1.25, 2.5][index % 4],
    reparatietoeslag: 0,
    pensionContributionAnnual: index % 5 === 0 ? 1_200 : 0,
    savingsFundContributionAnnual: index % 7 === 0 ? 900 : 0,
    profileStatus: "scenario",
  }));
}

export function buildDraftArubaPayrollRun(workforce: PmecWorkforcePerson[], period: string): ArubaPayrollRun {
  const taxYear = Number(period.slice(0, 4));
  const people = new Map(workforce.map((person) => [person.id, person]));
  const lines = buildDemoPayrollProfiles(workforce).map((profile) => {
    const person = people.get(profile.employeeId)!;
    const breakdown = calculateArubaPayroll(profile, taxYear);
    const reviewFlags = [
      "Scenario compensation profile",
      "Reparatietoeslag requires DIMP-table review",
      ...(breakdown.metadata.isPensioner ? [`Pensioner AZV tier · ${taxYear}`] : []),
    ];
    return { ...breakdown, employeeId: person.id, employeeName: person.name, department: person.discipline, role: person.role, personnelNumber: profile.personnelNumber, reviewFlags };
  });
  const totals = lines.reduce((summary, line) => ({
    gross: summary.gross + line.grossSalary,
    employeeDeductions: summary.employeeDeductions + line.employee.totalDeductions,
    net: summary.net + line.employee.netSalary,
    employerCost: summary.employerCost + line.grossSalary + line.employer.totalContribution,
    wageTax: summary.wageTax + line.employee.wageTax,
    aovAww: summary.aovAww + line.employee.aovAww,
    azv: summary.azv + line.employee.azv,
  }), { gross: 0, employeeDeductions: 0, net: 0, employerCost: 0, wageTax: 0, aovAww: 0, azv: 0 });
  return { period, taxYear, status: "draft", filingDeadline: getDimpDeadline(period), lines, totals: Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, round2(value)])) as ArubaPayrollRun["totals"] };
}

export function getDimpDeadline(period: string) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month, 15, 12));
  return date.toISOString().slice(0, 10);
}
