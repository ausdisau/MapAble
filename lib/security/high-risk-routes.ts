/**
 * Inventory of consequential mutation / sensitive-read API routes.
 * Used for hardening prioritisation and CI documentation — not a router.
 */

export type RouteConsequence =
  | "pii_read"
  | "pii_write"
  | "consent"
  | "financial"
  | "care_assignment"
  | "transport_dispatch"
  | "admin_break_glass"
  | "encryption";

export type HighRiskRoute = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  consequence: RouteConsequence;
  zodRequired: boolean;
  tenantAssertRequired: boolean;
  notes: string;
};

export const HIGH_RISK_ROUTES: HighRiskRoute[] = [
  {
    method: "GET",
    path: "/api/billing/overview",
    consequence: "financial",
    zodRequired: false,
    tenantAssertRequired: true,
    notes: "organisationId/participantId query must be membership-scoped",
  },
  {
    method: "POST",
    path: "/api/billing/payments/[id]/refund",
    consequence: "financial",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "Refund stub — Zod + org manage assert",
  },
  {
    method: "POST",
    path: "/api/consents",
    consequence: "consent",
    zodRequired: true,
    tenantAssertRequired: false,
    notes: "Subject forced to session user",
  },
  {
    method: "POST",
    path: "/api/consent/micro",
    consequence: "consent",
    zodRequired: true,
    tenantAssertRequired: false,
    notes: "Micro-consent grant/revoke",
  },
  {
    method: "POST",
    path: "/api/data-vault",
    consequence: "pii_write",
    zodRequired: true,
    tenantAssertRequired: false,
    notes: "Export/delete request for self only",
  },
  {
    method: "POST",
    path: "/api/care/bookings/[id]/assign-worker",
    consequence: "care_assignment",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "No auto-assignment engines",
  },
  {
    method: "POST",
    path: "/api/provider/transport/trips/[tripId]/assign",
    consequence: "transport_dispatch",
    zodRequired: false,
    tenantAssertRequired: true,
    notes: "organisationId query + requireProviderOrgId",
  },
  {
    method: "POST",
    path: "/api/participant-profile",
    consequence: "encryption",
    zodRequired: true,
    tenantAssertRequired: false,
    notes: "NDIS number encryption — dedicated key required",
  },
  {
    method: "POST",
    path: "/api/admin/break-glass",
    consequence: "admin_break_glass",
    zodRequired: true,
    tenantAssertRequired: false,
    notes: "Time-boxed audited admin elevation",
  },
  {
    method: "POST",
    path: "/api/drivers",
    consequence: "transport_dispatch",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "organisationId membership assert + strict Zod",
  },
  {
    method: "POST",
    path: "/api/vehicles",
    consequence: "transport_dispatch",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "organisationId membership assert + strict Zod",
  },
  {
    method: "POST",
    path: "/api/availability",
    consequence: "care_assignment",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "organisationId membership assert + strict Zod",
  },
  {
    method: "POST",
    path: "/api/billing/integrations/xero/connect",
    consequence: "financial",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "Xero connect must prove org membership",
  },
  {
    method: "POST",
    path: "/api/care/bookings/[id]/agreement",
    consequence: "care_assignment",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "Participant acceptance of accessible service agreement",
  },
  {
    method: "POST",
    path: "/api/care/bookings/[id]/billing-handoff",
    consequence: "financial",
    zodRequired: false,
    tenantAssertRequired: true,
    notes: "Evidence → BillingServiceRecord; no NDIA submit",
  },
  {
    method: "POST",
    path: "/api/transport/quotes",
    consequence: "financial",
    zodRequired: true,
    tenantAssertRequired: true,
    notes: "First-class quote; not funding approval",
  },
  {
    method: "POST",
    path: "/api/transport/trips/[id]/billing-handoff",
    consequence: "financial",
    zodRequired: false,
    tenantAssertRequired: true,
    notes: "Completed trip → BillingServiceRecord",
  },
];
