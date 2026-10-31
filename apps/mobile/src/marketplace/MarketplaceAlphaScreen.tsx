import { useMemo, useState } from "react";
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { CLOSED_ALPHA_ITEMS, prepareAlphaBasket } from "../../../web/packages/marketplace-inclusive/src/alpha-catalogue";

/** Native Expo closed alpha: local synthetic catalogue, NEVER a checkout. */
export function MarketplaceAlphaScreen() {
  const [query, setQuery] = useState("");
  const [ids, setIds] = useState<string[]>([]);
  const [result, setResult] = useState("Nothing submitted or charged.");
  const items = useMemo(() => CLOSED_ALPHA_ITEMS.filter((x) => (x.name+" "+x.description).toLowerCase().includes(query.toLowerCase().trim())), [query]);
  function toggle(id: string) {
    setIds((previous) => previous.includes(id) ? previous.filter((v) => v !== id) : previous.length < 8 ? [...previous, id] : previous);
  }
  function prepare() {
    try {
      const basket = prepareAlphaBasket(ids);
      const announcement = `Synthetic draft prepared: ${basket.items.length} items, illustrative subtotal ${new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(basket.totalCents / 100)}. No payment or order.`;
      setResult(announcement);
      AccessibilityInfo.announceForAccessibility?.(announcement);
    } catch {
      setResult("Selected items are unavailable for a synthetic draft.");
    }
  }
  return <ScrollView contentContainerStyle={styles.root} accessibilityLabel="Marketplace closed alpha">
    <Text accessibilityRole="header" style={styles.title}>Marketplace closed alpha</Text>
    <Text style={styles.body}>All listings, sellers and prices are fictional. No payments, stock checks, funding decisions or real supplier contacts.</Text>
    <Text style={styles.label}>Search examples</Text>
    <TextInput accessibilityLabel="Search marketplace examples" value={query} onChangeText={setQuery} style={styles.input} placeholder="Communication, daily living..." placeholderTextColor="#41576B" />
    <Text accessibilityLiveRegion="polite" style={styles.body}>{items.length} examples found; {ids.length} selected</Text>
    {items.map((item) => <View key={item.id} style={styles.card}>
      <Text accessibilityRole="header" style={styles.subtitle}>{item.name}</Text>
      <Text style={styles.body}>{item.description}</Text>
      <Text style={styles.body}>{item.priceCents === null ? "Enquiry only" : `Illustrative AUD ${(item.priceCents / 100).toFixed(2)}`}</Text>
      <Text style={styles.body}>Evidence: synthetic, unverified. {item.safety === "low-risk-demo" ? "Lower-risk demonstration" : "Not available for direct draft"}</Text>
      <Pressable style={[styles.button,item.safety !== "low-risk-demo" && styles.disabled]} accessibilityRole="button" accessibilityState={{ disabled:item.safety !== "low-risk-demo", selected:ids.includes(item.id)}} disabled={item.safety !== "low-risk-demo"} onPress={() => toggle(item.id)}>
        <Text style={styles.buttonLabel}>{item.safety !== "low-risk-demo" ? "Specialist review required" : ids.includes(item.id) ? "Remove from draft" : "Add to draft"}</Text>
      </Pressable>
    </View>)}
    <Text accessibilityRole="header" style={styles.subtitle}>Synthetic enquiry only</Text>
    <Pressable style={[styles.button,ids.length === 0 && styles.disabled]} accessibilityRole="button" accessibilityState={{disabled:ids.length===0}} disabled={ids.length===0} onPress={prepare}><Text style={styles.buttonLabel}>Prepare sample draft</Text></Pressable>
    <Text accessibilityLiveRegion="polite" style={styles.body}>{result}</Text>
    <Pressable style={styles.button} accessibilityRole="button" onPress={()=>{setIds([]);setResult("Draft cleared.");}}><Text style={styles.buttonLabel}>Clear draft</Text></Pressable>
  </ScrollView>;
}
const styles = StyleSheet.create({
  root:{padding:20,gap:16,backgroundColor:"#F7FAFD"},
  title:{fontSize:28,fontWeight:"700",color:"#123453"},
  subtitle:{fontSize:21,fontWeight:"700",color:"#123453"},
  label:{fontSize:17,fontWeight:"700",color:"#123453"},
  input:{borderWidth:2,borderColor:"#22486A",padding:14,borderRadius:10,minHeight:52,fontSize:18,color:"#123453"},
  body:{fontSize:17,lineHeight:25,color:"#16344C"},
  card:{backgroundColor:"#FFFFFF",padding:18,gap:12,borderRadius:12,borderWidth:1,borderColor:"#B7C8D8"},
  button:{minHeight:52,padding:14,borderRadius:10,backgroundColor:"#174B8A",justifyContent:"center"},
  disabled:{backgroundColor:"#5A6877"},
  buttonLabel:{color:"#FFFFFF",fontSize:17,fontWeight:"700",textAlign:"center"}
});
