import { PmecLegalPage } from "@/components/pmec-legal-page";

export default function PrivacyPolicy() {
  return <PmecLegalPage eyebrow="PMEC / LEGAL" title="Privacy policy" updated="25 AUG 2026" sections={[
    { heading: "Purpose", body: "PMEC Command Center supports authorized PMEC employees, Project Managers, contractors, and HR managers with workplace coordination, task delivery, time, leave, and workforce operations." },
    { heading: "Information processed", body: "The service processes account identifiers and authentication information through Clerk, access-role and permission information through PMEC’s Neon access-control service, and operational workspace data through the PMEC application services. HR payroll views are access-controlled, scenario-only review tools and do not authorize payments or government filings." },
    { heading: "How information is used", body: "PMEC uses this information to authenticate authorized users, apply role-specific access controls, coordinate assigned work, record operational activity, support workforce planning, and protect the security and reliability of the service." },
    { heading: "Access and sharing", body: "Access is restricted by role and business need. Project Managers and employees do not receive payroll authorization. PMEC does not sell personal information. Service providers process information only to provide authentication, hosting, database, and application-support capabilities." },
    { heading: "Retention and questions", body: "Operational records are retained according to PMEC’s business, employment, and legal requirements. Individuals should contact their PMEC administrator to request access, correction, or additional information about their workplace data." },
  ]} />;
}
