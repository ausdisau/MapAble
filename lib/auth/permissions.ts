import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

import { isAdminRole } from "./roles";

export type Permission =
  | "profile:read:self"
  | "profile:read:any"
  | "profile:write:self"
  | "profile:write:any"
  | "accessibility:read:self"
  | "accessibility:read:any"
  | "accessibility:write:self"
  | "consent:manage:self"
  | "consent:read:any"
  | "organisation:manage"
  | "booking:create"
  | "booking:read:self"
  | "booking:read:any"
  | "booking:manage:any"
  | "notification:read:self"
  | "audit:read"
  | "admin:dashboard"
  | "admin:command-centre:read"
  | "admin:participants:read"
  | "admin:workers:read"
  | "admin:bookings:read"
  | "admin:safeguarding:read"
  | "admin:billing:read"
  | "admin:compliance:read"
  | "admin:agent-runs:read"
  | "admin:actions:write"

  | "message:read"
  | "message:send"
  | "support:create"
  | "support:read:self"
  | "support:manage:any"
  | "document:read"
  | "document:upload"
  | "funding:manage:self"
  | "funding:read:any"
  | "invoice:read:self"
  | "invoice:read:org"
  | "invoice:manage:any"
  | "finance:view"
  | "finance:review"
  | "finance:request_clarification"
  | "finance:dispute"
  | "finance:approve_for_processing"
  | "finance:prepare_payment"
  | "finance:execute_payment"
  | "finance:export_claim"
  | "provider:booking:respond"
  | "admin:operations"
  | "care:read:self"
  | "care:manage:self"
  | "care:read:org"
  | "care:manage:org"
  | "care:manage:any"
  | "care:shift:work"
  | "transport:read:self"
  | "transport:manage:self"
  | "transport:read:org"
  | "transport:manage:org"
  | "transport:manage:any"
  | "transport:drive"
  | "worker:manage:org"
  | "worker:read:any"
  | "vehicle:manage:org"
  | "vehicle:read:any"
  | "driver:manage:org"
  | "driver:read:any"
  | "availability:manage:org"
  | "jobs:read:public"
  | "jobs:manage:employer"
  | "jobs:manage:any"
  | "jobs:apply"
  | "calendar:read:self"
  | "calendar:read:org"
  | "calendar:manage:any"
  | "admin:service-ops"
  | "matching:run"
  | "matching:select"
  | "search:providers"
  | "tracking:read:self"
  | "tracking:update:driver"
  | "tracking:update:admin"
  | "timesheet:manage:org"
  | "timesheet:read:self"
  | "timesheet:approve:self"
  | "incident:create"
  | "incident:read:self"
  | "incident:manage:any"
  | "agreement:read:self"
  | "agreement:manage:org"
  | "agreement:manage:any"
  | "ndis:manage"
  | "contracts:manage"
  | "attestation:read:self"
  | "attestation:read:any"
  | "admin:analytics"
  | "driver:trips"
  | "ai_matching:run"
  | "fairness:review"
  | "verification:manage:org"
  | "verification:manage:any"
  | "ndis:pricing:manage"
  | "provider:ndia:claim"
  | "provider:ndis:claim"
  | "xero:manage"
  | "stripe:manage"
  | "route:manage"
  | "accessibility_map:read"
  | "accessibility_map:manage"
  | "ambassador:audit"
  | "coordinator:portal"
  | "plan_manager:portal"
  | "employer:ats"
  | "reporting:manage"
  | "developer:manage"
  | "compliance:manage"
  | "security:readiness"
  | "ndia:readiness"
  | "launch:readiness"
  | "dispatch:manage"
  | "provider_quality:read"
  | "ai_governance:read"
  | "partner_sandbox:manage"
  | "board:reporting"
  | "community_governance:manage"
  | "open_data:export"
  | "government_reporting:manage"
  | "tenant:manage"
  | "reconciliation:manage"
  | "operator_dispatch:manage"
  | "enterprise:console"
  | "government:portal"
  | "public_beta:manage"
  | "social_impact:read"
  | "scale_plan:manage"
  | "ndia:pilot"
  | "transparency:publish"
  | "app_store:manage"
  | "transport_network:manage"
  | "compliance_renewal:manage"
  | "settlement:manage"
  | "national_insights:publish"
  | "api_versioning:manage"
  | "sla:report"
  | "grant:report"
  | "security_audit:manage"
  | "assessor:portal"
  | "platform_status:read"
  | "data_trust:manage"
  | "partner_marketplace:manage"
  | "national_rollout:manage"
  | "partner_billing:manage"
  | "partner_api:manage"
  | "assessor_network:manage"
  | "decision_register:publish"
  | "data_vault:self"
  | "data_vault:manage"
  | "research_safe_room:manage"
  | "provider_benchmark:read"
  | "governance_charter:manage"
  | "i18n:manage"
  | "longitudinal_impact:publish"
  | "api_certification:manage"
  | "algorithm_register:publish"
  | "oversight_board:read"
  | "oversight_board:manage"
  | "privacy_analytics:run"
  | "federated_research:manage"
  | "provider_academy:enroll"
  | "data_trust_report:publish"
  | "sustainability:manage"
  | "outcomes:read"
  | "accountability:publish"
  | "safeguards:read"
  | "safeguards:manage"
  | "membership:read"
  | "membership:manage"
  | "transport_investment:read"
  | "transport_investment:manage"
  | "api_ecosystem:manage"
  | "research_federation:manage"
  |     "continuity:manage"
  | "civic_audit:publish"
  | "federation_partner:manage"
  | "case:read:self"
  | "case:read:any"
  | "case:manage:self"
  | "case:manage:any"
  | "case:ai:run"
  | "engagement:read:self"
  | "engagement:submit:self"
  | "engagement:manage:any"
  | "engagement:provider:read"
  | "billing:view_own"
  | "billing:view_delegated"
  | "billing:view_provider"
  | "billing:view_all"
  | "billing:create_draft"
  | "billing:edit_draft"
  | "billing:approve_participant"
  | "billing:approve_provider"
  | "billing:issue_invoice"
  | "billing:void_invoice"
  | "billing:create_credit_note"
  | "billing:record_payment"
  | "billing:reconcile"
  | "billing:manage_payouts"
  | "billing:manage_policy"
  | "billing:manage_integrations"
  | "billing:export"
  | "billing:audit";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  participant: [
    "profile:read:self",
    "message:read",
    "message:send",
    "support:create",
    "support:read:self",
    "document:read",
    "document:upload",
    "funding:manage:self",
    "invoice:read:self",
    "finance:view",
    "finance:review",
    "finance:request_clarification",
    "finance:dispute",
    "finance:approve_for_processing",
    "profile:write:self",
    "accessibility:read:self",
    "accessibility:write:self",
    "consent:manage:self",
    "booking:create",
    "booking:read:self",
    "notification:read:self",
    "care:read:self",
    "care:manage:self",
    "transport:read:self",
    "transport:manage:self",
    "jobs:read:public",
    "jobs:apply",
    "calendar:read:self",
    "search:providers",
    "tracking:read:self",
    "timesheet:read:self",
    "timesheet:approve:self",
    "incident:create",
    "incident:read:self",
    "agreement:read:self",
    "attestation:read:self",
    "data_vault:self",
    "outcomes:read",
    "safeguards:read",
    "membership:read",
    "transport_investment:read",
    "case:read:self",
    "engagement:read:self",
    "engagement:submit:self",
    "billing:view_own",
    "billing:approve_participant",
  ],
  family_member: [
    "profile:read:self",
    "booking:read:self",
    "transport:read:self",
    "notification:read:self",
    "engagement:read:self",
    "engagement:submit:self",
    "billing:view_delegated",
    "billing:approve_participant",
  ],
  support_coordinator: [
    "profile:read:any",
    "booking:read:any",
    "notification:read:self",
    "coordinator:portal",
    "document:read",
    "invoice:read:self",
    "case:read:any",
    "case:manage:self",
    "case:ai:run",
    "admin:command-centre:read",
    "admin:participants:read",
    "admin:bookings:read",
    "billing:view_delegated",
  ],
  support_worker: [
    "booking:read:any",
    "notification:read:self",
    "care:shift:work",
    "calendar:read:org",
    "timesheet:manage:org",
    "incident:create",
    "billing:view_own",
  ],
  provider_admin: [
    "booking:read:any",
    "notification:read:self",
    "message:read",
    "message:send",
    "support:create",
    "document:read",
    "document:upload",
    "invoice:read:org",
    "provider:booking:respond",
    "care:read:org",
    "care:manage:org",
    "worker:manage:org",
    "availability:manage:org",
    "calendar:read:org",
    "timesheet:manage:org",
    "agreement:manage:org",
    "incident:create",
    "verification:manage:org",
    "enterprise:console",
    "operator_dispatch:manage",
    "provider_academy:enroll",
    "provider:ndia:claim",
    "provider:ndis:claim",
    "engagement:provider:read",
    "billing:view_provider",
    "billing:create_draft",
    "billing:edit_draft",
    "billing:approve_provider",
    "billing:issue_invoice",
    "billing:export",
  ],
  transport_operator: [
    "booking:read:any",
    "notification:read:self",
    "message:read",
    "message:send",
    "support:create",
    "provider:booking:respond",
    "transport:read:org",
    "transport:manage:org",
    "vehicle:manage:org",
    "driver:manage:org",
    "availability:manage:org",
    "calendar:read:org",
    "operator_dispatch:manage",
  ],
  driver: [
    "booking:read:any",
    "notification:read:self",
    "transport:drive",
    "driver:trips",
    "tracking:update:driver",
    "incident:create",
    "calendar:read:org",
  ],
  employer: [
    "notification:read:self",
    "jobs:manage:employer",
    "employer:ats",
    "calendar:read:org",
    "message:read",
  ],
  plan_manager: [
    "plan_manager:portal",
    "invoice:read:self",
    "finance:view",
    "finance:review",
    "finance:request_clarification",
    "finance:prepare_payment",
    "finance:export_claim",
    "booking:read:any",
    "notification:read:self",
    "case:read:any",
    "case:manage:self",
    "case:ai:run",
    "admin:command-centre:read",
    "admin:billing:read",
    "admin:bookings:read",
    "billing:view_delegated",
    "billing:export",
  ],
  ambassador: [
    "profile:read:self",
    "profile:write:self",
    "notification:read:self",
    "accessibility_map:read",
    "ambassador:audit",
  ],
  mapable_admin: [
    "profile:read:any",
    "profile:write:any",
    "accessibility:read:any",
    "consent:read:any",
    "organisation:manage",
    "booking:read:any",
    "booking:manage:any",
    "audit:read",
    "admin:dashboard",
    "admin:operations",
    "message:read",
    "message:send",
    "support:manage:any",
    "document:read",
    "document:upload",
    "funding:read:any",
    "invoice:manage:any",
    "notification:read:self",
    "care:manage:any",
    "transport:manage:any",
    "worker:read:any",
    "vehicle:read:any",
    "driver:read:any",
    "jobs:manage:any",
    "calendar:manage:any",
    "admin:service-ops",
    "matching:run",
    "matching:select",
    "search:providers",
    "tracking:update:admin",
    "incident:manage:any",
    "agreement:manage:any",
    "ndis:manage",
    "contracts:manage",
    "attestation:read:any",
    "ai_matching:run",
    "fairness:review",
    "verification:manage:any",
    "ndis:pricing:manage",
    "provider:ndia:claim",
    "provider:ndis:claim",
    "xero:manage",
    "stripe:manage",
    "route:manage",
    "accessibility_map:manage",
    "ambassador:audit",
    "reporting:manage",
    "developer:manage",
    "compliance:manage",
    "security:readiness",
    "ndia:readiness",
    "admin:analytics",
    "engagement:manage:any",
    "launch:readiness",
    "dispatch:manage",
    "provider_quality:read",
    "ai_governance:read",
    "partner_sandbox:manage",
    "board:reporting",
    "community_governance:manage",
    "open_data:export",
    "government_reporting:manage",
    "tenant:manage",
    "reconciliation:manage",
    "operator_dispatch:manage",
    "enterprise:console",
    "government:portal",
    "public_beta:manage",
    "social_impact:read",
    "scale_plan:manage",
    "ndia:pilot",
    "transparency:publish",
    "app_store:manage",
    "transport_network:manage",
    "compliance_renewal:manage",
    "settlement:manage",
    "national_insights:publish",
    "api_versioning:manage",
    "sla:report",
    "grant:report",
    "security_audit:manage",
    "assessor:portal",
    "platform_status:read",
    "data_trust:manage",
    "partner_marketplace:manage",
    "national_rollout:manage",
    "partner_billing:manage",
    "partner_api:manage",
    "assessor_network:manage",
    "decision_register:publish",
    "data_vault:manage",
    "research_safe_room:manage",
    "provider_benchmark:read",
    "governance_charter:manage",
    "i18n:manage",
    "longitudinal_impact:publish",
    "api_certification:manage",
    "algorithm_register:publish",
    "oversight_board:read",
    "oversight_board:manage",
    "privacy_analytics:run",
    "federated_research:manage",
    "provider_academy:enroll",
    "data_trust_report:publish",
    "sustainability:manage",
    "outcomes:read",
    "accountability:publish",
    "safeguards:read",
    "safeguards:manage",
    "membership:read",
    "membership:manage",
    "transport_investment:read",
    "transport_investment:manage",
    "api_ecosystem:manage",
    "research_federation:manage",
    "continuity:manage",
    "civic_audit:publish",
    "federation_partner:manage",
    "case:read:any",
    "case:manage:any",
    "case:ai:run",
    "admin:command-centre:read",
    "admin:participants:read",
    "admin:workers:read",
    "admin:bookings:read",
    "admin:safeguarding:read",
    "admin:billing:read",
    "admin:compliance:read",
    "admin:agent-runs:read",
    "admin:actions:write",
    "billing:view_all",
    "billing:create_draft",
    "billing:edit_draft",
    "billing:approve_participant",
    "billing:approve_provider",
    "billing:issue_invoice",
    "billing:void_invoice",
    "billing:create_credit_note",
    "billing:record_payment",
    "billing:reconcile",
    "billing:manage_payouts",
    "billing:manage_policy",
    "billing:manage_integrations",
    "billing:export",
    "billing:audit",
  ],
};

/** Back-of-house admin API/page permissions */
export const ADMIN_SCOPE_PERMISSIONS: Permission[] = [
  "admin:command-centre:read",
  "admin:participants:read",
  "admin:workers:read",
  "admin:bookings:read",
  "admin:safeguarding:read",
  "admin:billing:read",
  "admin:compliance:read",
  "admin:agent-runs:read",
  "admin:actions:write",
];

export function hasAnyAdminScopePermission(
  role: UserRole | MapAbleUserRole
): boolean {
  if (isAdminRole(role)) return true;
  return ADMIN_SCOPE_PERMISSIONS.some((p) =>
    getPermissionsForRole(role).includes(p)
  );
}

export function getPermissionsForRole(
  role: UserRole | MapAbleUserRole
): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

export function hasPermission(
  role: UserRole | MapAbleUserRole,
  permission: Permission
): boolean {
  if (isAdminRole(role)) return true;
  return getPermissionsForRole(role).includes(permission);
}

export function canViewParticipantProfile(
  actorRole: UserRole | MapAbleUserRole,
  actorId: string,
  participantUserId: string
): boolean {
  if (actorId === participantUserId) return true;
  if (isAdminRole(actorRole)) return true;
  if (
    actorRole === "support_coordinator" ||
    actorRole === "family_member"
  ) {
    return true;
  }
  return false;
}
