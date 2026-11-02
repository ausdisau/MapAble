/**
 * MapAble ARC - Carer Gateway read-only / synthetic policy gate (PROPOSED).
 * This is not The Benevolent Society's proprietary or current internal policy.
 * Real permissions must be rechecked server-side in an authorised integration.
 */
export type Action =
  | 'public_information'
  | 'draft_carer_plan'
  | 'draft_referral'
  | 'prepare_complaint'
  | 'emergency_respite_information'
  | 'send_referral'
  | 'submit_complaint'
  | 'book_respite'
  | 'allocate_funding'
  | 'dex_submit'
  | 'ai_process_personal_data'
  | 'make_eligibility_decision'
  | 'score_carers_star'
  | 'infer_representative_authority'
  | 'classify_abuse_or_clinical_risk';

export type Decision = 'ALLOW' | 'ALLOW_WITH_SAFEGUARDS' | 'HOLD_BRANCH' | 'BLOCK_HARD_INVARIANT';
export interface ActionRequest {
  action: Action;
  carerHasChosenAction?: boolean;
  includesCareRecipientInformation?: boolean;
  recipientOwnConsent?: boolean;
  lawfulRepresentativeAuthorityVerified?: boolean;
  carerPermissionForSharing?: boolean;
  includesActualPersonalInformation?: boolean;
  carerIsUnder18?: boolean;
  assertedServiceRegion?: 'NSW1' | 'NSW2' | 'UNKNOWN' | 'OTHER';
  userHasRequestedHumanHelp?: boolean;
}
export interface PolicyResult {
  decision: Decision;
  allowedForLocalSyntheticPreview: boolean;
  reasons: string[];
  requiresHumanReview: boolean;
  nextStep: 'VIEW_OFFICIAL_DIRECTORY'|'PREPARE_LOCAL_DRAFT'|'HUMAN_SERVICE'|'NO_EXECUTION';
}
const HOLD_UNTIL_AUTHORISED = new Set<Action>([
  'send_referral', 'submit_complaint', 'book_respite', 'allocate_funding',
  'dex_submit', 'ai_process_personal_data',
]);
const NEVER_AI_DECIDE = new Set<Action>([
  'make_eligibility_decision', 'score_carers_star',
  'infer_representative_authority', 'classify_abuse_or_clinical_risk',
]);
/** Deliberate default-off client restriction; cannot be turned on by model response or network content. */
export const EXTERNAL_ACTIONS_ENABLED = false as const;
export const LIVE_PERSONAL_DATA_ENABLED = false as const;

export function reviewCarerGatewayAction(req: ActionRequest): PolicyResult {
  if (NEVER_AI_DECIDE.has(req.action)) {
    return {
      decision:'BLOCK_HARD_INVARIANT',allowedForLocalSyntheticPreview:false,
      reasons:['The independent MapAble preview cannot perform consequential or official actions.'],
      requiresHumanReview:true,nextStep:'NO_EXECUTION'
    };
  }
  if (HOLD_UNTIL_AUTHORISED.has(req.action)) {
    return { decision:'HOLD_BRANCH',allowedForLocalSyntheticPreview:false,
      reasons:['External processing or official execution requires an independently approved secure service; this preview has none.'],
      requiresHumanReview:true,nextStep:'NO_EXECUTION' };
  }
  if (req.includesActualPersonalInformation) {
    return {decision:'HOLD_BRANCH',allowedForLocalSyntheticPreview:false,
      reasons:['This preview is synthetic-only. Personal/sensitive records require an approved secure host and lawful processing basis.'],
      requiresHumanReview:true,nextStep:'NO_EXECUTION'};
  }
  if (req.action === 'public_information') {
    return {decision:'ALLOW',allowedForLocalSyntheticPreview:true,
      reasons:['General information does not require a registered client profile.'],
      requiresHumanReview:false,nextStep:'VIEW_OFFICIAL_DIRECTORY'};
  }
  if (req.action === 'emergency_respite_information') {
    return {decision:'ALLOW_WITH_SAFEGUARDS',allowedForLocalSyntheticPreview:true,
      reasons:['Show official 24/7 emergency respite contact. Never promise or book a placement. If immediate danger, direct to 000.'],
      requiresHumanReview:true,nextStep:'HUMAN_SERVICE'};
  }
  if (req.includesCareRecipientInformation && !req.recipientOwnConsent && !req.lawfulRepresentativeAuthorityVerified) {
    return {decision:'HOLD_BRANCH',allowedForLocalSyntheticPreview:false,
      reasons:['Carer identity or family relationship does not establish authority to use another person\'s personal data.'],
      requiresHumanReview:true,nextStep:'NO_EXECUTION'};
  }
  if (req.action === 'draft_referral' && !req.carerHasChosenAction) {
    return {decision:'HOLD_BRANCH',allowedForLocalSyntheticPreview:false,
      reasons:['The carer has not chosen to create this referral draft.'],
      requiresHumanReview:false,nextStep:'PREPARE_LOCAL_DRAFT'};
  }
  if (req.assertedServiceRegion === 'UNKNOWN' || req.assertedServiceRegion === 'NSW2' || req.assertedServiceRegion === 'OTHER') {
    return {decision:'HOLD_BRANCH',allowedForLocalSyntheticPreview:false,
      reasons:['Provider area is outside or uncertain for NSW1; refer to official region directory and human provider routing.'],
      requiresHumanReview:true,nextStep:'VIEW_OFFICIAL_DIRECTORY'};
  }
  if (req.carerIsUnder18) {
    return {decision:'ALLOW_WITH_SAFEGUARDS',allowedForLocalSyntheticPreview:true,
      reasons:['Young-carer questions must be reviewed through age-appropriate safeguarding and access methods. No age-based refusal.'],
      requiresHumanReview:true,nextStep:'PREPARE_LOCAL_DRAFT'};
  }
  return {decision:'ALLOW_WITH_SAFEGUARDS',allowedForLocalSyntheticPreview:true,
    reasons:['Only local, editable synthetic preparation is allowed. Nothing is sent to Carer Gateway or TBS.'],
    requiresHumanReview:false,nextStep:'PREPARE_LOCAL_DRAFT'};
}
export function isHistoricallyStatedAmountSafeToShowAsCurrent(): false { return false; }
export function canInferNDISRegistrationFromCarerGatewayListing(): false { return false; }
export function canInferCarerAuthorityFromFamilyRelationship(): false { return false; }
