import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewAgentIntent,ARC_AGENT_TRANSPORT_ENABLED,ARC_MCP_REMOTE_EXECUTION_ENABLED,ARC_RESEARCH_COLLECTION_ENABLED} from './agentBridgePolicy.ts';
const common={actor:'participant',informationClass:'public',participantChoseAction:true};
test('all external capabilities remain default off',()=>{
 assert.equal(ARC_AGENT_TRANSPORT_ENABLED,false);assert.equal(ARC_MCP_REMOTE_EXECUTION_ENABLED,false);assert.equal(ARC_RESEARCH_COLLECTION_ENABLED,false);
});
for(const action of ['read_carer_gateway_public','read_worker_screening_guidance','read_public_provider_listing','read_tdsii_research_status']){
 test(`public ${action} is preview-only`,()=>{
  const x=reviewAgentIntent({...common,action});assert.equal(x.decision,'ALLOW');assert.equal(x.transmissionPermitted,false);
 });
}
for(const action of ['make_ndis_eligibility_decision','infer_person_capacity','score_individual_provider_trust','authorise_representative']){
 test(`${action} hard blocked`,()=>assert.equal(reviewAgentIntent({...common,action}).decision,'BLOCK_HARD_INVARIANT'));
}
for(const action of ['send_enquiry','disclose_private_care_information','retrieve_private_worker_clearance','submit_research_response','book_respite','request_emergency_dispatch','publish_provider_evaluation']){
 test(`${action} held`,()=>assert.equal(reviewAgentIntent({...common,action}).decision,'HOLD_BRANCH'));
}
for(const cls of ['personal','sensitive']){
 test(`${cls} data held on read-only action`,()=>assert.equal(reviewAgentIntent({...common,action:'read_carer_gateway_public',informationClass:cls}).decision,'HOLD_BRANCH'));
}
test('rejects unauthorised private MCP tool',()=>assert.equal(reviewAgentIntent({...common,action:'read_carer_gateway_public',proposedTool:'arc.private_worker_clearance'}).decision,'HOLD_BRANCH'));
test('allows local synthetic participant draft with a recorded choice',()=>{
 const r=reviewAgentIntent({...common,action:'prepare_enquiry_draft',informationClass:'synthetic'});
 assert.equal(r.decision,'ALLOW_WITH_SAFEGUARDS');assert.equal(r.safeLocalPreview,true);assert.equal(r.transmissionPermitted,false);
});
test('does not infer care recipient permission from relationship',()=>assert.equal(reviewAgentIntent({...common,action:'prepare_carer_plan_draft',informationClass:'synthetic',actor:'carer',recipientInvolved:true}).decision,'HOLD_BRANCH'));
test('explicit consent allows synthetic planning only',()=>{
 const r=reviewAgentIntent({...common,action:'prepare_carer_plan_draft',informationClass:'synthetic',actor:'carer',recipientInvolved:true,recipientHasConsented:true});assert.equal(r.decision,'ALLOW_WITH_SAFEGUARDS');assert.equal(r.transmissionPermitted,false);
});
test('provider agent cannot originate a participant-controlled draft',()=>assert.equal(reviewAgentIntent({...common,actor:'provider_staff',action:'prepare_enquiry_draft'}).decision,'HOLD_BRANCH'));
test('no choice means no draft',()=>assert.equal(reviewAgentIntent({...common,action:'prepare_enquiry_draft',participantChoseAction:false}).decision,'HOLD_BRANCH'));
for (const actor of ['participant','carer','provider_staff','advocate','agent']) {
 for(const informationClass of ['public','synthetic','personal','sensitive']){
  test(`never transmits as ${actor}/${informationClass}`,()=>{
   for(const action of ['read_carer_gateway_public','prepare_enquiry_draft','send_enquiry','request_emergency_dispatch']) {
    assert.equal(reviewAgentIntent({action,actor,informationClass,participantChoseAction:true}).transmissionPermitted,false);
   }
  });
 }
}
