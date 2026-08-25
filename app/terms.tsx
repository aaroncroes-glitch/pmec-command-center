import { PmecLegalPage } from "@/components/pmec-legal-page";

export default function TermsOfService() {
  return <PmecLegalPage eyebrow="PMEC / LEGAL" title="Terms of service" updated="25 AUG 2026" sections={[
    { heading: "Authorized workplace use", body: "PMEC Command Center is provided for authorized PMEC workforce and business operations. Users must use only their own accounts, keep credentials secure, and follow applicable PMEC workplace policies." },
    { heading: "Role-specific access", body: "The service presents information and actions according to the user’s assigned role. Users must not attempt to access, disclose, or use information outside their authorized scope. Client-side views do not replace PMEC’s server-side authorization controls." },
    { heading: "Operational records", body: "Users are responsible for providing accurate task, time, leave, and project information. PMEC may review operational activity, correct records, and restrict access when needed to protect the service, workforce data, or business operations." },
    { heading: "Payroll boundary", body: "Any payroll workspace is a restricted HR review experience using scenario data. It does not create payment instructions, payroll approval, tax filing, or government submission authority." },
    { heading: "Availability and changes", body: "PMEC may update, maintain, or restrict the service to protect security, comply with workplace requirements, or improve operations. Continued authorized use after a published update indicates acceptance of the revised terms." },
  ]} />;
}
