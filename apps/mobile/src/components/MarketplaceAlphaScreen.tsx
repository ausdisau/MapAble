import React,{useState} from 'react';
import { FlatList,Pressable,StyleSheet,Text,TextInput,View } from 'react-native';
import { ALPHA_ITEMS,alphaExampleTotal,selectAlphaItems,type AlphaItem } from '../runtime/marketplaceAlpha';

const c={navy:'#082B5D',violet:'#6545AA',bg:'#F6F8FC',border:'#CFDAEB',ink:'#15263A'};
export function MarketplaceAlphaScreen(){
 const [query,setQuery]=useState('');
 const [risk,setRisk]=useState<'all'|'lower'|'review'>('all');
 const [saved,setSaved]=useState<string[]>([]);
 const items=selectAlphaItems(query,risk);
 const toggle=(item:AlphaItem)=>{
  if(item.risk==='review')return;
  setSaved(previous=>previous.includes(item.id)?previous.filter(id=>id!==item.id):[...previous,item.id]);
 };
 return <View style={s.root}>
  <Text accessibilityRole="header" style={s.heading}>MapAble Marketplace</Text>
  <Text style={s.subhead}>Closed alpha · Synthetic catalogue · No orders or payments</Text>
  <Text style={s.body}>Browse functional access features and plan options. All products, prices and suppliers are fictional. High-risk equipment needs independent review.</Text>
  <Text style={s.label}>Find a product or service</Text>
  <TextInput style={s.input} value={query} onChangeText={setQuery} placeholder="AAC, mobility, kitchen..." accessibilityLabel="Search fictional product examples" />
  <View style={s.controls}>
   {(['all','lower','review'] as const).map(value=><Pressable key={value}
     accessibilityRole="button" accessibilityState={{selected:risk===value}}
     onPress={()=>setRisk(value)} style={[s.chip,risk===value&&s.chipActive]}>
      <Text style={[s.chipText,risk===value&&s.activeText]}>{value==='all'?'All':value==='lower'?'Lower risk':'Review first'}</Text>
   </Pressable>)}
  </View>
  <Text accessibilityRole="summary" style={s.body}>{items.length} synthetic examples</Text>
  <FlatList data={items} keyExtractor={item=>item.id} contentContainerStyle={s.list}
   ListEmptyComponent={<Text>No examples found. Change the search or filters.</Text>}
   renderItem={({item})=><View style={s.card}>
    <Text accessibilityRole="header" style={s.itemTitle}>{item.name}</Text>
    <Text style={s.body}>{item.category} · {item.function}</Text>
    <Text style={s.body}>{item.cents===null?'Price unavailable':'Illustrative '+(item.cents/100).toLocaleString('en-AU',{style:'currency',currency:'AUD'})}</Text>
    <Text style={s.alert}>{item.risk==='review'?'Specialist review required before any real supply':'No real seller verification or funding approval'}</Text>
    <Pressable accessibilityRole="button" disabled={item.risk==='review'}
     accessibilityState={{disabled:item.risk==='review',selected:saved.includes(item.id)}}
     onPress={()=>toggle(item)} style={[s.action,item.risk==='review'&&s.disabled]}>
     <Text style={s.actionText}>{item.risk==='review'?'Review before shortlisting':saved.includes(item.id)?'Remove from planning':'Save to planning list'}</Text>
    </Pressable>
   </View>}/>
  <View style={s.foot}>
    <Text accessibilityRole="summary" style={s.itemTitle}>Private planning · {saved.length} examples</Text>
    <Text style={s.body}>Illustrative subtotal: {(alphaExampleTotal(saved)/100).toLocaleString('en-AU',{style:'currency',currency:'AUD'})}. Not a quotation or payment.</Text>
    <Text style={s.alert}>Stripe remains disabled. No cards, charges, checkout, invoices, NDIS claims or account data.</Text>
  </View>
 </View>;
}
const s=StyleSheet.create({
root:{flex:1,backgroundColor:c.bg,paddingHorizontal:16,paddingTop:20},
heading:{color:c.navy,fontSize:29,fontWeight:'800'},subhead:{color:c.violet,fontSize:16,fontWeight:'700',marginBottom:8},
body:{color:c.ink,fontSize:16,lineHeight:23,marginBottom:6},label:{fontSize:16,fontWeight:'700',marginTop:12,color:c.navy},
input:{borderWidth:1,borderColor:c.border,backgroundColor:'#FFF',borderRadius:10,minHeight:52,paddingHorizontal:12,fontSize:17,marginTop:5},
controls:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:12},
chip:{borderColor:c.navy,borderWidth:1,borderRadius:10,paddingHorizontal:12,justifyContent:'center',minHeight:48},
chipActive:{backgroundColor:c.navy},chipText:{color:c.navy,fontWeight:'700'},activeText:{color:'#FFF'},
list:{gap:12,paddingVertical:12,paddingBottom:22},card:{backgroundColor:'#FFF',padding:16,borderColor:c.border,borderWidth:1,borderRadius:14,gap:5},
itemTitle:{color:c.navy,fontSize:19,fontWeight:'800'},alert:{color:'#6B3A0E',fontSize:14,lineHeight:21,fontWeight:'600',marginTop:3},
action:{backgroundColor:c.navy,minHeight:50,borderRadius:10,alignItems:'center',justifyContent:'center',marginTop:10,padding:10},
disabled:{backgroundColor:'#53657A'},actionText:{color:'#FFF',fontSize:16,fontWeight:'700'},
foot:{borderTopColor:c.border,borderTopWidth:2,backgroundColor:'#FFF',padding:12}
});
