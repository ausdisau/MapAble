// Synthetic-only integration checks; no model, API, network or database access.
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const full = json('schemas/care-support-perceptual-frame.schema.json');
const maira = json('schemas/maira-care-support-output.schema.json');
const frame = json('examples/care-support-perceptual-frame.synthetic.json');
const reply = json('examples/maira-care-support-output.synthetic.json');
const evidenceIds = new Set(frame.evidence.map((e) => e.evidence_id));

function walkStrict(s) {
  if (!s || typeof s !== 'object') return;
  if (s.type === 'object') {
    assert.equal(s.additionalProperties, false);
    assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort());
    Object.values(s.properties).forEach(walkStrict);
  }
  if (s.type === 'array') walkStrict(s.items);
}
function checkRefs(ids) {
  for (const id of ids) assert.ok(evidenceIds.has(id), `unknown evidence: ${id}`);
}

test('full domain schema is a non-official 2020-12 frame', () => {
  assert.equal(full.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(full.additionalProperties, false);
  assert.equal(full.required.length, 11);
  assert.equal(Object.keys(full.$defs).length, 16);
  assert.equal(frame.metadata.regulatory_effect, 'not_an_ndia_assessment_or_funding_determination');
});
test('synthetic participant and source mapping are explicit', () => {
  assert.equal(frame.subject.record_class, 'synthetic');
  assert.equal(frame.subject.diagnosis_required, false);
  assert.equal(frame.metadata.source_mapping_status, 'source_not_extracted');
  assert.ok(frame.evidence.every((e) => e.synthetic === true));
});
test('participant restrictions stay intact', () => {
  assert.ok(frame.rights.expressed_contact_exclusions.includes('Do not contact family'));
  assert.ok(reply.explicitRestrictions.some((r) => r.restriction === 'Do not contact family'));
});
test('AURA remains proposal-only and model processing is denied', () => {
  assert.equal(frame.governance.allowed_model_authority, 'none');
  assert.equal(frame.governance.execution_mode, 'proposal_only');
  assert.equal(frame.governance.model_processing_permission, 'denied');
  assert.equal(frame.review.non_ai_route_available, true);
  assert.ok(frame.proposed_options.every((o) => o.execution_state === 'not_executed'));
  assert.equal(reply.actionAuthority, 'none');
});
test('MAIRA strict output cannot write identity, authority or consent', () => {
  walkStrict(maira);
  assert.ok(!('governance' in maira.properties));
  assert.ok(!('subject' in maira.properties));
  assert.ok(!('consent' in maira.properties));
  assert.ok(!('ndisApprovedHours' in maira.properties));
});
test('all synthetic evidence references resolve', () => {
  checkRefs(frame.input.participant_statement.evidence_ids);
  frame.perception.expressed_goals.forEach((x) => checkRefs(x.evidence_ids));
  frame.perception.activities_and_support.forEach((x) => checkRefs(x.evidence_ids));
  frame.perception.situational_context.forEach((x) => checkRefs(x.evidence_ids));
  frame.proposed_options.forEach((x) => checkRefs(x.evidence_ids));
  reply.participantStatements.forEach((x) => checkRefs(x.evidenceIds));
  reply.supportTaskCandidates.forEach((x) => checkRefs(x.evidenceIds));
  reply.explicitRestrictions.forEach((x) => checkRefs(x.evidenceIds));
  reply.proposalOptions.forEach((x) => checkRefs(x.evidenceIds));
});
