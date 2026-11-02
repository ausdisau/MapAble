import React, {useState} from 'react';
import {Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

type ViewAs = 'participant'|'registered'|'unregistered'|'worker';
const options: {id:ViewAs; label:string; message:string}[] = [
 {id:'participant',label:'Participant',message:'Individual screening results are not a public name search. Self-managed participants can use the authorised worker-screening portal and link the worker before checking their result.'},
 {id:'registered',label:'Registered provider',message:'Registered providers use the NEW NDIS Commission Portal for worker screening tasks from 12 October 2026. Use an authorised Worker Screening Officer account; verify linkage, clearance, expiry and eligible-to-work status.'},
 {id:'unregistered',label:'Unregistered provider',message:'Unregistered providers continue using the existing worker screening portal, with authorised identity and employer linking.'},
 {id:'worker',label:'Worker',message:'Apply and check your own status through the State or Territory Worker Screening Unit where you live. A clearance is not a statement about competence or employment.'},
];
const SOURCE='https://www.ndiscommission.gov.au/workforce/worker-screening';
export function WorkerScreeningPanel():React.ReactElement {
 const [selected,setSelected]=useState<ViewAs>('participant');
 const [error,setError]=useState('');
 return <ScrollView contentContainerStyle={styles.page}>
   <Text accessibilityRole="header" style={styles.heading}>NDIS worker screening — guidance</Text>
   <Text style={styles.note}>CURRENT SCREENING STATUS: NOT INDEPENDENTLY VERIFIED. This app does not access the protected Worker Screening Database, store worker identifiers or certify worker suitability.</Text>
   <View style={styles.grid}>
    {options.map(option=><Pressable key={option.id} accessibilityRole="button" accessibilityLabel={option.label} accessibilityState={{selected:option.id===selected}}
      onPress={()=>setSelected(option.id)} style={[styles.choice,selected===option.id && styles.active]}>
      <Text style={[styles.choiceText, selected===option.id && styles.activeText]}>{option.label}</Text>
    </Pressable>)}
   </View>
   <Text style={styles.body}>{options.find(x=>x.id===selected)?.message}</Text>
   <Text style={styles.body}>Provider registration, individual worker screening and public enforcement findings are three separate regulatory evidence sources.</Text>
   <Text style={styles.body}>Official statuses (when verified by an authorised account): Clearance, Pending, Interim bar, Exclusion, Suspension, No valid clearance. Do not infer any result from this screen.</Text>
   <Pressable accessibilityRole="link" onPress={()=>{void Linking.openURL(SOURCE).catch(()=>setError('Unable to open the official website. Visit ndiscommission.gov.au/workforce/worker-screening'));}} style={styles.link}>
     <Text style={styles.linkText}>Open official worker-screening guidance</Text>
   </Pressable>
   {error?<Text accessibilityRole="alert" style={styles.note}>{error}</Text>:null}
   <Text style={styles.small}>Official information checked: 2 November 2026. Read-only preview; human verification remains required.</Text>
 </ScrollView>;
}
const styles=StyleSheet.create({page:{padding:20,paddingBottom:44,gap:16,backgroundColor:'#F7FAFC'},heading:{fontSize:25,fontWeight:'800',color:'#14283F'},note:{fontSize:16,lineHeight:23,color:'#374151'},body:{fontSize:17,lineHeight:26,color:'#172B41'},small:{fontSize:14,lineHeight:20,color:'#455565'},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},choice:{minHeight:48,paddingHorizontal:14,paddingVertical:12,borderRadius:10,borderWidth:1,borderColor:'#64748B',backgroundColor:'white'},active:{backgroundColor:'#194B75'},choiceText:{fontWeight:'700',fontSize:16,color:'#194B75'},activeText:{color:'white'},link:{minHeight:50,justifyContent:'center',padding:12,borderWidth:1,borderColor:'#194B75',borderRadius:9},linkText:{fontWeight:'700',fontSize:16,color:'#194B75',textDecorationLine:'underline'}});
