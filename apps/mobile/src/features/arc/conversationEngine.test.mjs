import test from 'node:test';
import assert from 'node:assert/strict';
import {createSession,applyCommand,availableCommands,visibleMessages,a2aPreview,SCENARIOS} from './conversationEngine.ts';
function doIt(s,by,kind){const x=applyCommand(s,{taskId:s.taskId,id:'cmd-'+s.revision,expectedRevision:s.revision,by,kind,explicitlyChosen:true});assert.equal(x.allowed,true,x.code);return x.session;}
test('all scenarios are fictional and safe',()=>{assert.equal(SCENARIOS.length,3);for(const x of SCENARIOS)assert.equal(createSession(x.id).messages.length,0)});
test('participant/provider/worker exchange is sequenced and audience-limited',()=>{
 let s=createSession();s=doIt(s,'participant','prepare_draft');
 assert.equal(visibleMessages(s,'provider').length,0);
 s=doIt(s,'participant','approve_provider_share');
 assert.equal(visibleMessages(s,'provider').length,1);
 assert.equal(visibleMessages(s,'support_worker').length,0);
 s=doIt(s,'provider','prepare_provider_offer');
 s=doIt(s,'participant','approve_worker_share');
 assert.equal(visibleMessages(s,'support_worker').length,1);
 s=doIt(s,'support_worker','ask_worker_clarification');
 s=doIt(s,'participant','answer_worker_clarification');
 s=doIt(s,'support_worker','acknowledge_worker_tasks');
 s=doIt(s,'participant','confirm_simulation');
 assert.equal(s.stage,'simulated_confirmation');
 assert.equal(s.messages.length,8);
 assert.equal(s.audit.length,8);
 assert.equal(a2aPreview(s).transportAvailable,false);
});
test('worker cannot act before participant sharing',()=>{
 const s=createSession();const res=applyCommand(s,{taskId:s.taskId,id:'test',expectedRevision:s.revision,by:'support_worker',kind:'acknowledge_worker_tasks',explicitlyChosen:true});assert.equal(res.allowed,false);
});
test('role changes are not authentication',()=>{
 let s=createSession();s=doIt(s,'participant','prepare_draft');
 const x=applyCommand(s,{taskId:s.taskId,id:'fake',expectedRevision:s.revision,by:'provider',kind:'approve_provider_share',explicitlyChosen:true});assert.equal(x.allowed,false);
});
test('withdrawal revokes sharing and stops progression',()=>{
 let s=createSession();s=doIt(s,'participant','prepare_draft');s=doIt(s,'participant','approve_provider_share');s=doIt(s,'participant','withdraw_consent');
 assert.equal(s.providerDisclosureApproved,false);assert.equal(s.workerDisclosureApproved,false);assert.equal(s.cancelled,true);
 assert.equal(availableCommands(s,'provider').length,0);
});
