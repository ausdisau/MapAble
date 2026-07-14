"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/app/lib/utils";

const OPS_LINKS = [
  { href: "/admin", label: "Command centre" },
  { href: "/admin/ops/participants", label: "Participants" },
  { href: "/admin/ops/workers", label: "Workers" },
  { href: "/admin/ops/bookings", label: "Bookings" },
  { href: "/admin/ops/safeguarding", label: "Safeguarding" },
  { href: "/admin/ops/trust-safety", label: "Trust & safety" },
  { href: "/admin/engagement", label: "Engagement" },
  { href: "/admin/ops/billing", label: "Billing" },
  { href: "/admin/ops/compliance", label: "Compliance" },
  { href: "/admin/ops/agent-runs", label: "Agent runs" },
  { href: "/admin/open-data", label: "Open data" },
  { href: "/admin/ndis-provider-ingestion", label: "NDIS ingestion" },
  { href: "/admin/disaster-recovery", label: "Disaster recovery" },
  { href: "/admin/accessibility-accreditation", label: "Accreditation" },
  { href: "/admin/evidence-automation", label: "Evidence" },
  { href: "/admin/government-reporting", label: "Gov reporting" },
];

const LEGACY_LINKS = [
  { href: "/admin/participants", label: "Participants (legacy)" },
  { href: "/admin/organisations", label: "Organisations" },
  { href: "/admin/bookings", label: "Bookings (legacy)" },
  { href: "/admin/consents", label: "Consents" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/audit-events", label: "Audit events" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/service-ops", label: "Service ops" },
  { href: "/admin/care", label: "Care" },
  { href: "/admin/transport", label: "Transport" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/workers", label: "Workers (legacy)" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/drivers", label: "Drivers" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/job-applications", label: "Applications" },
  { href: "/admin/provider-capacity", label: "Capacity" },
  { href: "/admin/matching", label: "Matching" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/ai-evaluation", label: "AI evaluation" },
  { href: "/research", label: "Research gov" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/contracts", label: "Contracts" },
  { href: "/admin/ai-matching", label: "AI matching" },
  { href: "/admin/fairness", label: "Fairness" },
  { href: "/admin/reporting", label: "Reporting" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/ndia-readiness", label: "NDIA readiness" },
  { href: "/admin/compliance", label: "Compliance (legacy)" },
  { href: "/admin/security-readiness", label: "Security" },
  { href: "/admin/launch-readiness", label: "Launch" },
  { href: "/admin/dispatch", label: "Dispatch" },
  { href: "/admin/backup-recovery", label: "Backup recovery" },
  { href: "/admin/continuity-intelligence", label: "Continuity" },
  { href: "/admin/workers/trust-passport", label: "Trust passport" },
  { href: "/admin/provider-quality", label: "Quality" },
  { href: "/admin/ai-governance", label: "AI gov" },
  { href: "/admin/partner-sandbox", label: "Sandbox" },
  { href: "/admin/board-reporting", label: "Board" },
  { href: "/admin/community-governance", label: "Governance" },
  { href: "/admin/payment-reconciliation", label: "Reconcile" },
  { href: "/admin/operator-dispatch", label: "Op dispatch" },
  { href: "/admin/mobile-release", label: "Mobile" },
  { href: "/admin/provider-onboarding", label: "Onboarding" },
  { href: "/admin/plan-manager-pilot", label: "PM pilot" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/public-beta", label: "Beta" },
  { href: "/admin/social-impact", label: "Impact" },
  { href: "/admin/scale-plan", label: "Scale" },
  { href: "/admin/ndia-pilot", label: "NDIA pilot" },
  { href: "/admin/app-store-release", label: "App store" },
  { href: "/admin/transport-network", label: "Network" },
  { href: "/admin/settlement-batches", label: "Settlement" },
  { href: "/admin/national-insights", label: "National" },
  { href: "/admin/api-versioning", label: "API ver" },
  { href: "/admin/sla-reporting", label: "SLA" },
  { href: "/admin/grant-reporting", label: "Grants" },
  { href: "/admin/security-audit-packs", label: "Audit" },
  { href: "/admin/compliance-renewals", label: "Renewals" },
  { href: "/admin/data-trust-council", label: "Trust" },
  { href: "/admin/partner-marketplace", label: "Marketplace" },
  { href: "/admin/accreditation-public", label: "Accred pub" },
  { href: "/admin/ai-monitoring", label: "AI monitor" },
  { href: "/admin/public-transparency", label: "Transparency" },
  { href: "/admin/government-portals", label: "Gov portal" },
  { href: "/admin/dr-exercises", label: "DR auto" },
  { href: "/admin/national-rollout", label: "Rollout" },
  { href: "/admin/partner-billing", label: "Partner billing" },
  { href: "/admin/billing", label: "Core billing" },
  { href: "/admin/partner-api-program", label: "API program" },
  { href: "/admin/assessor-network", label: "Assessors" },
  { href: "/admin/public-decisions", label: "Decisions" },
  { href: "/admin/personal-data-vault", label: "Vault" },
  { href: "/admin/research-safe-room", label: "Research" },
  { href: "/admin/provider-benchmarking", label: "Benchmark" },
  { href: "/admin/governance-charter", label: "Charter" },
  { href: "/admin/i18n", label: "i18n" },
  { href: "/admin/longitudinal-impact", label: "Longitudinal" },
  { href: "/admin/api-certification", label: "API cert" },
  { href: "/admin/algorithm-register", label: "Algorithms" },
  { href: "/admin/oversight-board", label: "Oversight" },
  { href: "/admin/privacy-analytics", label: "PP analytics" },
  { href: "/admin/federated-research", label: "Federated" },
  { href: "/admin/provider-academy", label: "Academy" },
  { href: "/admin/data-trust-reports", label: "Trust report" },
  { href: "/admin/sustainability-plan", label: "Sustainability" },
  { href: "/admin/long-term-outcomes", label: "Outcomes" },
  { href: "/admin/national-accountability", label: "Accountability" },
  { href: "/admin/constitutional-safeguards", label: "Safeguards" },
  { href: "/admin/community-membership", label: "Membership" },
  { href: "/admin/transport-investment", label: "Investment" },
  { href: "/admin/certified-api-ecosystem", label: "API ecosystem" },
  { href: "/admin/research-federation-nodes", label: "Fed research" },
  { href: "/admin/institutional-continuity", label: "Continuity" },
  { href: "/admin/civic-audit-index", label: "Civic audit" },
  { href: "/admin/federated-accountability", label: "Fed partners" },
  { href: "/admin/institutional-permanence", label: "Permanence" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/documents", label: "Documents" },
  { href: "/admin/invoices", label: "Invoices" },
];

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const active =
    pathname === href ||
    (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/40",
        active ? "bg-[#005B7F]/10 font-black text-[#005B7F]" : "text-slate-600 hover:bg-[#F6FBFC] hover:text-[#005B7F]"
      )}
    >
      {label}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="mapable-display text-sm font-black text-[#005B7F]">Admin console</p>
          <div className="flex gap-3 text-sm font-black text-[#005B7F]">
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
          Operations
        </p>
        <ul className="mb-3 flex flex-wrap gap-1">
          {OPS_LINKS.map((link) => (
            <li key={link.href}>
              <NavLink {...link} pathname={pathname} />
            </li>
          ))}
        </ul>
        <details className="group">
          <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            More admin
          </summary>
          <ul className="mt-2 flex flex-wrap gap-1">
            {LEGACY_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink {...link} pathname={pathname} />
              </li>
            ))}
          </ul>
        </details>
      </div>
    </nav>
  );
}
