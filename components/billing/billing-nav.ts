export type BillingNavLink = {
  href: string;
  label: string;
  exact?: boolean;
};

/** All Billing Centre workspace routes for sidebar / shell navigation. */
export const BILLING_NAV_LINKS: BillingNavLink[] = [
  { href: "/billing/overview", label: "Overview", exact: true },
  { href: "/billing/invoices", label: "Invoices" },
  { href: "/billing/service-records", label: "Service records" },
  { href: "/billing/claims", label: "Claims" },
  { href: "/billing/approvals", label: "Approvals" },
  { href: "/billing/payments", label: "Payments" },
  { href: "/billing/reconciliation", label: "Reconciliation" },
  { href: "/billing/provider-payouts", label: "Provider payouts" },
  { href: "/billing/subscriptions", label: "Subscriptions" },
  { href: "/billing/disputes", label: "Disputes" },
  { href: "/billing/credit-notes", label: "Credit notes" },
  { href: "/billing/reports", label: "Reports" },
  { href: "/billing/policy", label: "Policy" },
  { href: "/billing/integrations", label: "Integrations" },
  { href: "/billing/settings", label: "Settings" },
];
