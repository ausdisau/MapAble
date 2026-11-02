import React from 'react';
import {ScrollView,StyleSheet,Text,View} from 'react-native';
import {ARC_RESEARCH_COLLECTION_ENABLED} from './agentBridgePolicy';
export function TdsiiResearchPanel():React.ReactElement {
  return <ScrollView contentContainerStyle={styles.page}>
    <Text accessibilityRole="header" style={styles.title}>Trust in Disability Services and Inclusion Index</Text>
    <Text style={styles.body}>Independent research — separate from your NDIS plan, Carer Gateway support, provider registration and worker-screening checks.</Text>
    <View style={styles.box}>
      <Text style={styles.label}>RESEARCH DRAFT</Text>
      <Text style={styles.body}>FormHug survey verified: 14 trust and inclusion statements, voluntary research consent and perspectives from people with disability, carers, workers, providers and advocates.</Text>
      <Text style={styles.body}>Research submissions: {ARC_RESEARCH_COLLECTION_ENABLED?'Enabled':'Disabled in MapAble'}.</Text>
      <Text style={styles.body}>Survey responses on the linked FormHug draft at inspection: 0. Do not interpret this as a national research result.</Text>
    </View>
    <Text style={styles.body}>MapAble does not import the standalone React/Vite survey source in this change because its ZIP was not available for inspection.</Text>
    <Text style={styles.body}>Before any future integration: verify research ethics, plain-language consent, privacy, secure submission and withdrawal, accessibility testing, aggregation thresholds and independent governance. Individual responses must not determine provider ranking, service access or worker status.</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({page:{padding:20,paddingBottom:44,gap:16,backgroundColor:'#F7FAFC'},title:{fontSize:25,fontWeight:'800',lineHeight:34,color:'#152D42'},body:{fontSize:16,lineHeight:25,color:'#23374D'},box:{padding:16,borderWidth:1,borderColor:'#A7B5C2',backgroundColor:'white',borderRadius:12,gap:12},label:{fontSize:14,fontWeight:'800',letterSpacing:0.6,color:'#194B75'}});
