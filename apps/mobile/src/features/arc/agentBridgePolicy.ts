/** MapAble ARC advisory-only policy boundary: no A2A transport or MCP server is enabled. */
export const ARC_AGENT_TRANSPORT_ENABLED = false as const;
export const ARC_MCP_REMOTE_EXECUTION_ENABLED = false as const;
export const ARC_RESEARCH_COLLECTION_ENABLED = false as const;

export type Actor = 'participant' | 'carer' | 'provider_staff' | 'advocate' | 'agent';
export type AgentAction =
  | 'read_carer_gateway_public'
  | 'read_worker_screening_guidance'
  | 'read_public_provider_listing'
  | 'read_tdsii_research_status'
  | 'prepare_enquiry_draft'
  | 'prepare_carer_plan_draft'
  | 'send_enquiry'
  | 'disclose_private_care_information'
  | 'retrieve_private_worker_clearance'
  | 'submit_research_response'
  | 'make_ndis_eligibility_decision'
  | 'infer_person_capacity'
  | 'score_individual_provider_trust'
  | 'authorise_representative'
  | 'book_respite'
  | 'request_emergency_dispatch'
  | 'publish_provider_evaluation';
export type Disposition = 'ALLOW' | 'ALLOW_WITH_SAFEGUARDS' | 'HOLD_BRANCH' | 'BLOCK_HARD_INVARIANT';
export type DisclosureClass = 'public' | 'synthetic' | 'personal' | 'sensitive';
export type ToolName =
  | 'arc.public_provider_search'
  | 'arc.public_carer_gateway_info'
  | 'arc.public_worker_screening_guidance'
  | 'arc.public_research_status'
  | 'arc.private_worker_clearance'
  | 'arc.send_referral'
  | 'arc.collect_tdsii';
export interface AgentIntent {
  action: AgentAction;
  actor: Actor;
  informationClass: DisclosureClass;
  proposedTool?: ToolName;
  participantChoseAction?: boolean;
  recipientInvolved?: boolean;
  recipientHasConsented?: boolean;
  legalAuthorityVerified?: boolean;
  remoteAgentVerified?: boolean;
  purpose?: string;
}
export interface ReviewResult {
  decision: Disposition;
  safeLocalPreview: boolean;
  transmissionPermitted: false;
  humanReviewRequired: boolean;
  reason: string;
}
const PUBLIC: ReadonlySet<AgentAction> = new Set([
  'read_carer_gateway_public', 'read_worker_screening_guidance',
  'read_public_provider_listing', 'read_tdsii_research_status',
]);
const PUBLIC_TOOLS: ReadonlySet<ToolName> = new Set([
  'arc.public_provider_search', 'arc.public_carer_gateway_info',
  'arc.public_worker_screening_guidance', 'arc.public_research_status',
]);
const BLOCK: ReadonlySet<AgentAction> = new Set([
  'make_ndis_eligibility_decision', 'infer_person_capacity',
  'score_individual_provider_trust', 'authorise_representative',
]);
const STOP: ReadonlySet<AgentAction> = new Set([
  'send_enquiry', 'disclose_private_care_information',
  'retrieve_private_worker_clearance', 'submit_research_response',
  'book_respite', 'request_emergency_dispatch', 'publish_provider_evaluation',
]);
const hold = (reason: string): ReviewResult => ({
  decision:'HOLD_BRANCH', safeLocalPreview:false,
  transmissionPermitted:false, humanReviewRequired:true, reason,
});
const block = (reason: string): ReviewResult => ({
  decision:'BLOCK_HARD_INVARIANT', safeLocalPreview:false,
  transmissionPermitted:false, humanReviewRequired:true, reason,
});
/** Apply on the SERVER as well before any future transport; client checks alone never authorise execution. */
export function reviewAgentIntent(req: AgentIntent): ReviewResult {
  if (BLOCK.has(req.action)) return block('Agent models cannot make statutory, capacity or authority decisions, or rank individuals by a synthetic trust score.');
  if (STOP.has(req.action)) return hold('No authorised external delivery, sensitive disclosure, private worker registry, research backend or booking is connected.');
  if (req.informationClass === 'personal' || req.informationClass === 'sensitive') {
    return hold('This release accepts no real participant, carer or worker records.');
  }
  if (req.proposedTool && !PUBLIC_TOOLS.has(req.proposedTool)) {
    return hold('MCP tool not included in the public read-only allowlist.');
  }
  if (PUBLIC.has(req.action)) {
    if (req.informationClass !== 'public') return hold('Public guidance cannot be used to transmit non-public data.');
    return {decision:'ALLOW',safeLocalPreview:true,transmissionPermitted:false,
      humanReviewRequired:false,reason:'Read-only public guidance; no agent transport or third-party transmission.'};
  }
  if (req.action === 'prepare_enquiry_draft' || req.action === 'prepare_carer_plan_draft') {
    if (req.actor === 'agent' || req.actor === 'provider_staff') return hold('A provider or autonomous agent cannot originate a participant-controlled draft without an authorised user action.');
    if (!req.participantChoseAction) return hold('A person must request the local draft.');
    if (req.recipientInvolved && !req.recipientHasConsented && !req.legalAuthorityVerified) {
      return hold('A family or support relationship does not establish authority for another person.');
    }
    return {decision:'ALLOW_WITH_SAFEGUARDS',safeLocalPreview:true,transmissionPermitted:false,
      humanReviewRequired:false,reason:'Editable synthetic local preview only. Human confirmation and server-side consent required before any future external action.'};
  }
  return hold('Unknown or unsupported action: fail closed.');
}
/** Not a compliant A2A endpoint or connected MCP server: an adapter contract for later implementation. */
export const ARC_DISCOVERY = Object.freeze({
  state:'disabled' as const,
  protocolTarget:'A2A v1.x' as const,
  mcpTarget:'MCP current compatible release' as const,
  features:['public_provider_search', 'carer_gateway_information', 'worker_screening_guidance', 'research_status'] as const,
  forbidden:['external_send','private_worker_screening','funding','booking','research_write'] as const,
});
