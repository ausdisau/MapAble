import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { searchCommissionProviders, type CommissionProvider } from "../../runtime/commissionProviderApi";

const states = ["", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
export function ProviderFinderScreen() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [items, setItems] = useState<CommissionProvider[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [sourceDate, setSourceDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Enter a provider name or select a state to begin.");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function run(page = 1) {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setMessage("");
    if (page === 1) { setItems([]); setSourceDate(null); }
    try {
      const result = await searchCommissionProviders(query, state, page, current.signal);
      if (controller.current !== current) return;
      setItems(previous => page === 1 ? result.data : [...previous, ...result.data]);
      setNextPage(result.meta.nextPage);
      setSourceDate(result.meta.sourceAsOf);
      if (result.data.length === 0) setMessage("No matching providers found. Change the search or try another state.");
    } catch (error) {
      if (controller.current !== current) return;
      setNextPage(null);
      setMessage(error instanceof Error ? error.message : "Provider search is unavailable.");
    } finally {
      if (controller.current === current) setLoading(false);
    }
  }
  return (
    <View style={styles.screen}>
      <Text accessibilityRole="header" style={styles.title}>Find NDIS providers</Text>
      <Text style={styles.hint}>Search published registration records. Registration does not verify worker clearance, competence, availability or accessibility.</Text>
      <TextInput accessibilityLabel="Provider name or ABN" value={query} onChangeText={setQuery}
        placeholder="Provider name or ABN" style={styles.input} returnKeyType="search"
        onSubmitEditing={() => void run()} />
      <Text style={styles.label}>Filter by state</Text>
      <View style={styles.stateRow}>{states.map(s => (
        <Pressable key={s || "ALL"} accessibilityRole="button" accessibilityLabel={s || "All states"}
          accessibilityState={{ selected: state === s }} onPress={() => setState(s)}
          style={[styles.chip, state === s && styles.chipSelected]}>
          <Text style={[styles.chipText, state === s && styles.chipTextSelected]}>{s || "All"}</Text>
        </Pressable>
      ))}</View>
      <Pressable style={styles.submit} accessibilityRole="button" accessibilityState={{ disabled: loading }} disabled={loading}
        onPress={() => void run()}><Text style={styles.submitLabel}>Search providers</Text></Pressable>
      {loading && <ActivityIndicator accessibilityLabel="Searching providers" />}
      {!!sourceDate && <Text style={styles.hint}>NDIS Commission source date: {sourceDate}</Text>}
      {!!message && <Text accessibilityLiveRegion="polite" style={styles.hint}>{message}</Text>}
      <FlatList data={items} keyExtractor={p => p.id} keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <View style={styles.result}>
          <Text style={styles.providerName}>{item.name}</Text>
          <Text style={styles.body}>{item.state || "State not specified"} · {item.registration.status}</Text>
          <Text style={styles.hint}>Registration source: NDIS Commission, {item.registration.asOf}</Text>
          <Text style={styles.hint}>Worker clearance: not independently verified</Text>
          <Text style={styles.hint}>Accessibility and availability: unknown</Text>
        </View>}
        ListFooterComponent={nextPage !== null && !loading ? (
          <Pressable style={styles.submit} accessibilityRole="button" onPress={() => void run(nextPage)}>
            <Text style={styles.submitLabel}>Load more results</Text>
          </Pressable>) : null}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F7F7F5", padding: 16, gap: 12 },
  title: { fontSize: 26, fontWeight: "800", color: "#171A1B" },
  hint: { fontSize: 15, lineHeight: 22, color: "#4B5254" },
  label: { fontSize: 16, fontWeight: "700", color: "#171A1B" },
  input: { minHeight: 52, borderColor: "#697172", borderWidth: 1, borderRadius: 8, padding: 12, color: "#171A1B", fontSize: 17 },
  stateRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { minHeight: 48, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#697172", borderRadius: 8 },
  chipSelected: { backgroundColor: "#243B53" },
  chipText: { color: "#171A1B", fontSize: 16, fontWeight: "700" },
  chipTextSelected: { color: "#FFFFFF" },
  submit: { minHeight: 52, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#243B53", padding: 10 },
  submitLabel: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
  list: { paddingBottom: 35, gap: 12 },
  result: { borderColor: "#D8DAD6", borderWidth: 1, borderRadius: 12, padding: 15, gap: 6, backgroundColor: "#FFFFFF" },
  providerName: { fontSize: 18, fontWeight: "800", color: "#171A1B" },
  body: { fontSize: 16, color: "#171A1B" },
});
