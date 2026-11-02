/** Informational prototype only - does not collect, save or transmit client data. */
import React, {useState} from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet, Linking} from 'react-native';

type Section = 'information'|'planning'|'emergency'|'complaints';
const contact = '1800 422 737';
const publicLinks = [
  {label:'Open official provider directory', url:'https://www.carergateway.gov.au/about-us/local-service-provider'},
  {label:'Request official Carer Gateway contact',url:'https://www.carergateway.gov.au/request-call-back'},
  {label:'Open TBS complaints information',url:'https://www.benevolent.org.au/get-in-touch/feedback-and-complaints'},
] as const;
const sections: Record<Section,{label:string; heading:string; text:string; next:string}> = {
  information: {
    label:'Find support',heading:'Carer Gateway in Sydney',
    text:'The Benevolent Society is listed as the NSW1 lead Carer Gateway provider. If your area is uncertain, check the national Carer Gateway directory. General information is available without creating a MapAble profile.',
    next:'National Carer Gateway: '+contact+' (Monday to Friday, 8 am to 5 pm). You can also request an official call-back.'
  },
  planning: {
    label:'Plan my support',heading:'Prepare your goals',
    text:'A trained Carer Gateway support worker can help discuss your needs and available services. MapAble can help prepare an editable list of priorities but cannot complete an official Carers Star assessment or determine your eligibility.',
    next:'Draft only. Nothing is sent, booked, funded or stored in this prototype.'
  },
  emergency: {
    label:'Emergency respite',heading:'An unplanned interruption in care',
    text:'For emergency respite assistance call Carer Gateway on 1800 422 737, available 24 hours a day, 7 days a week for emergency respite queries. A suitable service is not guaranteed. For immediate danger or medical emergencies call 000.',
    next:'MapAble cannot dispatch workers or arrange respite. Seek a human service response.'
  },
  complaints: {
    label:'Feedback and complaints',heading:'Your concerns matter',
    text:'The Benevolent Society accepts anonymous complaints, offers interpreter and relay support, says it acknowledges feedback within two working days and aims to resolve complaints within 21 days. You can ask for a senior review or seek external assistance.',
    next:'Use the official TBS feedback channels. This MapAble page does not send a complaint.'
  },
};
export function CarerGatewayProcedureScreen(): React.ReactElement {
  const [section,setSection] = useState<Section>('information');
  const [notice,setNotice] = useState('');
  return <ScrollView contentContainerStyle={styles.page} accessibilityLabel="Carer Gateway information and options">
    <Text accessibilityRole="header" style={styles.title}>Carer Gateway - MapAble guidance</Text>
    <Text style={styles.note}>Independent, read-only information. Not a government or Benevolent Society app. No client data leaves this screen.</Text>
    <View style={styles.actions} accessibilityRole="tablist">
      {(Object.keys(sections) as Section[]).map(k => <Pressable key={k}
        accessibilityRole="tab" accessibilityState={{selected:section===k}}
        accessibilityLabel={sections[k].label}
        onPress={()=>setSection(k)} style={[styles.tab,section===k&&styles.selected]}>
        <Text style={[styles.tabLabel,section===k&&styles.selectedText]}>{sections[k].label}</Text>
      </Pressable>)}
    </View>
    <Text accessibilityRole="header" style={styles.heading}>{sections[section].heading}</Text>
    <Text style={styles.paragraph}>{sections[section].text}</Text>
    <Text accessibilityRole="text" style={styles.next}>{sections[section].next}</Text>
    <Text accessibilityRole="header" style={styles.heading}>Official contact pathways</Text>
    {publicLinks.map(link => <Pressable key={link.url} accessibilityRole="link"
      accessibilityLabel={link.label} style={styles.publicLink} onPress={() => {
        Linking.openURL(link.url).catch(() => setNotice('Could not open the external website. You can type the website address instead.'));
      }}>
      <Text style={styles.publicLinkText}>{link.label}</Text>
    </Pressable>)}
    {notice ? <Text accessibilityRole="alert" style={styles.note}>{notice}</Text> : null}
    <Text style={styles.footer}>Official directory: carergateway.gov.au/about-us/local-service-provider</Text>
    <Text style={styles.footer}>The Benevolent Society: benevolent.org.au/get-in-touch/feedback-and-complaints</Text>
    <Text style={styles.footer}>Current source checked: 2 November 2026. Source pages may change.</Text>
  </ScrollView>;
}
const styles=StyleSheet.create({
  page:{padding:20,paddingBottom:44,backgroundColor:'#F7FAFC',gap:14},
  title:{fontSize:27,lineHeight:35,fontWeight:'700',color:'#132A3A'},
  note:{fontSize:16,lineHeight:24,color:'#33485B'},
  actions:{flexDirection:'row',flexWrap:'wrap',gap:10},
  tab:{minHeight:48,paddingHorizontal:15,paddingVertical:11,justifyContent:'center',backgroundColor:'#FFFFFF',borderRadius:10,borderWidth:1,borderColor:'#98AFC0'},
  selected:{backgroundColor:'#164878',borderColor:'#164878'},
  tabLabel:{fontSize:16,color:'#123650',fontWeight:'600'},selectedText:{color:'#FFFFFF'},
  heading:{fontSize:21,lineHeight:29,fontWeight:'700',color:'#132A3A'},
  paragraph:{fontSize:17,lineHeight:26,color:'#162C40'},
  next:{fontSize:16,lineHeight:24,fontWeight:'600',color:'#123650'},
  footer:{fontSize:14,lineHeight:20,color:'#43596A'},
  publicLink:{minHeight:48,padding:12,borderWidth:1,borderColor:'#94AABA',backgroundColor:'#FFFFFF',borderRadius:9,justifyContent:'center'},
  publicLinkText:{fontSize:16,lineHeight:23,color:'#144E82',fontWeight:'600',textDecorationLine:'underline'}
});
