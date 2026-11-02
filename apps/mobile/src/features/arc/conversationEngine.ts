/**
 * MapAble ARC: deterministic, synthetic-only three-party agent communication emulator.
 * No real provider, worker or participant information is accepted here. No network I/O.
 * This is NOT an A2A server, a provider authorisation service or an MCP host.
 */
export const REAL_WORLD_TRANSMISSION_ENABLED = false as const;
export const REAL_WORKER_CLEARANCE_VERIFICATION_ENABLED = false as const;
export const AUTOMATED_BOOKING_ENABLED = false as const;

export type Party = 'participant' | 'support_worker' | 'provider';
export type Stage =
  | 'not_started' | 'local_draft' | 'provider_shared' | 'offer_received'
  | 'worker_shared' | 'clarification_needed' | 'worker_acknowledged'
  | 'simulated_confirmation' | 'declined' | 'withdrawn' | 'human_escalation';
export type ScenarioId = 'daily_living' | 'community_access' | 'carer_respite';
export type CommandKind =
  | 'prepare_draft' | 'approve_provider_share' | 'prepare_provider_offer'
  | 'approve_worker_share' | 'ask_worker_clarification' | 'answer_worker_clarification'
  | 'acknowledge_worker_tasks' | 'confirm_simulation' | 'revise_provider_offer'
  | 'decline_offer' | 'withdraw_consent' | 'raise_worker_concern';
export type Classification = 'synthetic_minimal' | 'public_guidance';
export interface Scenario {
  id: ScenarioId;
  title: string;
  participantGoal: string;
  serviceRequest: string;
  workDescription: string;
  accessPreference: string;
  caveat: string;
}
export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'daily_living', title: 'Morning routine',
    participantGoal: 'I want to decide how my morning support is provided.',
    serviceRequest: 'Assistance with opening meal packaging and arranging breakfast at a chosen time.',
    workDescription: 'Ask before helping with packaging; do not assume feeding assistance is requested.',
    accessPreference: 'Use written communication, allow extra response time, and confirm choices.',
    caveat: 'Illustrative non-clinical task. Food-safety or swallowing concerns require separate human assessment.',
  },
  {
    id: 'community_access', title: 'Community participation',
    participantGoal: 'I want to travel to a community activity with the supports I choose.',
    serviceRequest: 'Assist with planning accessible transport and confirming a meeting point.',
    workDescription: 'Confirm the access needs and route; do not assume vehicle accessibility or driver competence.',
    accessPreference: 'Offer text messages and plain-language itinerary information.',
    caveat: 'No transport provider, vehicle, driver or route has been verified.',
  },
  {
    id: 'carer_respite', title: 'Carer support planning',
    participantGoal: 'I want to remain involved in any arrangements affecting my support.',
    serviceRequest: 'Discuss options for a temporary break in an unpaid carer\'s routine.',
    workDescription: 'Seek the views of the carer and the person receiving care separately.',
    accessPreference: 'Communicate with the person receiving care directly and in their chosen format.',
    caveat: 'Carer Gateway information is not a respite booking, funding approval or authority to act for another person.',
  },
] as const;

export interface AgentMessage {
  id: string;
  taskId: string;
  sequence: number;
  from: Party;
  to: readonly Party[];
  kind: 'draft' | 'request' | 'proposal' | 'question' | 'answer' | 'acknowledgement' | 'notice';
  text: string;
  classification: Classification;
  isSynthetic: true;
}
export interface AuditEvent {
  sequence: number;
  action: CommandKind;
  by: Party;
  note: string;
  actorIdentityVerified: false;
  delivery: 'local_only';
}
export interface SimulatedSession {
  id: string;
  taskId: string;
  scenarioId: ScenarioId;
  stage: Stage;
  revision: number;
  providerDisclosureApproved: boolean;
  workerDisclosureApproved: boolean;
  cancelled: boolean;
  workerScreening: 'NOT_INDEPENDENTLY_VERIFIED';
  // These keys are scoped to the current local synthetic session, never persisted remotely.
  consumedCommandIds: readonly string[];
  messages: readonly AgentMessage[];
  audit: readonly AuditEvent[];
}
export interface ConversationCommand {
  id: string;
  taskId: string;
  expectedRevision: number;
  by: Party;
  kind: CommandKind;
  /** Explicit UI click by a person simulating this role. NOT actual role authentication. */
  explicitlyChosen: boolean;
}
export interface Transition {
  allowed: boolean;
  decision: 'ALLOW_WITH_SAFEGUARDS' | 'HOLD_BRANCH' | 'BLOCK_HARD_INVARIANT';
  code: string;
  detail: string;
  session: SimulatedSession;
}
const requiredParty: Readonly<Record<CommandKind, Party>> = {
  prepare_draft: 'participant', approve_provider_share: 'participant',
  prepare_provider_offer: 'provider', approve_worker_share: 'participant',
  ask_worker_clarification: 'support_worker', answer_worker_clarification: 'participant',
  acknowledge_worker_tasks: 'support_worker', confirm_simulation: 'participant',
  revise_provider_offer: 'provider', decline_offer: 'participant',
  withdraw_consent: 'participant', raise_worker_concern: 'support_worker',
};
const permittedStages: Readonly<Record<CommandKind, readonly Stage[]>> = {
  prepare_draft: ['not_started'],
  approve_provider_share: ['local_draft'],
  prepare_provider_offer: ['provider_shared'],
  approve_worker_share: ['offer_received'],
  ask_worker_clarification: ['worker_shared'],
  answer_worker_clarification: ['clarification_needed'],
  acknowledge_worker_tasks: ['worker_shared'],
  confirm_simulation: ['worker_acknowledged'],
  revise_provider_offer: ['offer_received', 'worker_shared', 'clarification_needed', 'worker_acknowledged'],
  decline_offer: ['offer_received', 'worker_shared', 'clarification_needed', 'worker_acknowledged'],
  withdraw_consent: ['local_draft','provider_shared','offer_received','worker_shared','clarification_needed','worker_acknowledged','simulated_confirmation'],
  raise_worker_concern: ['worker_shared','clarification_needed','worker_acknowledged'],
};
const stageAfter: Readonly<Record<CommandKind, Stage>> = {
  prepare_draft:'local_draft', approve_provider_share:'provider_shared',
  prepare_provider_offer:'offer_received', approve_worker_share:'worker_shared',
  ask_worker_clarification:'clarification_needed', answer_worker_clarification:'worker_shared',
  acknowledge_worker_tasks:'worker_acknowledged', confirm_simulation:'simulated_confirmation',
  revise_provider_offer:'offer_received', decline_offer:'declined',
  withdraw_consent:'withdrawn', raise_worker_concern:'human_escalation',
};

/** Deterministic demo session; caller-provided IDs must remain synthetic. */
export function createSession(scenarioId: ScenarioId = 'daily_living'): SimulatedSession {
  if (!SCENARIOS.some(s => s.id === scenarioId)) throw new Error('Unknown synthetic scenario');
  return {
    id:`arc-demo-${scenarioId}`, taskId:`arc-demo-task-${scenarioId}`, scenarioId,
    stage:'not_started', revision:0, providerDisclosureApproved:false,
    workerDisclosureApproved:false, cancelled:false, workerScreening:'NOT_INDEPENDENTLY_VERIFIED',
    consumedCommandIds:[], messages:[], audit:[],
  };
}
export function getScenario(session: SimulatedSession): Scenario {
  const value=SCENARIOS.find(s=>s.id===session.scenarioId);
  if(!value) throw new Error('Unknown synthetic scenario');
  return value;
}
export function availableCommands(session: SimulatedSession, by: Party): CommandKind[] {
  return (Object.keys(requiredParty) as CommandKind[]).filter(k =>
    requiredParty[k]===by && permittedStages[k].includes(session.stage));
}
function blocked(session: SimulatedSession, code: string, detail: string,
  decision: Transition['decision']='HOLD_BRANCH'): Transition {
  return {allowed:false, decision, code, detail, session};
}
function addMessage(session: SimulatedSession, from: Party, to: readonly Party[], kind: AgentMessage['kind'], text: string): AgentMessage {
  return {
    id:`${session.taskId}-message-${session.messages.length + 1}`,
    taskId:session.taskId, sequence:session.messages.length + 1,
    from,to,kind,text,classification:'synthetic_minimal',isSynthetic:true,
  };
}
/** No AI, I/O, database, external A2A or MCP call is performed. */
export function applyCommand(session: SimulatedSession, command: ConversationCommand): Transition {
  if (typeof command.id !== 'string' || !command.id.trim()) return blocked(session,'INVALID_COMMAND','Unique command ID required.');
  if (command.taskId !== session.taskId) return blocked(session,'CROSS_CASE','Command is bound to another task.');
  if (session.consumedCommandIds.includes(command.id)) return blocked(session,'REPLAY','Already processed; no duplicate event was created.');
  if (command.expectedRevision !== session.revision) return blocked(session,'STALE_REVISION','Task changed; review the new state before acting.');
  if (requiredParty[command.kind] !== command.by || !Object.hasOwn(requiredParty,command.kind)) {
    return blocked(session,'WRONG_ROLE','This simulated role cannot perform that action.');
  }
  if (!command.explicitlyChosen) return blocked(session,'HUMAN_CONFIRMATION_REQUIRED','A simulated human must choose the action; no agent may self-approve.');
  if (!permittedStages[command.kind].includes(session.stage)) return blocked(session,'INVALID_STAGE','Action not available at this stage; no messages were generated.');
  const s = getScenario(session);
  // Check necessary prior authorisation independently of stage, so corrupted state fails closed.
  if (command.kind === 'prepare_provider_offer' && !session.providerDisclosureApproved) return blocked(session,'NO_PROVIDER_CONSENT','Provider cannot see the draft without participant approval.');
  if (['ask_worker_clarification','acknowledge_worker_tasks','raise_worker_concern'].includes(command.kind) && !session.workerDisclosureApproved) {
    return blocked(session,'NO_WORKER_CONSENT','Worker cannot see the request before specific participant approval.');
  }
  if (command.kind === 'confirm_simulation' && (!session.providerDisclosureApproved || !session.workerDisclosureApproved)) {
    return blocked(session,'MISSING_AUTHORITY','Confirmation requires an approved provider and worker information scope.');
  }
  const nextMessages: AgentMessage[] = [];
  let providerConsent=session.providerDisclosureApproved;
  let workerConsent=session.workerDisclosureApproved;
  let cancelled=session.cancelled;
  switch(command.kind) {
    case 'prepare_draft':
      nextMessages.push(addMessage(session,'participant',['participant'],'draft',`Local draft: ${s.participantGoal} Requested help: ${s.serviceRequest} No provider has received this.`));
      break;
    case 'approve_provider_share':
      providerConsent=true;
      nextMessages.push(addMessage(session,'participant',['provider','participant'],'request',`Synthetic participant-approved summary: ${s.serviceRequest} Communication: ${s.accessPreference}`));
      break;
    case 'prepare_provider_offer':
      nextMessages.push(addMessage(session,'provider',['participant'],'proposal',`Fictional provider proposal: A suitable worker might be available for the requested support. Their screening and competence are NOT verified. Please review before sharing with a worker. ${s.caveat}`));
      break;
    case 'approve_worker_share':
      workerConsent=true;
      nextMessages.push(addMessage(session,'participant',['support_worker','provider'],'request',`Participant approves a fictional worker task brief: ${s.workDescription} Communication: ${s.accessPreference} No clinical history or identifiers disclosed.`));
      break;
    case 'ask_worker_clarification':
      nextMessages.push(addMessage(session,'support_worker',['participant'],'question','Can you confirm how you prefer me to ask before helping, and whether the suggested time works? No medical details required.'));
      break;
    case 'answer_worker_clarification':
      nextMessages.push(addMessage(session,'participant',['support_worker'],'answer',`Please follow my preference: ${s.accessPreference} Confirm each action before assisting.`));
      break;
    case 'acknowledge_worker_tasks':
      nextMessages.push(addMessage(session,'support_worker',['participant','provider'],'acknowledgement','I acknowledge the fictional task brief and will ask before assisting. This is NOT proof of screening, capability or a real assignment.'));
      break;
    case 'confirm_simulation':
      nextMessages.push(addMessage(session,'participant',['provider','support_worker'],'notice','I confirm this simulated plan for demonstration only. No real booking, agreement, funding or referral is created.'));
      break;
    case 'revise_provider_offer':
      workerConsent=false;
      nextMessages.push(addMessage(session,'provider',['participant'],'proposal','The fictional provider revised the support offer. Previous worker-sharing approval is invalidated; please review and decide again.'));
      break;
    case 'decline_offer':
      workerConsent=false; providerConsent=false;
      nextMessages.push(addMessage(session,'participant',['provider','support_worker'],'notice','I decline the simulated proposal. No further simulated actions are authorised.'));
      break;
    case 'withdraw_consent':
      workerConsent=false;providerConsent=false;cancelled=true;
      nextMessages.push(addMessage(session,'participant',['provider','support_worker'],'notice','I withdraw permission for this simulated exchange. No further disclosure or processing is permitted.'));
      break;
    case 'raise_worker_concern':
      workerConsent=false;
      nextMessages.push(addMessage(session,'support_worker',['participant','provider'],'notice','I cannot confirm I can perform the requested task safely. Human assessment and direct communication with the participant are required. No task is dispatched.'));
      break;
  }
  const updated: SimulatedSession = {
    ...session,
    stage:stageAfter[command.kind],
    providerDisclosureApproved:providerConsent,
    workerDisclosureApproved:workerConsent,
    cancelled,
    revision:session.revision+1,
    consumedCommandIds:[...session.consumedCommandIds,command.id],
    messages:[...session.messages,...nextMessages],
    audit:[...session.audit,{
      sequence:session.audit.length+1,action:command.kind,by:command.by,
      note:'User-invoked synthetic transition; no third-party transmission',
      actorIdentityVerified:false,delivery:'local_only',
    }],
  };
  return {allowed:true,decision:'ALLOW_WITH_SAFEGUARDS',code:'SYNTHETIC_TRANSITION',
    detail:'Local simulation updated. No real messages, workers, tools or services were contacted.',session:updated};
}
/** Every party has a different need-to-know view. This does not perform real user authentication. */
export function visibleMessages(session: SimulatedSession, viewer: Party): AgentMessage[] {
  return session.messages.filter(message=>viewer==='participant' || message.from===viewer || message.to.includes(viewer));
}

/** A2A 1.x conceptual task shape only. This is NOT wire-compatible or network connected. */
export function a2aPreview(session: SimulatedSession) {
  return {
    implementation:'synthetic_A2A_concept_only',
    protocolTarget:'A2A 1.x',
    task:{
      id:session.taskId,
      contextId:session.id,
      status:{state:session.stage==='simulated_confirmation'?'completed':session.stage==='human_escalation'?'input-required':session.stage==='withdrawn'?'canceled':'working'},
      messages:session.messages.map(m=>({
        messageId:m.id,role:'agent',parts:[{text:m.text}],
        metadata:{from:m.from,to:m.to,classification:m.classification,synthetic:true},
      })),
      artifacts:session.stage==='simulated_confirmation'?[{
        artifactId:`${session.taskId}-demo-plan`,name:'Simulated participant-approved plan',
        parts:[{text:'Demonstration only. Not an authorised booking or service agreement.'}],
      }]:[],
    },
    transportAvailable:false,
    agentCardsPublished:false,
    mcpRemoteToolsAvailable:false,
    workerScreeningStatus:session.workerScreening,
  };
}
