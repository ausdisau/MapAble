/**
 * Local-only WebRTC/Twilio MEDIA NEGOTIATION EMULATOR.
 * Zero network calls, camera/microphone access, SDK imports, token issuance, SMS or recordings.
 * A human role switch in this demo is NOT an authenticated identity.
 * Never use these client-side checks to authorise a production session.
 */
import type { Party } from './conversationEngine';

export const REAL_MEDIA_ENABLED = false as const;
export const REAL_TWILIO_ENABLED = false as const;
export const OUTBOUND_SMS_ENABLED = false as const;
export const MEDIA_RECORDING_ENABLED = false as const;
export const AUTO_TRANSCRIPTION_ENABLED = false as const;

export type MediaMode = 'audio' | 'video';
export type MediaTransport = 'twilio_video' | 'twilio_voice' | 'web_rtc_custom';
export type MediaStage = 'idle' | 'proposed' | 'awaiting_approvals' | 'ready_for_demo' | 'demo_active' | 'ended' | 'revoked';
export type MediaCommandKind = 'propose' | 'participant_approve' | 'acknowledge' | 'start_demo' | 'end_demo' | 'withdraw_consent' | 'request_live_connection' | 'request_recording' | 'send_sms';
export type MediaDecision = 'ALLOW_WITH_SAFEGUARDS' | 'HOLD_BRANCH' | 'BLOCK_HARD_INVARIANT';

export interface MediaConsent {
  approved: boolean;
  revision: number | null;
  scope: 'demo_media_only';
  // Not a digital signature, identity or operational consent receipt.
  synthetic: true;
}
export interface MediaAuditEntry {
  number: number;
  kind: MediaCommandKind;
  by: Party;
  detail: string;
  delivery: 'local_only';
}
export interface MediaSession {
  taskId: string;
  scenarioRevision: number;
  revision: number;
  stage: MediaStage;
  mode: MediaMode | null;
  transport: MediaTransport | null;
  attendees: readonly Party[];
  consent: MediaConsent;
  acknowledgements: Readonly<Partial<Record<Party, boolean>>>;
  recording: false;
  transcription: false;
  activeExternalTracks: 0;
  consumedCommands: readonly string[];
  audit: readonly MediaAuditEntry[];
}
export interface MediaCommand {
  id: string;
  expectedRevision: number;
  kind: MediaCommandKind;
  by: Party;
  chosenByHuman: boolean;
  mode?: MediaMode;
  transport?: MediaTransport;
  attendees?: readonly Party[];
}
export interface MediaGuard {
  /** The participant separately reviewed the draft and approved these synthetic audiences. */
  providerDisclosureApproved: boolean;
  workerDisclosureApproved: boolean;
  withdrawn: boolean;
  scenarioRevision: number;
}
export interface MediaTransition {
  allowed: boolean;
  decision: MediaDecision;
  code: string;
  explanation: string;
  state: MediaSession;
}

export function createMediaSession(taskId: string, scenarioRevision = 0): MediaSession {
  if (!taskId.startsWith('arc-demo-task-')) throw new Error('Synthetic task ID required.');
  return {
    taskId, scenarioRevision, revision: 0, stage: 'idle', mode: null, transport: null,
    attendees: [], consent: { approved: false, revision: null, scope: 'demo_media_only', synthetic: true },
    acknowledgements: {}, recording: false, transcription: false, activeExternalTracks: 0,
    consumedCommands: [], audit: [],
  };
}
function reject(state: MediaSession, code: string, explanation: string, decision: MediaDecision = 'HOLD_BRANCH'): MediaTransition {
  return { allowed: false, decision, code, explanation, state };
}
function next(state: MediaSession, command: MediaCommand, update: Partial<MediaSession>, note: string): MediaTransition {
  return {
    allowed: true, decision: 'ALLOW_WITH_SAFEGUARDS', code: 'LOCAL_DEMO_ONLY',
    explanation: note + ' No device, server, participant or third party was contacted.',
    state: {
      ...state, ...update, revision: state.revision + 1,
      consumedCommands: [...state.consumedCommands, command.id],
      audit: [...state.audit, { number: state.audit.length + 1, by: command.by, kind: command.kind, detail: note, delivery: 'local_only' }],
    },
  };
}
const allowedModes: Readonly<Record<MediaMode, readonly MediaTransport[]>> = {
  audio: ['twilio_voice', 'twilio_video', 'web_rtc_custom'],
  video: ['twilio_video', 'web_rtc_custom'],
};
const roles: readonly Party[] = ['participant', 'support_worker', 'provider'];
function validAttendees(a: readonly Party[] | undefined): a is readonly Party[] {
  if (!a || a.length < 2 || a.length > 3 || !a.includes('participant')) return false;
  return a.every(role => roles.includes(role)) && new Set(a).size === a.length;
}
/**
 * Enforces deterministic local demo transitions. A model or remote A2A message cannot
 * generate or approve a transition. In production, replicate these checks server-side
 * with authenticated parties, tenant boundaries, authority and signed consent receipts.
 */
export function applyMediaCommand(state: MediaSession, command: MediaCommand, guard: MediaGuard): MediaTransition {
  if (!command.id || !command.id.trim()) return reject(state, 'BAD_COMMAND', 'Missing unique command identifier.');
  if (state.consumedCommands.includes(command.id)) return reject(state, 'REPLAY', 'Duplicate command ignored.');
  if (command.expectedRevision !== state.revision) return reject(state, 'STALE_REVISION', 'State changed; recheck before acting.');
  if (!roles.includes(command.by)) return reject(state, 'UNKNOWN_ROLE', 'Role is not in the demo allowlist.');
  if (!command.chosenByHuman) return reject(state, 'NO_HUMAN_CHOICE', 'An agent cannot accept a call or grant consent.');
  if (guard.withdrawn && command.kind !== 'withdraw_consent' && command.kind !== 'end_demo') {
    return reject(state, 'WITHDRAWN', 'Participant has withdrawn consent.');
  }
  if (guard.scenarioRevision < state.scenarioRevision) return reject(state, 'STALE_SCENARIO', 'Conversation state cannot run backwards.');
  if (!['idle', 'ended', 'revoked'].includes(state.stage) && !['withdraw_consent', 'end_demo'].includes(command.kind) && mediaIsStale(state, guard)) {
    return reject(state, 'STALE_MEDIA_CONTEXT', 'Conversation, audience, or participant consent changed. End this proposal and request fresh approvals.');
  }
  if (['request_live_connection', 'send_sms'].includes(command.kind)) {
    return reject(state, 'EXTERNAL_TRANSPORT_DISABLED', 'Real WebRTC signaling, Twilio rooms, calls and SMS are not enabled.');
  }
  if (command.kind === 'request_recording') {
    return reject(state, 'RECORDING_DISABLED', 'Recording is disabled; no consent or lawful recording workflow is implemented.', 'BLOCK_HARD_INVARIANT');
  }
  if (command.kind === 'withdraw_consent') {
    if (command.by !== 'participant') return reject(state, 'NOT_PARTICIPANT', 'Only the participant can withdraw this simulated participant media permission.');
    return next(state, command, {
      stage: 'revoked', consent: { approved: false, revision: null, scope: 'demo_media_only', synthetic: true },
      acknowledgements: {}, recording: false, activeExternalTracks: 0,
    }, 'Synthetic media permission withdrawn and demo ended.');
  }
  if (command.kind === 'end_demo') {
    if (!state.attendees.includes(command.by)) return reject(state, 'NOT_INVITED', 'The actor is not an attendee.');
    if (!['demo_active', 'ready_for_demo', 'proposed', 'awaiting_approvals'].includes(state.stage)) return reject(state, 'INVALID_STAGE', 'Nothing is active or pending.');
    return next(state, command, { stage: 'ended', activeExternalTracks: 0 }, 'Simulated call ended.');
  }
  if (command.kind === 'propose') {
    if (state.stage !== 'idle' && state.stage !== 'ended') return reject(state, 'INVALID_STAGE', 'Previous proposal must be ended first.');
    if (command.by !== 'participant' && command.by !== 'provider') return reject(state, 'CANNOT_INVITE', 'Worker agent cannot independently invite the participant.');
    if (!validAttendees(command.attendees) || !command.attendees.includes(command.by)) return reject(state, 'INVALID_ATTENDEES', 'Choose two or three valid parties, including the participant and proposing party.');
    if (command.attendees.includes('provider') && !guard.providerDisclosureApproved) return reject(state, 'PROVIDER_SCOPE_MISSING', 'Participant has not approved sharing with provider agent.');
    if (command.attendees.includes('support_worker') && !guard.workerDisclosureApproved) return reject(state, 'WORKER_SCOPE_MISSING', 'Participant has not approved sharing with support-worker agent.');
    if (!command.mode || !command.transport || !allowedModes[command.mode].includes(command.transport)) {
      return reject(state, 'INVALID_TRANSPORT', 'Audio/video mode does not match a supported future adapter.');
    }
    return next(state, command, {
      stage: 'proposed', scenarioRevision: guard.scenarioRevision, mode: command.mode,
      transport: command.transport, attendees: [...command.attendees],
      consent: { approved: false, revision: null, scope: 'demo_media_only', synthetic: true },
      acknowledgements: {}, activeExternalTracks: 0,
    }, 'Simulated media invitation created locally.');
  }
  if (command.kind === 'participant_approve') {
    if (command.by !== 'participant') return reject(state, 'NOT_PARTICIPANT', 'Only participant chooses participant media approval.');
    if (state.stage !== 'proposed') return reject(state, 'INVALID_STAGE', 'No pending proposal.');
    if (guard.scenarioRevision !== state.scenarioRevision) return reject(state, 'PROPOSAL_STALE', 'Conversation changed. Create a new media invitation.');
    return next(state, command, {
      stage: 'awaiting_approvals', consent: { approved: true, revision: state.revision + 1, scope: 'demo_media_only', synthetic: true },
    }, 'Participant approved only the local synthetic media proposal.');
  }
  if (command.kind === 'acknowledge') {
    if (command.by === 'participant' || !state.attendees.includes(command.by)) return reject(state, 'NOT_INVITED', 'Only invited worker/provider can acknowledge.');
    if (state.stage !== 'awaiting_approvals') return reject(state, 'INVALID_STAGE', 'Media participant approval required first.');
    const ack = { ...state.acknowledgements, [command.by]: true };
    const complete = state.attendees.filter(p => p !== 'participant').every(p => ack[p] === true);
    return next(state, command, { acknowledgements: ack, stage: complete ? 'ready_for_demo' : 'awaiting_approvals' }, 'Invited simulated role acknowledged.');
  }
  if (command.kind === 'start_demo') {
    if (command.by !== 'participant') return reject(state, 'NOT_PARTICIPANT', 'Only participant can start the simulated media session.');
    if (state.stage !== 'ready_for_demo' || !state.consent.approved) return reject(state, 'NOT_READY', 'Consent and all invited acknowledgements are required.');
    if (guard.scenarioRevision !== state.scenarioRevision) return reject(state, 'STALE_REQUEST', 'Request changed; a new invitation and consent are needed.');
    return next(state, command, { stage: 'demo_active', activeExternalTracks: 0 }, 'Local media session illustrated as active; no microphone or camera has started.');
  }
  return reject(state, 'UNKNOWN_ACTION', 'Unrecognised media command.');
}

/** Compare the media permission to the live (synthetic) conversation after any revision or withdrawal. */
export function mediaIsStale(state: MediaSession, guard: MediaGuard): boolean {
  if (guard.withdrawn) return true;
  if (state.attendees.includes('provider') && !guard.providerDisclosureApproved) return true;
  if (state.attendees.includes('support_worker') && !guard.workerDisclosureApproved) return true;
  return guard.scenarioRevision !== state.scenarioRevision;
}

/** Always returns the blocked, server-only future adapter decision in this release. */
export function reviewExternalTransport(action: 'twilio_video_room' | 'twilio_voice_call' | 'twilio_sms' | 'webrtc_offer' | 'turn_token' | 'media_recording' | 'transcription') {
  return {
    decision: action === 'media_recording' ? 'BLOCK_HARD_INVARIANT' : 'HOLD_BRANCH',
    allowed: false as const,
    reason: 'No production actor authentication, room token, recording-consent, approved Twilio account or protected server-side executor exists.',
  } as const;
}
