/**
 * MapAble Node Network — deliberately local, deterministic control-plane model.
 * No node grants itself rights by registration. Auth, consent, credentials,
 * delegate scope, tenant isolation and human approval must be enforced by
 * existing MapAble server services before a node is invoked.
 */
import { z } from "zod";

export const nodeRoleSchema = z.enum([
  "gateway", "identity", "policy", "evidence", "compute", "review", "projection"
]);
export const nodeDataClassSchema = z.enum(["public", "operational", "restricted"]);
export const nodeStatusSchema = z.enum(["existing_adapter", "candidate", "research_only"]);

export const nodeSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-z0-9.-]+$/),
  role: nodeRoleSchema,
  domain: z.string().min(2),
  status: nodeStatusSchema,
  owner: z.string().min(2),
  existingCodeRef: z.string().min(5),
  maxDataClass: nodeDataClassSchema,
  permittedOperations: z.array(z.string()).min(1),
  outwardEvents: z.array(z.string()),
  mayActForParticipant: z.literal(false),
  aiCanApprove: z.literal(false),
  crossTenantRead: z.literal(false)
});

export type MapAbleNode = z.infer<typeof nodeSchema>;

export const MAPABLE_NODES: readonly MapAbleNode[] = [
  {
    id: "gateway.edge",
    role: "gateway", domain: "core", status: "existing_adapter",
    owner: "mapable-core", existingCodeRef: "apps/web/app/api",
    maxDataClass: "operational", permittedOperations: ["validate_authenticated_request", "route_to_service"],
    outwardEvents: ["ai.run_observed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "identity.adid-bridge",
    role: "identity", domain: "identity", status: "candidate",
    owner: "adid-federation", existingCodeRef: "apps/web/lib/auth",
    maxDataClass: "restricted", permittedOperations: ["validate_verified_issuer", "resolve_scoped_grant"],
    outwardEvents: [], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "policy.consent-authority",
    role: "policy", domain: "core", status: "existing_adapter",
    owner: "mapable-core", existingCodeRef: "apps/web/lib/consent/require-consent.ts",
    maxDataClass: "restricted", permittedOperations: ["check_consent", "check_delegation", "apply_kill_switch"],
    outwardEvents: ["consent.withdrawal_observed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "evidence.access-intelligence",
    role: "evidence", domain: "access", status: "existing_adapter",
    owner: "access-intelligence", existingCodeRef: "apps/web/lib/access/intelligence-next",
    maxDataClass: "operational", permittedOperations: ["read_access_evidence", "create_review_candidate"],
    outwardEvents: ["access.evidence_candidate_detected"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "evidence.provider-finder",
    role: "evidence", domain: "providers", status: "existing_adapter",
    owner: "provider-finder", existingCodeRef: "apps/web/lib/ndis/list-providers-source.ts",
    maxDataClass: "public", permittedOperations: ["read_public_provider_register", "label_provenance"],
    outwardEvents: ["ai.run_observed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "evidence.worker-screening",
    role: "evidence", domain: "workers", status: "candidate",
    owner: "worker-screening", existingCodeRef: "apps/web/intelligence/capacity",
    maxDataClass: "restricted", permittedOperations: ["request_authorised_screening_check", "return_verified_status_or_unknown"],
    outwardEvents: [], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "evidence.ndis-policy",
    role: "evidence", domain: "policy", status: "candidate",
    owner: "policy-advisor", existingCodeRef: "apps/web/lib/ndis",
    maxDataClass: "public", permittedOperations: ["retrieve_source_grounded_guidance", "mark_law_version"],
    outwardEvents: ["ai.run_observed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "evidence.accessibooks",
    role: "evidence", domain: "accessibooks", status: "candidate",
    owner: "accessibooks", existingCodeRef: "docs/mobile-web-integration.md",
    maxDataClass: "restricted", permittedOperations: ["resolve_app_scoped_entitlement", "return_accessible_catalogue_metadata"],
    outwardEvents: [], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "compute.careos",
    role: "compute", domain: "care", status: "existing_adapter",
    owner: "careos", existingCodeRef: "apps/web/intelligence/network",
    maxDataClass: "operational", permittedOperations: ["create_draft_plan", "explain_options", "request_human_review"],
    outwardEvents: ["ai.draft_prepared", "ai.review_required"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "compute.ai-gateway",
    role: "compute", domain: "core", status: "existing_adapter",
    owner: "ai-platform", existingCodeRef: "apps/web/lib/ai/platform/models/gateway.ts",
    maxDataClass: "operational", permittedOperations: ["execute_allowlisted_capability"],
    outwardEvents: ["ai.run_observed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "review.human-queue",
    role: "review", domain: "core", status: "existing_adapter",
    owner: "human-review", existingCodeRef: "apps/web/lib/ai/platform/human-review/contracts.ts",
    maxDataClass: "restricted", permittedOperations: ["route_to_authorised_reviewer", "record_independent_decision"],
    outwardEvents: ["ai.review_required", "access.change_reviewed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  },
  {
    id: "projection.kafka-relay",
    role: "projection", domain: "core", status: "candidate",
    owner: "ai-operations", existingCodeRef: "apps/web/lib/ai/fabric/event-projection.ts",
    maxDataClass: "operational", permittedOperations: ["publish_outbox_metadata", "update_derived_view"],
    outwardEvents: ["ai.run_observed"], mayActForParticipant: false, aiCanApprove: false, crossTenantRead: false
  }
] as const;

export const DISTRIBUTED_NODE_GRAPH: ReadonlyArray<readonly [string, string]> = [
  ["gateway.edge", "identity.adid-bridge"],
  ["gateway.edge", "policy.consent-authority"],
  ["policy.consent-authority", "evidence.access-intelligence"],
  ["policy.consent-authority", "evidence.provider-finder"],
  ["policy.consent-authority", "evidence.worker-screening"],
  ["policy.consent-authority", "evidence.ndis-policy"],
  ["policy.consent-authority", "evidence.accessibooks"],
  ["policy.consent-authority", "compute.careos"],
  ["compute.careos", "compute.ai-gateway"],
  ["compute.careos", "review.human-queue"],
  ["evidence.access-intelligence", "review.human-queue"],
  ["review.human-queue", "projection.kafka-relay"]
] as const;

export function validateNodeNetwork(nodes: readonly MapAbleNode[] = MAPABLE_NODES) {
  const ids = new Set(nodes.map((node) => node.id));
  if (ids.size !== nodes.length) throw new Error("DUPLICATE_NODE_ID");
  for (const node of nodes) nodeSchema.parse(node);
  for (const [from, to] of DISTRIBUTED_NODE_GRAPH) {
    if (!ids.has(from) || !ids.has(to)) throw new Error("UNKNOWN_NODE_EDGE");
  }
  return { nodes: nodes.length, connections: DISTRIBUTED_NODE_GRAPH.length };
}

/** Cross-app candidate nodes must not be routed as if federation is live. */
export function routeNodeTask(input: {
  targetNodeId: string;
  authenticated: boolean;
  consentVerified: boolean;
  permissionVerified: boolean;
  subjectMapped: boolean;
  featureEnabled: boolean;
}): { allowed: boolean; reason: string } {
  const node = MAPABLE_NODES.find((candidate) => candidate.id === input.targetNodeId);
  if (!node) return { allowed: false, reason: "node_not_found" };
  if (!input.featureEnabled) return { allowed: false, reason: "feature_disabled" };
  if (!input.authenticated) return { allowed: false, reason: "authentication_required" };
  if (!input.permissionVerified) return { allowed: false, reason: "permission_required" };
  if (!input.consentVerified) return { allowed: false, reason: "consent_required" };
  if (!input.subjectMapped) return { allowed: false, reason: "subject_mapping_unverified" };
  if (node.status !== "existing_adapter") return { allowed: false, reason: "integration_unverified" };
  return { allowed: true, reason: "routing_prerequisites_satisfied" };
}
