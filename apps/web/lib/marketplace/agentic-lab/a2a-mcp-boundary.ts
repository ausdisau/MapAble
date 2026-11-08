/**
 * Proposed MapAble Core -> A2A -> MCP boundary, evaluated OFFLINE ONLY.
 * NOT an identity provider, consent database, OAuth verifier, A2A server or MCP server.
 * Data supplied to this pure evaluator MUST eventually be resolved server-side:
 * client-provided booleans and signatures are never authorisation evidence.
 */
export const REMOTE_AGENT_TRANSPORT_ENABLED = false as const;
export const MCP_EXECUTION_ENABLED = false as const;
export type PublicAgentTool =
  | "public_marketplace_catalogue.search"
  | "public_provider_evidence.read";
export type RequestedTool = PublicAgentTool |
  "provider.inquiry.send" | "worker.clearance.read" |
  "saleor.checkout.create" | "stripe.payment.capture";
export interface ResolvedCoreIdentity {
  readonly source: "server_resolved_mapable_core";
  readonly sessionAuthenticated: boolean;
  readonly humanUserId: string;
  readonly participantId: string;
  readonly tenantId: string;
  readonly hasDecisionSpecificAuthority: boolean;
}
export interface ServerCheckedConsent {
  readonly source: "server_checked_consent_grant";
  readonly receiptId: string;
  readonly subjectParticipantId: string;
  readonly grantedByHumanUserId: string;
  readonly scope: PublicAgentTool;
  readonly purpose: "preview_public_offers";
  readonly recipientAgentId: string;
  readonly tenantId: string;
  readonly expiresAt: string;
  readonly revoked: boolean;
  readonly verifiedAt: string;
  readonly currentGrantRechecked: boolean;
}
export interface VerifiedAgent {
  readonly source: "server_verified_agent_registry";
  readonly agentId: string;
  readonly tenantId: string;
  readonly enabled: boolean;
  readonly transportAuthenticated: boolean;
  readonly approvedTools: readonly PublicAgentTool[];
}
export interface A2ATaskEnvelope {
  readonly taskId: string;
  readonly nonce: string;
  readonly participantId: string;
  readonly tenantId: string;
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly audience: "mapable-marketplace-public-broker";
  readonly purpose: "preview_public_offers";
  readonly tool: RequestedTool;
  readonly requestedData: "public" | "personal" | "health" | "worker_private";
  readonly expiresAt: string;
}
export interface A2AApprovalEvidence {
  readonly core: ResolvedCoreIdentity | null;
  readonly consent: ServerCheckedConsent | null;
  readonly agent: VerifiedAgent | null;
  readonly task: A2ATaskEnvelope;
  readonly replayNonceAlreadySeen: boolean;
  readonly evaluatedAt: string;
}
export type A2AGateResult =
  | { readonly decision: "HOLD"; readonly code: string; readonly executionAllowed: false }
  | { readonly decision: "DRY_RUN_READ_ONLY"; readonly code: "VALIDATION_PREVIEW_ONLY";
      readonly executionAllowed: false; readonly tool: PublicAgentTool;
      readonly auditSummary: { readonly taskId: string; readonly consentReceiptId: string; readonly purpose: string } };
const PUBLIC_TOOLS: readonly PublicAgentTool[] = [
  "public_marketplace_catalogue.search",
  "public_provider_evidence.read",
];
function hold(code: string): A2AGateResult {
  return { decision: "HOLD", code, executionAllowed: false };
}
function validTime(s: string): number {
  const ms = Date.parse(s);
  return Number.isFinite(ms) ? ms : NaN;
}
/**
 * Review a trusted server resolution snapshot for dry-run purposes ONLY.
 * A consent RECEIPT is an audit artifact, not itself an active grant.
 * Later runtime must call checkConsent(), hasParticipantAuthority(),
 * current grant/revocation checks and createAuditEvent() with a real auth session.
 */
export function reviewA2AReadOnlyTask(input: A2AApprovalEvidence): A2AGateResult {
  const { core, consent, agent, task } = input;
  const now = validTime(input.evaluatedAt);
  if (!Number.isFinite(now)) return hold("TIME_INVALID");
  if (!PUBLIC_TOOLS.includes(task.tool as PublicAgentTool) ||
      task.requestedData !== "public") return hold("PRIVATE_OR_CONSEQUENTIAL_TOOL_DENIED");
  if (!core?.sessionAuthenticated || !core.hasDecisionSpecificAuthority ||
      core.source !== "server_resolved_mapable_core" ||
      !core.humanUserId || !core.tenantId) return hold("SERVER_IDENTITY_REQUIRED");
  if (!agent?.enabled || !agent.transportAuthenticated ||
      agent.source !== "server_verified_agent_registry" ||
      !agent.approvedTools.includes(task.tool as PublicAgentTool)) return hold("AGENT_TRUST_NOT_ESTABLISHED");
  if (task.tenantId !== core.tenantId || task.participantId !== core.participantId ||
      agent.tenantId !== core.tenantId || task.fromAgentId !== agent.agentId ||
      task.toAgentId !== "mapable-marketplace-public-broker" ||
      task.audience !== "mapable-marketplace-public-broker" ||
      task.purpose !== "preview_public_offers") return hold("A2A_AUDIENCE_OR_TENANT_MISMATCH");
  if (!task.taskId || task.taskId.length > 128 || !task.nonce || task.nonce.length > 128 ||
      input.replayNonceAlreadySeen || !Number.isFinite(validTime(task.expiresAt)) ||
      validTime(task.expiresAt) <= now || validTime(task.expiresAt) > now + 10 * 60_000) {
    return hold("A2A_EXPIRY_OR_REPLAY");
  }
  if (!consent || consent.source !== "server_checked_consent_grant" ||
      !consent.currentGrantRechecked || consent.revoked ||
      !consent.receiptId || !consent.verifiedAt ||
      consent.subjectParticipantId !== core.participantId ||
      consent.grantedByHumanUserId !== core.humanUserId ||
      consent.scope !== task.tool || consent.purpose !== task.purpose ||
      consent.recipientAgentId !== task.fromAgentId ||
      consent.tenantId !== core.tenantId ||
      !Number.isFinite(validTime(consent.expiresAt)) ||
      validTime(consent.expiresAt) <= now ||
      !Number.isFinite(validTime(consent.verifiedAt)) ||
      validTime(consent.verifiedAt) > now ||
      now - validTime(consent.verifiedAt) > 60_000) {
    return hold("CURRENT_PURPOSE_BOUND_HUMAN_CONSENT_REQUIRED");
  }
  return {
    decision: "DRY_RUN_READ_ONLY", code: "VALIDATION_PREVIEW_ONLY",
    executionAllowed: false, tool: task.tool as PublicAgentTool,
    auditSummary: {
      taskId: task.taskId, consentReceiptId: consent.receiptId,
      purpose: task.purpose,
    },
  };
}
