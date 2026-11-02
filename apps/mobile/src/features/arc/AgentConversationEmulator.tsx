/**
 * MapAble participant–worker–provider three-agent sandbox.
 * Every event is created by a deliberate screen tap. All data is synthetic.
 * Roles are switchable demonstration personas, NOT actual authenticated people.
 */
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SCENARIOS, createSession, getScenario, applyCommand, availableCommands, visibleMessages,
  type Party, type ScenarioId, type CommandKind,
} from './conversationEngine';
import {
  createMediaSession, applyMediaCommand, mediaIsStale, reviewExternalTransport,
  type MediaMode, type MediaTransport, type MediaCommandKind,
} from './mediaSessionEngine';

const palette = {
  ink: '#183044', soft: '#44576A', muted: '#EBF3F8', border: '#8EA8B8',
  primary: '#184F75', danger: '#812C31', paper: '#FFFFFF', green: '#126154',
};
const roles: readonly { id: Party; title: string }[] = [
  { id:'participant', title:'Participant' },
  { id:'support_worker', title:'Support worker' },
  { id:'provider', title:'Provider' },
];
const actionLabels: Readonly<Record<CommandKind, string>> = {
  prepare_draft: 'Write my request',
  approve_provider_share: 'Allow synthetic provider to read',
  prepare_provider_offer: 'Draft a provider response',
  approve_worker_share: 'Allow synthetic worker to read',
  ask_worker_clarification: 'Ask participant a question',
  answer_worker_clarification: 'Answer worker question',
  acknowledge_worker_tasks: 'Acknowledge worker task brief',
  confirm_simulation: 'Confirm simulated plan',
  revise_provider_offer: 'Revise proposal (new approval required)',
  decline_offer: 'Decline the proposal',
  withdraw_consent: 'Withdraw synthetic sharing consent',
  raise_worker_concern: 'Raise a safety or competence concern',
};
const mediaModeOptions: readonly { id: MediaMode; title:string }[] = [
  {id:'audio',title:'Voice'}, {id:'video',title:'Video'},
];
const transportOptions: readonly {id: MediaTransport; title: string; modes:readonly MediaMode[]}[] = [
  {id:'twilio_video',title:'Twilio Video (WebRTC)',modes:['audio','video']},
  {id:'twilio_voice',title:'Twilio Voice (audio)',modes:['audio']},
  {id:'web_rtc_custom',title:'Custom WebRTC (future)',modes:['audio','video']},
];

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.choice, selected && styles.choiceSelected]}
  ><Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text></Pressable>;
}
function Action({label, onPress, destructive=false}: {label:string;onPress:()=>void;destructive?:boolean}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({pressed}) => [styles.action, destructive && styles.destructive, pressed && styles.pressed]}>
    <Text style={[styles.actionText, destructive && styles.destructiveText]}>{label}</Text>
  </Pressable>;
}

export function AgentConversationEmulator(): React.ReactElement {
  const [conversation, setConversation] = useState(() => createSession());
  const [role, setRole] = useState<Party>('participant');
  const [media, setMedia] = useState(() => createMediaSession('arc-demo-task-daily_living'));
  const [mode, setMode] = useState<MediaMode>('video');
  const [transport, setTransport] = useState<MediaTransport>('twilio_video');
  const [notice, setNotice] = useState('');
  const [mediaNotice, setMediaNotice] = useState('');
  const scenario = getScenario(conversation);
  const mediaGuard = {
    providerDisclosureApproved: conversation.providerDisclosureApproved,
    workerDisclosureApproved: conversation.workerDisclosureApproved,
    withdrawn: conversation.cancelled,
    scenarioRevision: conversation.revision,
  };
  const sharedToWorker = conversation.workerDisclosureApproved;
  const sharedToProvider = conversation.providerDisclosureApproved;
  const mediaStale = media.stage !== 'idle' && mediaIsStale(media, mediaGuard);
  const currentCommands = availableCommands(conversation, role);

  function chooseScenario(id: ScenarioId) {
    const next = createSession(id);
    setConversation(next);setMedia(createMediaSession(next.taskId));setRole('participant');
    setNotice('Scenario reset. No historical demonstration messages were retained.');setMediaNotice('');
  }
  function perform(kind: CommandKind) {
    const result = applyCommand(conversation, {
      id: `${conversation.taskId}-command-${conversation.revision + 1}`,
      taskId: conversation.taskId, expectedRevision: conversation.revision,
      by: role, kind, explicitlyChosen: true,
    });
    setNotice(result.detail);
    if (result.allowed) setConversation(result.session);
  }
  function performMedia(kind: MediaCommandKind) {
    const result = applyMediaCommand(media, {
      id: `${media.taskId}-media-${media.revision + 1}`,
      expectedRevision: media.revision, kind, by: role, chosenByHuman: true,
      ...(kind==='propose' ? {mode, transport, attendees: ['participant','support_worker','provider'] as Party[]} : {}),
    }, mediaGuard);
    setMediaNotice(`${result.code}: ${result.explanation}`);
    if (result.allowed) setMedia(result.state);
  }
  const viewing = visibleMessages(conversation, role);
  return <View style={styles.wrapper}>
    <Text accessibilityRole="header" style={styles.header}>Three-party agent communication emulator</Text>
    <Text style={styles.body}>Run a fictional support-request conversation. Every role is simulated on this device; no person, provider or worker is connected.</Text>
    <View style={styles.notice}><Text style={styles.warning}>SYNTHETIC ONLY · No external messages, calls, data sharing or recordings.</Text></View>

    <Text accessibilityRole="header" style={styles.subheader}>1. Choose a support scenario</Text>
    <View style={styles.row}>{SCENARIOS.map(s => <Choice key={s.id} selected={conversation.scenarioId===s.id} label={s.title} onPress={()=>chooseScenario(s.id)}/>)}</View>
    <Text style={styles.body}>Goal: {scenario.participantGoal}</Text>
    <Text style={styles.small}>{scenario.caveat}</Text>

    <Text accessibilityRole="header" style={styles.subheader}>2. Choose a simulated role</Text>
    <View style={styles.row}>{roles.map(r => <Choice key={r.id} selected={role===r.id} label={r.title} onPress={()=>{setRole(r.id);setNotice('Role view switched for demonstration only; no identity verification occurred.');}}/>)}</View>
    <Text style={styles.small}>A real worker or provider must authenticate separately. Switching roles here does not grant permissions.</Text>

    <Text accessibilityRole="header" style={styles.subheader}>3. Conversation and permissions</Text>
    <View style={styles.card}>
      <Text style={styles.label}>Task status: {conversation.stage.replace(/_/g,' ')}</Text>
      <Text style={styles.small}>Provider disclosure: {sharedToProvider ? 'Approved for synthetic request' : 'Not approved'} · Worker disclosure: {sharedToWorker ? 'Approved for synthetic task' : 'Not approved'}</Text>
      <Text style={styles.small}>Worker screening: NOT INDEPENDENTLY VERIFIED. Worker credentials, availability and competence are not evaluated.</Text>
    </View>
    <View style={styles.actions}>{currentCommands.length ? currentCommands.map(kind=>
      <Action key={kind} label={actionLabels[kind]} onPress={()=>perform(kind)} destructive={kind==='withdraw_consent'||kind==='decline_offer'}/>) : <Text style={styles.small}>No available actions for this demonstration role at this stage. Switch to another role or reset the scenario.</Text>}</View>
    {notice ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{notice}</Text> : null}

    <Text accessibilityRole="header" style={styles.subheader}>4. Accessible message transcript</Text>
    <Text style={styles.small}>Showing only messages visible to the selected simulated role; participant has access to the whole demonstration history.</Text>
    <View style={styles.transcript}>{viewing.length ? viewing.map(m =>
      <View key={m.id} style={styles.message} accessible accessibilityLabel={`${m.from.replace('_',' ')} to ${m.to.join(', ')}: ${m.text}`}>
        <Text style={styles.label}>{m.from.replace('_',' ')} → {m.to.map(x=>x.replace('_',' ')).join(', ')}</Text>
        <Text style={styles.body}>{m.text}</Text>
      </View>
    ) : <Text style={styles.small}>No messages are visible to this role. Start with “Write my request” as the participant.</Text>}</View>

    <Text accessibilityRole="header" style={styles.subheader}>5. WebRTC and Twilio media session</Text>
    <Text style={styles.body}>These controls simulate permission negotiation, not a real audio/video call. Your camera and microphone are never requested.</Text>
    <View style={styles.row}>{mediaModeOptions.map(o => <Choice key={o.id} label={o.title} selected={mode===o.id} onPress={()=>{
      setMode(o.id); if(o.id==='video'&&transport==='twilio_voice')setTransport('twilio_video');
    }}/>)}</View>
    <View style={styles.row}>{transportOptions.filter(o=>o.modes.includes(mode)).map(o => <Choice key={o.id} label={o.title} selected={transport===o.id} onPress={()=>setTransport(o.id)}/>)}</View>
    <View style={styles.card}>
      <Text style={styles.label}>Media status: {media.stage.replace(/_/g,' ')}</Text>
      <Text style={styles.small}>Proposed transport: {media.transport ?? 'None'} · Mode: {media.mode ?? 'None'}</Text>
      <Text style={styles.small}>Recording: OFF · Transcription: OFF · Active device media streams: 0</Text>
      {mediaStale ? <Text style={styles.warning}>The request or permission changed. End and re-propose before continuing.</Text> : null}
      <Text style={styles.small}>Video, voice and SMS require server-issued tokens and an explicit lawful sharing basis. This release has no connected Twilio account.</Text>
    </View>
    <View style={styles.actions}>
      {(media.stage === 'idle' || media.stage==='ended') && (role==='participant'||role==='provider') ?
        <Action label="Propose synthetic three-party call" onPress={()=>performMedia('propose')}/> : null}
      {media.stage==='proposed'&&role==='participant'?<Action label="Approve simulated media invitation" onPress={()=>performMedia('participant_approve')}/> : null}
      {media.stage==='awaiting_approvals'&&role!=='participant'&&media.attendees.includes(role)?
        <Action label={`Acknowledge as ${role.replace('_',' ')}`} onPress={()=>performMedia('acknowledge')}/> : null}
      {media.stage==='ready_for_demo'&&role==='participant'?<Action label="Start local call demonstration" onPress={()=>performMedia('start_demo')}/> : null}
      {['proposed','awaiting_approvals','ready_for_demo','demo_active'].includes(media.stage)&&media.attendees.includes(role)?
        <Action label="End simulated call" onPress={()=>performMedia('end_demo')}/> : null}
      {role==='participant'&&media.stage!=='idle'&&media.stage!=='revoked'?
        <Action label="Withdraw simulated media consent" destructive onPress={()=>performMedia('withdraw_consent')}/> : null}
      <Action label="Check if a real Twilio call is available" onPress={()=>{
        const reviewed=reviewExternalTransport(mode==='audio'?'twilio_voice_call':'twilio_video_room');
        setMediaNotice(`${reviewed.decision}: ${reviewed.reason}`);
      }}/>
    </View>
    {mediaNotice ? <Text accessibilityLiveRegion="polite" style={styles.feedback}>{mediaNotice}</Text> : null}
    <View style={styles.notice}><Text style={styles.body}>AAC/text fallback is always the primary accessible route. An AI agent cannot silently call, record, enable captions, share a phone number, dispatch support, or initiate emergency services.</Text></View>
    <Text style={styles.small}>Under development: implement server-side permission checks and verified session tokens before considering real WebRTC or Twilio. All local previews are untrusted, ephemeral and synthetic.</Text>
  </View>;
}

const styles=StyleSheet.create({
  wrapper:{gap:14,paddingVertical:8},header:{fontSize:23,fontWeight:'800',color:palette.ink,lineHeight:31},
  subheader:{fontSize:19,fontWeight:'800',color:palette.ink,lineHeight:27,marginTop:3},
  body:{fontSize:16,lineHeight:24,color:palette.ink},small:{fontSize:14,lineHeight:21,color:palette.soft},
  warning:{fontSize:15,lineHeight:22,fontWeight:'700',color:palette.danger},
  notice:{padding:14,backgroundColor:palette.muted,borderRadius:11},
  card:{padding:14,borderRadius:12,borderWidth:1,borderColor:palette.border,backgroundColor:palette.paper,gap:8},
  label:{fontSize:15,lineHeight:22,fontWeight:'800',color:palette.ink},row:{flexDirection:'row',flexWrap:'wrap',gap:8},
  choice:{minHeight:48,paddingHorizontal:12,paddingVertical:10,justifyContent:'center',borderRadius:10,borderWidth:1,borderColor:palette.border,backgroundColor:palette.paper},
  choiceSelected:{backgroundColor:palette.primary,borderColor:palette.primary},
  choiceText:{fontSize:15,fontWeight:'700',color:palette.primary},choiceTextSelected:{color:'#FFFFFF'},
  actions:{gap:8},action:{minHeight:50,justifyContent:'center',paddingHorizontal:14,paddingVertical:10,backgroundColor:palette.primary,borderRadius:9},
  actionText:{fontSize:16,lineHeight:22,fontWeight:'700',color:'#FFFFFF',textAlign:'center'},
  destructive:{backgroundColor:'#FFF2F0',borderColor:palette.danger,borderWidth:1},destructiveText:{color:palette.danger},
  pressed:{opacity:0.8},feedback:{fontSize:15,lineHeight:23,color:palette.soft,backgroundColor:palette.muted,padding:12,borderRadius:8},
  transcript:{gap:8},message:{padding:12,gap:6,borderWidth:1,borderColor:palette.border,backgroundColor:palette.paper,borderRadius:10},
});
