import React, {useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {AgentConversationEmulator} from './AgentConversationEmulator';
import {reviewAgentIntent,ARC_AGENT_TRANSPORT_ENABLED,ARC_MCP_REMOTE_EXECUTION_ENABLED,type AgentAction,type ReviewResult} from './agentBridgePolicy';
const intents:{id:AgentAction;label:string;detail:string}[]=[
  {id:'read_carer_gateway_public',label:'Find carer services',detail:'Public regional information only'},
  {id:'read_worker_screening_guidance',label:'Understand worker screening',detail:'Official guidance, not worker status'},
  {id:'prepare_enquiry_draft',label:'Prepare a service enquiry',detail:'Synthetic preview only; no sending'},
  {id:'send_enquiry',label:'Ask agent to send an enquiry',detail:'Disabled until future independent approval'},
];
export function AgentExchangePanel():React.ReactElement {
  const [choice,setChoice]=useState<AgentAction>('read_carer_gateway_public');
  const [review,setReview]=useState<ReviewResult|null>(null);
  function preview(){setReview(reviewAgentIntent({action:choice,actor:'participant',informationClass:choice==='prepare_enquiry_draft'?'synthetic':'public',participantChoseAction:true}));}
  return <ScrollView contentContainerStyle={styles.page}>
    <Text accessibilityRole="header" style={styles.heading}>Participant–provider agent exchange</Text>
    <Text style={styles.body}>Agents may help draft requests and explain public information, but cannot represent your consent or act as a legal decision-maker. This is a LOCAL policy preview, not a live A2A service.</Text>
    <View style={styles.note}>
      <Text style={styles.body}>Agent-to-Agent transport: {ARC_AGENT_TRANSPORT_ENABLED?'Enabled':'Disabled'}</Text>
      <Text style={styles.body}>MCP remote tools: {ARC_MCP_REMOTE_EXECUTION_ENABLED?'Enabled':'Disabled'}</Text>
    </View>
    <AgentConversationEmulator/>
    <Text accessibilityRole="header" style={styles.subheading}>Review remote-agent action policy</Text>
    {intents.map(x=><Pressable key={x.id} accessibilityRole="radio" accessibilityState={{checked:choice===x.id}} accessibilityLabel={x.label}
     onPress={()=>{setChoice(x.id);setReview(null)}} style={[styles.choice,choice===x.id&&styles.selected]}>
       <Text style={styles.choiceText}>{choice===x.id?'Selected: ':''}{x.label}</Text><Text style={styles.detail}>{x.detail}</Text>
    </Pressable>)}
    <Pressable accessibilityRole="button" accessibilityLabel="Review synthetic agent request" style={styles.button} onPress={preview}><Text style={styles.buttonText}>Review synthetic agent request</Text></Pressable>
    {review?<View accessibilityLiveRegion="polite" style={styles.note}>
      <Text accessibilityRole="header" style={styles.subheading}>Policy result: {review.decision}</Text>
      <Text style={styles.body}>{review.reason}</Text>
      <Text style={styles.detail}>External transmission permitted: No. No participant, worker or provider records were sent.</Text>
    </View>:null}
    <Text style={styles.detail}>A future A2A v1.x / MCP bridge will require authenticated agents, authenticated user authority, verified recipient identity, purpose-scoped consent, replay protection, independently enforced tool allowlists, accessible human review and audit records. No sensitive data is accepted here.</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({page:{padding:20,paddingBottom:44,gap:14,backgroundColor:'#F7FAFC'},heading:{fontSize:25,fontWeight:'800',color:'#14283F'},subheading:{fontSize:19,fontWeight:'800',color:'#14283F'},body:{fontSize:16,lineHeight:24,color:'#23364B'},detail:{fontSize:14,lineHeight:21,color:'#415468'},choice:{minHeight:58,padding:14,gap:4,backgroundColor:'white',borderWidth:1,borderColor:'#A0AEBB',borderRadius:12},selected:{borderColor:'#114879',borderWidth:3},choiceText:{fontSize:17,fontWeight:'700',color:'#172F47'},button:{minHeight:54,justifyContent:'center',alignItems:'center',borderRadius:10,backgroundColor:'#183F63'},buttonText:{fontSize:17,fontWeight:'700',color:'white'},note:{padding:14,borderRadius:12,backgroundColor:'#EAF1F6',gap:5}});
