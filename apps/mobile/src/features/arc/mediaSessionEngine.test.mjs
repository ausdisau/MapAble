import test from 'node:test';
import assert from 'node:assert/strict';
import {createMediaSession,applyMediaCommand,mediaIsStale,reviewExternalTransport,
 REAL_MEDIA_ENABLED,REAL_TWILIO_ENABLED,OUTBOUND_SMS_ENABLED,MEDIA_RECORDING_ENABLED,AUTO_TRANSCRIPTION_ENABLED} from './mediaSessionEngine.ts';
import {createSession,applyCommand} from './conversationEngine.ts';
const baseGuard={providerDisclosureApproved:true,workerDisclosureApproved:true,withdrawn:false,scenarioRevision:0};
function issue(state,by,kind,more={},guard=baseGuard){
 return applyMediaCommand(state,{id:`${state.taskId}-${kind}-${state.revision}`,expectedRevision:state.revision,kind,by,chosenByHuman:true,...more},guard);
}
function done(session,by,kind){const x=applyCommand(session,{id:'action-'+session.revision,taskId:session.taskId,expectedRevision:session.revision,by,kind,explicitlyChosen:true});assert.equal(x.allowed,true,x.code);return x.session}
function readyConversation(){let s=createSession();s=done(s,'participant','prepare_draft');s=done(s,'participant','approve_provider_share');s=done(s,'provider','prepare_provider_offer');s=done(s,'participant','approve_worker_share');return s}
test('no media, SMS, transcription or recording active by default',()=>{
 for(const flag of [REAL_MEDIA_ENABLED,REAL_TWILIO_ENABLED,OUTBOUND_SMS_ENABLED,MEDIA_RECORDING_ENABLED,AUTO_TRANSCRIPTION_ENABLED])assert.equal(flag,false);
});
test('cannot start real transport or recording from any party',()=>{
 const s=createMediaSession('arc-demo-task-daily_living');
 for(const by of ['participant','provider','support_worker']){
  for(const kind of ['request_live_connection','send_sms','request_recording']){
   const x=issue(s,by,kind);assert.equal(x.allowed,false);assert.strictEqual(x.state,s);
  }
 }
 for(const action of ['twilio_video_room','twilio_voice_call','twilio_sms','webrtc_offer','turn_token','media_recording','transcription'])assert.equal(reviewExternalTransport(action).allowed,false);
});
test('proposal requires participant consent for provider and worker sharing',()=>{
 const s=createMediaSession('arc-demo-task-daily_living');
 assert.equal(issue(s,'participant','propose',{mode:'video',transport:'twilio_video',attendees:['participant','support_worker','provider']},{...baseGuard,workerDisclosureApproved:false}).code,'WORKER_SCOPE_MISSING');
 assert.equal(issue(s,'provider','propose',{mode:'video',transport:'twilio_video',attendees:['participant','provider']},{...baseGuard,providerDisclosureApproved:false}).code,'PROVIDER_SCOPE_MISSING');
});
test('cannot invite without participant or invent a fourth party',()=>{
 const s=createMediaSession('arc-demo-task-daily_living');
 for(const attendees of [[],['provider','support_worker'],['participant','participant'],['participant','provider','outsider'],['participant']]){
  assert.equal(issue(s,'participant','propose',{mode:'video',transport:'twilio_video',attendees}).allowed,false);
 }
});
test('audio cannot use invalid future transport pairing',()=>{
 const s=createMediaSession('arc-demo-task-daily_living');
 assert.equal(issue(s,'participant','propose',{mode:'video',transport:'twilio_voice',attendees:['participant','provider']}).code,'INVALID_TRANSPORT');
});
test('three-party Twilio video emulation requires participant and both acknowledgements',()=>{
 const conversation=readyConversation();const guard={...baseGuard,scenarioRevision:conversation.revision};
 let s=createMediaSession(conversation.taskId,conversation.revision);
 s=issue(s,'participant','propose',{mode:'video',transport:'twilio_video',attendees:['participant','provider','support_worker']},guard).state;
 assert.equal(s.stage,'proposed');assert.equal(issue(s,'provider','start_demo',{},guard).code,'NOT_PARTICIPANT');
 assert.equal(issue(s,'participant','start_demo',{},guard).code,'NOT_READY');
 s=issue(s,'participant','participant_approve',{},guard).state;
 assert.equal(issue(s,'support_worker','start_demo',{},guard).code,'NOT_PARTICIPANT');
 s=issue(s,'provider','acknowledge',{},guard).state;
 assert.equal(s.stage,'awaiting_approvals');assert.equal(issue(s,'participant','start_demo',{},guard).code,'NOT_READY');
 s=issue(s,'support_worker','acknowledge',{},guard).state;
 assert.equal(s.stage,'ready_for_demo');
 s=issue(s,'participant','start_demo',{},guard).state;
 assert.equal(s.stage,'demo_active');assert.equal(s.recording,false);assert.equal(s.transcription,false);assert.equal(s.activeExternalTracks,0);
 assert.equal(s.audit.every(a=>a.delivery==='local_only'),true);
 const ended=issue(s,'support_worker','end_demo',{},guard);assert.equal(ended.allowed,true);assert.equal(ended.state.stage,'ended');
});
test('two-party audio preview uses Twilio Voice but never dials',()=>{
 let s=createMediaSession('arc-demo-task-daily_living');s=issue(s,'participant','propose',{mode:'audio',transport:'twilio_voice',attendees:['participant','provider']}).state;
 s=issue(s,'participant','participant_approve').state;
 s=issue(s,'provider','acknowledge').state;
 s=issue(s,'participant','start_demo').state;
 assert.equal(s.stage,'demo_active');assert.equal(s.activeExternalTracks,0);
});
test('consent withdrawal ends demo and cannot be overridden',()=>{
 let s=createMediaSession('arc-demo-task-daily_living');s=issue(s,'participant','propose',{mode:'audio',transport:'webrtc_custom',attendees:['participant','provider']}).state;
 const revoked=issue(s,'participant','withdraw_consent');assert.equal(revoked.allowed,true);s=revoked.state;
 assert.equal(s.stage,'revoked');assert.equal(issue(s,'participant','participant_approve').allowed,false);
 assert.equal(issue(s,'provider','propose',{mode:'audio',transport:'twilio_voice',attendees:['participant','provider']}).allowed,false);
});
test('media session becomes stale after conversation revision',()=>{
 let s=createMediaSession('arc-demo-task-daily_living');s=issue(s,'participant','propose',{mode:'audio',transport:'twilio_voice',attendees:['participant','provider']}).state;
 assert.equal(mediaIsStale(s,{...baseGuard,scenarioRevision:1}),true);
 assert.equal(issue(s,'participant','participant_approve',{}, {...baseGuard,scenarioRevision:1}).code,'STALE_MEDIA_CONTEXT');
});
test('human action, role, optimistic revision and nonce checks',()=>{
 let s=createMediaSession('arc-demo-task-daily_living');
 const c={id:'test-c',expectedRevision:0,kind:'propose',by:'participant',chosenByHuman:false,mode:'video',transport:'twilio_video',attendees:['participant','provider']};
 assert.equal(applyMediaCommand(s,c,baseGuard).code,'NO_HUMAN_CHOICE');
 const proposed=applyMediaCommand(s,{...c,chosenByHuman:true},baseGuard);assert.equal(proposed.allowed,true);s=proposed.state;
 assert.equal(applyMediaCommand(s,{...c,chosenByHuman:true},baseGuard).code,'REPLAY');
 assert.equal(applyMediaCommand(s,{...c,chosenByHuman:true,id:'newid'},baseGuard).code,'STALE_REVISION');
 assert.equal(issue(s,'support_worker','participant_approve').code,'NOT_PARTICIPANT');
});
test('no accidental persistent personal data appears in synthetic event log',()=>{
 const c=readyConversation();assert.equal(c.workerScreening,'NOT_INDEPENDENTLY_VERIFIED');
 assert.equal(c.messages.every(m=>m.isSynthetic),true);
 assert.equal(c.audit.every(e=>e.actorIdentityVerified===false&&e.delivery==='local_only'),true);
});
