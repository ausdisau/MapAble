# MapAble ARC: participant–support worker–provider A2A + WebRTC/Twilio plan

**State: IMPLEMENTED LOCAL SYNTHETIC EMULATOR, NOT LIVE COMMUNICATION.** 2 November 2026.

## Decision and scope

Use a single participant-initiated/participant-controlled task boundary for messages, with separate consents for provider disclosure, worker disclosure and media access. A2A coordinates typed tasks among agents; MCP provides read-only tools under server-enforced, audience-bound permissions; WebRTC transports live audio/video when a human explicitly starts a session; Twilio is an optional communications vendor. Do not confuse a provider's agent, an employee's identity, a worker clearance, a device, or a family member with a participant's legal consent.

A three-party *emulation* requires no API keys or physical media. `conversationEngine.ts` implements 11 deterministic command kinds with stage, party, nonce/idempotency, revision and consent controls; `mediaSessionEngine.ts` implements media negotiations, simulated join, stop/withdrawal, and permanent feature-disabled live transport checks. The UI exposes fictional role switching, text transcripts, media proposal and approvals. No devices or network are contacted. This should be the first vertical slice before any live integration.

## Protocol boundaries (separate systems)

```text
HUMAN: Participant, unpaid carer where relevant, worker, provider coordinator
           | explicitly approves a purpose, recipient, minimum fields
MapAble React Native  <-- local user-visible accessibility and AAC controls
           | user-authenticated API, consent receipts, audit
MapAble Core API & Policy Gate (server; NOT IMPLEMENTED)
           | signed actor+tenant+task+purpose+recipient context
           +----------------------+----------------------------+
           |                      |                            |
    A2A task exchange        MCP read-only tools        Media session controller
    (message proposals,      (public provider           (short-lived credentials,
     clarification, status)   facts, official guidance)   session membership, revoke)
           |                      |                            |
    Provider agent         Evidence/service sources    WebRTC media
    Worker agent                                    Twilio Video / Voice (optional)
                                                            |
                                                  Explicitly authorized people
```

The A2A and MCP network boxes above are future plans and not live endpoints. A2A 1.0 task states and Agent Cards may be used once mutual trust, signed agent identity, tenant isolation and server enforcement exist. Do not expose a live publicly discoverable agent card until these checks are implemented. For MCP HTTP authorization use current audience-bound OAuth and resource indicators; never accept a third-party A2A instruction as proof of participant consent or as permission to execute tools.

## Structured message contract (concept; not A2A wire-format)

```json
{
  "taskId": "synthetic-task-id",
  "sender": "participant_agent",
  "recipient": "provider_agent",
  "intent": "draft_service_enquiry",
  "classification": "synthetic_minimal",
  "purpose": "support_coordination_demo",
  "recipientRole": "provider",
  "participantApproval": "explicit_local_demo_choice",
  "workerScreening": "NOT_INDEPENDENTLY_VERIFIED",
  "transport": "local_only",
  "revocation": "supported_in_local_state"
}
```

Real envelopes MUST instead include cryptographically verified agent/actor identity, tenant, task, signed consent receipt ID, purpose, recipient and scope, server-set expiry, replay protection, trace ID and lawful source provenance. Human-readable transcripts are not the trust boundary. Do not send a person's medical/disability information merely because a provider agent asks for it. The participant must be able to correct the proposed brief.

## Real-time media transport choice

| Mode | Proposed vendor/library | Current code | Production approval gate |
|---|---|---|---|
| Text/AAC | MapAble audited messaging, with A2A task status under policy gate | Local messages only | authenticated sender/recipient, private safe storage, consent, retention, accessibility |
| Video/audio | Twilio Programmable Video Group Rooms; WebRTC-based SDK | disabled adapter selection | server-created Room, room-bound user JWT, participant invitation + each person's acceptance, device permission, no recording |
| Audio-only | Twilio Programmable Voice SDK or audio track in Twilio Video | disabled adapter selection | lawful call initiation, server-issued access token, human confirmation, participant callback and provider phone number privacy |
| Custom WebRTC | `react-native-webrtc`, secure app-controlled signaling and Twilio Network Traversal Service TURN/STUN if used | disabled adapter selection | TURN short-lived credentials, server auth, ICE/DTLS-SRTP, NAT and device testing, security review |
| SMS notices | Twilio Programmable Messaging | always held | discrete opted-in recipient/channel, content minimisation, stop/opt-out handling, signature-validated webhooks, delivery receipts |
| Recording/transcription | None | disabled and hard blocked in emulator | separate all-party consent + applicable Australian legal/privacy review, access controls, retention, transparency and independent signoff |

**Twilio Video IS supported:** Its December 2026 sunset announcement was reversed on 21 October 2024. The recommended `@twilio/video-react-native-sdk` package supports Expo through a config plugin and development builds; it is not a generic Expo Go dependency. Dependency compatibility with the repository's Expo 57 / RN 0.86 MUST be validated before installation; this PR intentionally does not add the native dependency or change permissions. Twilio `group` rooms are recommended for new implementations; Peer-to-Peer and WebRTC Go room types are deprecated in current Twilio docs. Twilio Group Room audio/video is transport-encrypted but briefly decrypted/re-encrypted in Twilio cloud memory; don't claim full end-to-end encryption or guaranteed Australian-only media handling. A data protection/privacy impact assessment must evaluate actual regional flows.

### Future server session workflow (NOT implemented)

1. Authenticated human creates task request via MapAble Core. Participant chooses if worker or provider should receive it; each disclosure is separately consented. Real participants, workers and provider staff use actual identity verification (not demo role toggles).
2. Server creates a provisional media session linked to a consent and task, with intended recipients and TTL, but does **not** create or invite a Twilio Room on background agent advice alone.
3. Participant approves an audio/video session, and invitees accept, after showing who will join, what data/device permissions are needed and whether recordings/captions are available. Reject if any attendee not verified or consent expired.
4. The protected server requests a **Twilio Group Room** with `RecordParticipantsOnConnect=false` and issues short-lived **room-restricted VideoGrant tokens** using server-only API credentials. No Twilio key may appear in `EXPO_PUBLIC_*` variables or GitHub. If Twilio Voice is used, issue separate Voice SDK access tokens and server-side TwiML call instructions. Session must be restricted to relevant tenant/party and not be guessable by task ID.
5. Mobile clients request microphone/camera permission only on an explicit join tap; never on rendering a proposal. WebRTC call state and media tracks are separate from the agent/task state and never used as evidence of service delivery.
6. A participant or attendee can leave. Participant may revoke participation at any time; server must stop their published media, revoke room admission, invalidate invitations/tokens as feasible and block new joins. Revocation cannot retroactively retract data already disclosed, so explain that limitation.
7. No recording, transcription, SMS, voice dial-out or automated third-party invite unless a separate, audited and approved feature branch enables it. Server Twilio webhooks must verify `X-Twilio-Signature`, be idempotent and scoped to active sessions.
8. Network failure should present clear status and a safe fallback to accessible **non-AI text/AAC communication**. Never equate dropped media, silence, hesitation, dysarthria or AAC delay with refusal, incapacity or agreement.
9. For an urgent incident, direct users to official emergency pathways. Do not imply this app can dispatch an ambulance or replace a clinical/provider on-call system.

### Access and availability

- Support AAC/text at all times, not only as a transcription afterthought. Manual text review remains possible during calls.
- Explicit camera and microphone toggles, self-view control, accessible participant list, mute indicators, real captions when independently validated, non-audio alert equivalents, high contrast, large text, switch/keyboard support, reduced motion and reconnection.
- A phone fallback must not make a phone call compulsory for people who cannot use one; callback options and text-based paths remain accessible.
- Don't claim automatic ASR accuracy for dysarthric speakers; test on consented representative speech, allow manual correction and never use speech recognition as an identity/consent proxy.

## Permissions model

| Operation | Participant | Worker | Provider | Autonomous agent |
|---|---|---|---|---|
| Draft own service need | Yes | Clarify if explicitly invited | Propose an offer after sharing | Suggest draft; cannot submit |
| Approve disclosure of participant's record | Explicit decision | No | No | Never |
| Read worker's actual screening result | Only authorised relevant mechanism | Own official status | Authorised NWSD mechanism | Never through public search |
| Propose a call | Yes | Only under separate worker/provider policy | Can propose after consent to receive enquiry | May suggest, cannot invite independently |
| Approve participant media access | Yes | No | No | Never |
| Join a real call | Explicit user action and verified session | Explicit user action and verified session | Explicit user action and verified session | Never impersonate a human |
| Start recording | Disabled | Disabled | Disabled | Disabled |
| Execute payment/NDIS decision/clinical action | No in ARC | No in ARC | No in ARC | Never |

Worker screening is NOT a public lookup; `Clearance` does not prove qualification, competence or a service agreement. Current worker status remains `NOT INDEPENDENTLY VERIFIED` in all demo messages.

## Tests and acceptance gates

**Tested locally:** Node TypeScript deterministic domain, role and scope constraints, media state machine, consent withdrawal, replay and optimistic concurrency, unsafe network requests blocked; see `mediaSessionEngine.test.mjs`, `conversationEngine.test.mjs`, `agentBridgePolicy.test.mjs`.

**Not tested:** React Native build on actual dependency tree, Expo bundling, native SDK integration, browser real WebRTC, Twilio account operations, media encryption and regional routing, Android TalkBack, iOS VoiceOver, hardware switches, AAC or real participant co-design.

Release sequence: (H0) local synthetic demo and design review -> (H1) server identity+consent+audit, accessibility testing -> (H2) isolated sandbox WebRTC/Twilio with synthetic identities under formal security/privacy approval -> (H3) limited participant-led controlled pilot after safeguarding & training -> (H4) research in trustworthy interoperable A2A/MCP agents, no autonomous consequential actions.

## Sources checked 2 November 2026

- Twilio Video reversal: https://www.twilio.com/en-us/changelog/-twilio-video-will-remain-a-standalone-product
- Twilio Video React Native package / Expo config plugin: https://www.npmjs.com/package/@twilio/video-react-native-sdk
- Twilio Video rooms and group-room parameters: https://www.twilio.com/docs/video/api/rooms-resource
- Twilio Video grants, tokens: https://www.twilio.com/docs/video/tutorials/user-identity-access-tokens
- Twilio Group Room media security: https://help.twilio.com/articles/115007323447-Media-encryption-with-Twilio-Programmable-Video
- Twilio Voice React Native: https://www.twilio.com/docs/voice/sdks/react-native
- Twilio Network Traversal Service: https://www.twilio.com/docs/stun-turn/api
- Twilio secure webhook validation: https://www.twilio.com/docs/usage/api-security-reference-guide/webhook
- A2A v1.0: https://a2a-protocol.org/v1.0.0/specification
- MCP authorization (latest reviewed specification): https://modelcontextprotocol.io/specification
