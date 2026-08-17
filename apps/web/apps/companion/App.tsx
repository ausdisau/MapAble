import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { stopAura } from "./src/aura/stop-aura";
import { loadVisitPackLocal } from "./src/visit-pack/local-store";

/**
 * MapAble Companion foundation shell (Expo native — not a WebView wrapper).
 * No compulsory smartphone pathway: essential access remains available on web.
 */
export default function App() {
  const [auraStopped, setAuraStopped] = useState(false);
  const [packSummary, setPackSummary] = useState<string>(
    "No offline Visit Pack loaded",
  );

  return (
    <SafeAreaView style={styles.safe} accessibilityLabel="MapAble Companion">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand} accessibilityRole="header">
          MapAble Companion
        </Text>
        <Text style={styles.lede}>
          Care and support, connected. Communication Passport, upcoming care and
          transport, and offline Visit Packs — with encrypted local storage.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication Passport</Text>
          <Text style={styles.body}>
            Syncs from MapAble when online. One question at a time and AAC
            instructions are supported. No compulsory camera or QR.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Offline Visit Pack</Text>
          <Text style={styles.body}>{packSummary}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Load encrypted Visit Pack from local storage"
            style={styles.button}
            onPress={async () => {
              const pack = await loadVisitPackLocal();
              setPackSummary(
                pack
                  ? `Pack ${pack.packId} · passport v${pack.passportVersion} · expires ${pack.expiresAt}`
                  : "No encrypted Visit Pack on device",
              );
            }}
          >
            <Text style={styles.buttonText}>Open Visit Pack</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stop AURA</Text>
          <Text style={styles.body}>
            Immediately stops agent proposals on this device. AURA never assigns
            workers, approves claims, or changes consent.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop AURA on this device"
            accessibilityHint="Stops agent proposals immediately. Does not change consent or bookings."
            style={[styles.button, styles.danger]}
            onPress={() => {
              stopAura();
              setAuraStopped(true);
              AccessibilityInfo.announceForAccessibility?.(
                "AURA stopped on this device",
              );
            }}
          >
            <Text style={styles.buttonText}>
              {auraStopped ? "AURA stopped" : "Stop AURA"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footnote}>
          Lost device? Revoke enrolment from the web account. Essential journeys
          remain available without a smartphone.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B3D2E" },
  container: { padding: 24, gap: 20 },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    color: "#F4F7F5",
    letterSpacing: -0.5,
  },
  lede: { fontSize: 17, lineHeight: 26, color: "#D7E5DD" },
  section: {
    gap: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2F5F4C",
  },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#F4F7F5" },
  body: { fontSize: 16, lineHeight: 24, color: "#D7E5DD" },
  button: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#1F7A5C",
    borderRadius: 8,
  },
  danger: { backgroundColor: "#8B3A3A" },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  footnote: { fontSize: 14, lineHeight: 20, color: "#A8C2B5", marginTop: 8 },
});
