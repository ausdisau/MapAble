/** Offline deterministic tests of RAG privacy boundary; no DB or network. */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CARE_RAG_PURPOSE,
  CARE_RAG_ACTION,
  CARE_RAG_SCOPE,
  ParticipantRAG,
  ProviderRAG,
  shouldEnableSyntheticRag,
} from '../../lib/ai/platform/retrieval/care-support/care-support-rag.ts';

const now = new Date('2026-11-06T10:00:00.000Z');
const validConsent = () => ({
  id: 'consent-1',
  subjectUserId: 'p-1',
  grantedToUserId: 'p-1',
  grantedToOrganisationId: null,
  createdById: 'p-1',
  purpose: CARE_RAG_PURPOSE,
  scope: CARE_RAG_SCOPE,
  status: 'active',
  sourceAction: CARE_RAG_ACTION,
  dataScope: ['support_needs', 'ai_processing'],
  expiresAt: new Date('2027-11-06T00:00:00Z'),
  revokedAt: null,
});
const privateEvidence = (overrides = {}) => ({
  id: 'e-1',
  participantId: 'p-1',
  tenantId: 'tenant-1',
  purpose: CARE_RAG_PURPOSE,
  visibility: 'participant_private',
  synthetic: true,
  redactedText: 'I need text messages and help opening breakfast packaging',
  sourceRef: 'synthetic-statement-1',
  sourceVersion: '1',
  evidenceStatus: 'synthetic',
  expiresAtIso: null,
  ...overrides,
});
const publicEvidence = (overrides = {}) => ({
  ...privateEvidence(),
  id: 'provider-1',
  participantId: null,
  tenantId: null,
  purpose: 'provider_directory_explain',
  visibility: 'public_provider',
  redactedText: 'Fictional provider assists with text communication',
  ...overrides,
});
const setup = (overrides = {}) => {
  const calls = { session: 0, membership: 0, consent: 0, private: 0, provider: 0, audits: [] };
  const state = {
    enabled: true,
    stopped: false,
    actor: 'p-1',
    memberships: ['tenant-1'],
    consent: validConsent(),
    evidence: [privateEvidence()],
    providers: [publicEvidence()],
    onReadPrivate: null,
    onReadProvider: null,
    onConsent: null,
    failAudit: false,
    ...overrides,
  };
  const ports = {
    enabled: () => state.enabled,
    stopped: () => state.stopped,
    async authenticatedActor() {
      calls.session++;
      return state.actor ? { id: state.actor } : null;
    },
    async organisationMembershipIds() {
      calls.membership++;
      return state.memberships;
    },
    async latestConsent() {
      calls.consent++;
      if (state.onConsent) return state.onConsent(calls.consent, state);
      return state.consent;
    },
    async auditRead(x) {
      if (state.failAudit) throw Error('audit unavailable');
      calls.audits.push(x);
    },
    now: () => now,
  };
  const store = {
    async loadParticipantEvidence() {
      calls.private++;
      if (state.onReadPrivate) state.onReadPrivate(state);
      return state.evidence;
    },
    async loadPublicProviderEvidence() {
      calls.provider++;
      if (state.onReadProvider) state.onReadProvider(state);
      return state.providers;
    },
  };
  return { state, calls, participant: new ParticipantRAG(ports, store), provider: new ProviderRAG(ports, store) };
};
const query = { participantId: 'p-1', tenantId: 'tenant-1', query: 'help breakfast' };
const rejectsCode = async (promise, code) => {
  await assert.rejects(promise, e => e?.code === code);
};

test('disabled flag denies before authentication, consent or data access', async () => {
  const x = setup({enabled:false});
  await rejectsCode(x.participant.search(query), 'FEATURE_DISABLED');
  assert.equal(x.calls.session,0); assert.equal(x.calls.private,0);
});
test('Stop AURA denies before authentication', async () => {
  const x = setup({stopped:true});
  await rejectsCode(x.participant.search(query), 'AURA_STOPPED');
  assert.equal(x.calls.session,0);
});
test('unauthenticated actor rejected', async () => {
  const x = setup({actor:null});
  await rejectsCode(x.participant.search(query), 'NOT_AUTHENTICATED');
  assert.equal(x.calls.private,0);
});
test('cross-participant self-only boundary', async () => {
  const x = setup({actor:'other-user'});
  await rejectsCode(x.participant.search(query), 'ACCESS_DENIED');
  assert.equal(x.calls.consent,0);
});
test('tenant membership must come from trusted source', async () => {
  const x = setup({memberships:['other-tenant']});
  await rejectsCode(x.participant.search(query), 'ACCESS_DENIED');
  assert.equal(x.calls.consent,0);
});
test('missing tenant denied', async () => {
  const x = setup();
  await rejectsCode(x.participant.search({...query,tenantId:''}), 'ACCESS_DENIED');
});
test('missing consent denies before store read', async () => {
  const x = setup({consent:null});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
  assert.equal(x.calls.private,0);
});
test('purpose mismatch denies', async () => {
  const x = setup({consent:{...validConsent(),purpose:'unrelated'}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('recipient mismatch denies', async () => {
  const x = setup({consent:{...validConsent(),grantedToUserId:'worker-1'}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('organisation-granted consent cannot replace self-specific consent', async () => {
  const x = setup({consent:{...validConsent(),grantedToOrganisationId:'tenant-1'}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('a grant created by someone other than participant is rejected', async () => {
  const x = setup({consent:{...validConsent(),createdById:'admin-1'}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('revoked consent rejected', async () => {
  const x = setup({consent:{...validConsent(),status:'revoked',revokedAt:now}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('expired consent rejected', async () => {
  const x = setup({consent:{...validConsent(),expiresAt:new Date('2026-01-01')}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('missing dataScope blocks (empty is not unrestricted)', async () => {
  const x = setup({consent:{...validConsent(),dataScope:[]}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('missing AI processing consent blocks', async () => {
  const x = setup({consent:{...validConsent(),dataScope:['support_needs']}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('missing support_needs consent blocks', async () => {
  const x = setup({consent:{...validConsent(),dataScope:['ai_processing']}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('wrong action blocks', async () => {
  const x = setup({consent:{...validConsent(),sourceAction:'booking.read'}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
});
test('private retrieval succeeds only with exact synthetic scope', async () => {
  const x=setup();
  const out=await x.participant.search(query);
  assert.equal(out.hits.length,1);
  assert.equal(out.filteredBeforeRank,true);
  assert.equal(out.modelAuthority,'none');
  assert.equal(out.hits[0].sourceRef,'synthetic-statement-1');
  assert.equal(x.calls.consent,2);
  assert.deepEqual(x.calls.audits.map(a=>a.operation), ['participant_rag.search']);
});
test('exclude wrong tenant, wrong participant, null scope, live and public records', async () => {
  const x=setup({evidence:[
    privateEvidence(),
    privateEvidence({id:'wrong-tenant',tenantId:'tenant-2'}),
    privateEvidence({id:'wrong-participant',participantId:'p-2'}),
    privateEvidence({id:'null-participant',participantId:null}),
    privateEvidence({id:'null-tenant',tenantId:null}),
    privateEvidence({id:'wrong-purpose',purpose:'other'}),
    privateEvidence({id:'live',synthetic:false}),
    publicEvidence({id:'public'}),
  ]});
  const out=await x.participant.search(query);
  assert.deepEqual(out.hits.map(h=>h.id), ['e-1']);
});
test('consent revoked during asynchronous retrieval blocks result', async () => {
  const x=setup({onReadPrivate:(s)=> {s.consent={...validConsent(),status:'revoked',revokedAt:now};}});
  await rejectsCode(x.participant.search(query), 'CONSENT_REQUIRED');
  assert.equal(x.calls.audits.length,0);
});
test('newer consent version during retrieval fails closed', async () => {
  const x=setup({onReadPrivate:(s)=>{s.consent={...validConsent(),id:'consent-new'};}});
  await rejectsCode(x.participant.search(query),'CONSENT_REQUIRED');
});
test('stop triggered during retrieval blocks result', async () => {
  const x=setup({onReadPrivate:(s)=>{s.stopped=true;}});
  await rejectsCode(x.participant.search(query),'AURA_STOPPED');
});
test('evidence with stale expiry not returned', async () => {
  const x=setup({evidence:[privateEvidence({expiresAtIso:'2020-01-01T00:00:00Z'})]});
  const out=await x.participant.search(query);
  assert.deepEqual(out.hits,[]);
  assert.deepEqual(out.unknowns,['no_authorised_evidence_match']);
});
test('invalid and oversized queries rejected', async () => {
  const x=setup();
  await rejectsCode(x.participant.search({...query,query:'*'}),'INVALID_QUERY');
  await rejectsCode(x.participant.search({...query,query:'a'.repeat(241)}),'INVALID_QUERY');
  assert.equal(x.calls.session,0);
});
test('provider retrieval returns only public synthetic evidence', async () => {
  const x=setup({providers:[
    publicEvidence(), privateEvidence(),
    publicEvidence({id:'private',visibility:'participant_private'}),
    publicEvidence({id:'non-synthetic',synthetic:false}),
    publicEvidence({id:'wrong-purpose',purpose:'booking'}),
    publicEvidence({id:'associated',tenantId:'tenant-1'}),
  ]});
  const out=await x.provider.search('text communication');
  assert.deepEqual(out.hits.map(h=>h.id), ['provider-1']);
  assert.equal(x.calls.consent,0);
  assert.equal(out.sourceMode,'synthetic_only');
});
test('provider denies unauthenticated actor', async () => {
  const x=setup({actor:null});
  await rejectsCode(x.provider.search('text communication'),'NOT_AUTHENTICATED');
  assert.equal(x.calls.provider,0);
});
test('provider flag and stop also enforced after read', async () => {
  const x=setup({onReadProvider:(s)=>{s.enabled=false;}});
  await rejectsCode(x.provider.search('text communication'),'FEATURE_DISABLED');
});
test('audit failure fails closed and does not return results', async () => {
  const x=setup({failAudit:true});
  await assert.rejects(x.participant.search(query),/audit unavailable/);
});

test('production is always disabled, even when flags are enabled', () => {
  assert.equal(shouldEnableSyntheticRag({nodeEnv:'production',featureFlag:'true',auraHarnessEnabled:true}),false);
  assert.equal(shouldEnableSyntheticRag({nodeEnv:'development',featureFlag:undefined,auraHarnessEnabled:true}),false);
  assert.equal(shouldEnableSyntheticRag({nodeEnv:'development',featureFlag:'true',auraHarnessEnabled:false}),false);
  assert.equal(shouldEnableSyntheticRag({nodeEnv:'development',featureFlag:'true',auraHarnessEnabled:true}),true);
});
test('membership revoked during retrieval rejects result', async () => {
  const x=setup({onReadPrivate:(s)=>{s.memberships=[];}});
  await rejectsCode(x.participant.search(query),'ACCESS_DENIED');
  assert.equal(x.calls.audits.length,0);
});
test('session disappears during retrieval rejects result', async () => {
  const x=setup({onReadPrivate:(s)=>{s.actor=null;}});
  await rejectsCode(x.participant.search(query),'ACCESS_DENIED');
});
test('provider session revoked during retrieval rejects result', async () => {
  const x=setup({onReadProvider:(s)=>{s.actor=null;}});
  await rejectsCode(x.provider.search('text communication'),'ACCESS_DENIED');
});
