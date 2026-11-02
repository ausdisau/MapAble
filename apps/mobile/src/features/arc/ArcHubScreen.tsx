import React,{useState} from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {CarerGatewayProcedureScreen} from '../carer-gateway/CarerGatewayProcedureScreen';
import {WorkerScreeningPanel} from './WorkerScreeningPanel';
import {AgentExchangePanel} from './AgentExchangePanel';
import {TdsiiResearchPanel} from './TdsiiResearchPanel';
type Area='carers'|'workers'|'agents'|'research';
const areas:{id:Area;label:string}[]=[
  {id:'carers',label:'Carer Gateway'},
  {id:'workers',label:'Worker screening'},
  {id:'agents',label:'Agent exchange'},
  {id:'research',label:'Trust research'},
];
export function ArcHubScreen():React.ReactElement {
 const [area,setArea]=useState<Area>('carers');
 return <View style={styles.root}>
   <View style={styles.menu} accessibilityLabel="ARC sections">
     {areas.map(x=><Pressable key={x.id} accessibilityRole="button" accessibilityLabel={x.label} accessibilityState={{selected:area===x.id}} onPress={()=>setArea(x.id)}
      style={[styles.option,area===x.id&&styles.active]}><Text style={[styles.optionText,area===x.id&&styles.activeText]}>{x.label}</Text></Pressable>)}
   </View>
   <View style={styles.content} key={area}>
     {area==='carers'?<CarerGatewayProcedureScreen/>:area==='workers'?<WorkerScreeningPanel/>:area==='agents'?<AgentExchangePanel/>:<TdsiiResearchPanel/>}
   </View>
 </View>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#F7FAFC'},menu:{padding:8,flexDirection:'row',flexWrap:'wrap',gap:6,backgroundColor:'#E8F1F7'},option:{minHeight:48,justifyContent:'center',paddingHorizontal:12,paddingVertical:8,borderWidth:1,borderColor:'#A1B0BD',backgroundColor:'white',borderRadius:9},active:{backgroundColor:'#1B496F',borderColor:'#1B496F'},optionText:{fontSize:14,fontWeight:'700',color:'#183C5D'},activeText:{color:'white'},content:{flex:1}});
