import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createStaticNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const colours = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F1EF',
  border: '#D8DAD6',
  text: '#171A1B',
  muted: '#5D6264',
  primary: '#243B53',
  primarySoft: '#EAF0F4',
  accent: '#0B6B67',
  warning: '#8A5A00',
};

type HomeMode = 'Home' | 'Away' | 'Night' | 'Guest';

type SuiteState = {
  homeMode: HomeMode;
  setHomeMode: (mode: HomeMode) => void;
  indyEnabled: boolean;
  setIndyEnabled: (value: boolean) => void;
  analytics: boolean;
  setAnalytics: (value: boolean) => void;
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
};

const SuiteContext = createContext<SuiteState | null>(null);

function useSuite() {
  const value = useContext(SuiteContext);
  if (!value) throw new Error('useSuite must be used inside SuiteProvider');
  return value;
}

function SuiteProvider({ children }: { children: React.ReactNode }) {
  const [homeMode, setHomeMode] = useState<HomeMode>('Home');
  const [indyEnabled, setIndyEnabled] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const value = useMemo(
    () => ({
      homeMode,
      setHomeMode,
      indyEnabled,
      setIndyEnabled,
      analytics,
      setAnalytics,
      highContrast,
      setHighContrast,
      reduceMotion,
      setReduceMotion,
    }),
    [homeMode, indyEnabled, analytics, highContrast, reduceMotion],
  );

  return <SuiteContext.Provider value={value}>{children}</SuiteContext.Provider>;
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    >
      {children}
    </ScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Button({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress?: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary && styles.buttonPrimary,
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function TodayScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text accessibilityRole="header" style={styles.title}>Good morning</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.grid}>
        <ActionTile title="Home" detail="Control my home" />
        <ActionTile title="Travel" detail="Plan an accessible journey" />
        <ActionTile title="Read" detail="Continue AccessiBooks" />
        <ActionTile title="News" detail="Catch up on disability news" />
      </View>

      <SectionTitle>My Day</SectionTitle>
      <Card>
        <TimelineItem time="Now" title="At home" detail="No urgent tasks" />
        <TimelineItem time="9:30" title="Morning routine" detail="Light support selected" />
        <TimelineItem time="11:15" title="Leave for appointment" detail="MapAble route ready" />
      </Card>

      <SectionTitle>Indy suggests</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Prepare Away mode</Text>
        <Text style={styles.body}>Review the proposed steps before anything changes.</Text>
        <Button label="Review suggestion" primary />
      </Card>
    </Screen>
  );
}

function ActionTile({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.tile} accessible accessibilityRole="button" accessibilityLabel={`${title}: ${detail}`}>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.muted}>{detail}</Text>
    </View>
  );
}

function TimelineItem({ time, title, detail }: { time: string; title: string; detail: string }) {
  return (
    <View style={styles.timelineItem}>
      <Text style={styles.timelineTime}>{time}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.muted}>{detail}</Text>
      </View>
    </View>
  );
}

function HomeScreen() {
  const { homeMode, setHomeMode } = useSuite();
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>AdaptAble Home</Text>
      <Text style={styles.subtitle}>Purpose-led control with explicit device state.</Text>

      <View style={styles.modeRow}>
        {(['Home', 'Away', 'Night', 'Guest'] as HomeMode[]).map((mode) => (
          <Pressable
            key={mode}
            accessibilityRole="button"
            accessibilityState={{ selected: homeMode === mode }}
            accessibilityLabel={`${mode} mode`}
            onPress={() => setHomeMode(mode)}
            style={[styles.modeButton, homeMode === mode && styles.modeButtonSelected]}
          >
            <Text style={[styles.modeText, homeMode === mode && styles.modeTextSelected]}>{mode}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle>Quick controls</SectionTitle>
      <View style={styles.grid}>
        <ActionTile title="Lights" detail="3 on" />
        <ActionTile title="Doors" detail="All locked" />
        <ActionTile title="Climate" detail="21 degrees" />
        <ActionTile title="Blinds" detail="Open" />
      </View>

      <SectionTitle>Rooms</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Living room</Text>
        <Text style={styles.body}>21° · Lights 65% · Blinds open</Text>
        <View style={styles.rowWrap}>
          <Button label="Lights" />
          <Button label="Climate" />
          <Button label="Blinds" />
        </View>
      </Card>
      <Card>
        <Text style={styles.cardTitle}>Bedroom</Text>
        <Text style={styles.body}>Light status unavailable</Text>
        <Text style={styles.muted}>Last confirmed off at 8:31 AM. This prototype does not claim a live device connection.</Text>
        <Button label="Try again" />
      </Card>

      <SectionTitle>Independence routine</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Morning</Text>
        <Text style={styles.body}>Open blinds · living room light · 21°</Text>
        <Button label="Review and run" primary />
      </Card>
    </Screen>
  );
}

function IndyScreen() {
  const { indyEnabled } = useSuite();
  const [approved, setApproved] = useState(false);

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>Indy</Text>
      <Text style={styles.subtitle}>Ask · Coach · Guide · Planner</Text>

      {!indyEnabled ? (
        <Card>
          <Text style={styles.cardTitle}>Indy suggestions are off</Text>
          <Text style={styles.body}>You can turn them on in My Access.</Text>
        </Card>
      ) : (
        <Card>
          <Text style={styles.eyebrow}>PROPOSAL</Text>
          <Text style={styles.cardTitle}>Prepare to leave home</Text>
          <Text style={styles.body}>Indy proposes four bounded steps:</Text>
          <Text style={styles.body}>• Turn off living-room lights</Text>
          <Text style={styles.body}>• Confirm the back door is locked</Text>
          <Text style={styles.body}>• Change Home mode to Away</Text>
          <Text style={styles.body}>• Open the saved MapAble route</Text>

          <View style={styles.disclosure}>
            <Text style={styles.disclosureTitle}>Indy will not</Text>
            <Text style={styles.muted}>Contact another person, share live location, or change support permissions.</Text>
          </View>

          <View style={styles.disclosure}>
            <Text style={styles.disclosureTitle}>Data needed</Text>
            <Text style={styles.muted}>Home status and saved travel preferences.</Text>
          </View>

          <View style={styles.rowWrap}>
            <Button label="Not now" onPress={() => setApproved(false)} />
            <Button label="Approve" primary onPress={() => setApproved(true)} />
          </View>
          {approved && <Text accessibilityRole="alert" style={styles.success}>Approved for this prototype action only.</Text>}
        </Card>
      )}
    </Screen>
  );
}

function MoreScreen() {
  const suite = useSuite();
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>More</Text>
      <Text style={styles.subtitle}>Capability packs, access and trust controls.</Text>

      <SectionTitle>MapAble</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Accessible journey planning</Text>
        <Text style={styles.body}>Step-free · accessible toilet nearby · avoid steep gradients · power-wheelchair suitable.</Text>
        <Text style={styles.muted}>Route data shown here is prototype content, not verified live routing.</Text>
        <Button label="Review route preferences" />
      </Card>

      <SectionTitle>AccessiBooks</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Continue reading</Text>
        <Text style={styles.body}>Chapter 6 · 34 minutes remaining</Text>
        <View style={styles.rowWrap}>
          <Button label="Continue" primary />
          <Button label="Reading access" />
        </View>
      </Card>

      <SectionTitle>News & Advocacy</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Your briefing</Text>
        <Text style={styles.body}>Policy · Rights · Technology · Community</Text>
        <Text style={styles.muted}>Source and confidence should remain visible. No live news feed is connected in this prototype.</Text>
      </Card>

      <SectionTitle>My Access</SectionTitle>
      <Card>
        <Setting label="Indy suggestions" value={suite.indyEnabled} setValue={suite.setIndyEnabled} />
        <Setting label="High contrast" value={suite.highContrast} setValue={suite.setHighContrast} />
        <Setting label="Reduce motion" value={suite.reduceMotion} setValue={suite.setReduceMotion} />
        <Setting label="Product analytics" value={suite.analytics} setValue={suite.setAnalytics} description="Off by default. No analytics service is connected." />
      </Card>

      <SectionTitle>Permissions</SectionTitle>
      <Card>
        <Permission name="Indy" status="Some allowed" />
        <Permission name="Home" status="Allowed" />
        <Permission name="MapAble" status="While using" />
        <Permission name="AccessiBooks" status="Allowed" />
      </Card>

      <SectionTitle>Activity</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>8:42 AM · Away mode reviewed</Text>
        <Text style={styles.muted}>Source: Home · External data shared: none</Text>
      </Card>

      <SectionTitle>Support</SectionTitle>
      <Card>
        <Text style={styles.cardTitle}>Prototype boundary</Text>
        <Text style={styles.body}>This app does not contact emergency services, notify support workers, or share location automatically.</Text>
      </Card>
    </Screen>
  );
}

function Setting({ label, value, setValue, description }: { label: string; value: boolean; setValue: (v: boolean) => void; description?: string }) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{label}</Text>
        {description ? <Text style={styles.muted}>{description}</Text> : null}
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={setValue} />
    </View>
  );
}

function Permission({ name, status }: { name: string; status: string }) {
  return (
    <View style={styles.permissionRow}>
      <Text style={styles.body}>{name}</Text>
      <Text style={styles.permissionStatus}>{status}</Text>
    </View>
  );
}

const Tabs = createBottomTabNavigator({
  screenOptions: {
    headerShown: false,
    tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
    tabBarStyle: { minHeight: 64, paddingBottom: 8, paddingTop: 6 },
    tabBarActiveTintColor: colours.primary,
  },
  screens: {
    Today: TodayScreen,
    Home: HomeScreen,
    Indy: IndyScreen,
    More: MoreScreen,
  },
});

const Navigation = createStaticNavigation(Tabs);

export default function App() {
  return (
    <SuiteProvider>
      <StatusBar style="dark" />
      <Navigation />
    </SuiteProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.background },
  content: { padding: 18, paddingBottom: 36, gap: 16 },
  hero: { gap: 5, paddingTop: 6 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '800', color: colours.text },
  subtitle: { fontSize: 17, lineHeight: 24, color: colours.muted },
  sectionTitle: { marginTop: 6, fontSize: 20, lineHeight: 27, fontWeight: '800', color: colours.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { minHeight: 112, minWidth: 150, flexGrow: 1, flexBasis: '46%', justifyContent: 'center', gap: 6, padding: 16, backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.border, borderRadius: 14 },
  tileTitle: { fontSize: 18, fontWeight: '800', color: colours.text },
  card: { gap: 12, padding: 16, backgroundColor: colours.surface, borderWidth: 1, borderColor: colours.border, borderRadius: 14 },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '800', color: colours.text },
  body: { fontSize: 16, lineHeight: 23, color: colours.text },
  muted: { fontSize: 14, lineHeight: 20, color: colours.muted },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, fontWeight: '800', color: colours.accent },
  button: { minHeight: 48, minWidth: 92, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 9, borderWidth: 1, borderColor: colours.border, backgroundColor: colours.surface },
  buttonPrimary: { backgroundColor: colours.primary, borderColor: colours.primary },
  buttonText: { fontSize: 16, fontWeight: '800', color: colours.text },
  buttonTextPrimary: { color: '#FFFFFF' },
  timelineItem: { flexDirection: 'row', gap: 14, paddingVertical: 8 },
  timelineTime: { width: 54, fontSize: 14, fontWeight: '800', color: colours.muted },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeButton: { minHeight: 48, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 9, borderWidth: 1, borderColor: colours.border, backgroundColor: colours.surface },
  modeButtonSelected: { backgroundColor: colours.primary },
  modeText: { fontSize: 16, fontWeight: '800', color: colours.text },
  modeTextSelected: { color: '#FFFFFF' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  disclosure: { padding: 12, gap: 4, borderRadius: 10, backgroundColor: colours.surfaceMuted },
  disclosureTitle: { fontSize: 15, fontWeight: '800', color: colours.text },
  success: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: colours.accent },
  settingRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colours.border },
  permissionRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colours.border },
  permissionStatus: { fontSize: 14, fontWeight: '800', color: colours.primary },
});
