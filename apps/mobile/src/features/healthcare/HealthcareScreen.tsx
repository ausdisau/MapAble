import React, { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  accessOptions,
  maxMessageLength,
  quickPhrases,
  startHealthcarePreview,
  updateHealthcarePreview,
  visit,
  visitModes,
} from '../../../../web/packages/contracts/src/healthcare-preview';
import { practiceScenarios, type PracticeScenario } from '../../../../web/packages/contracts/src/healthcare-practice-coach';

const stageTitles = {
  prepare: 'Prepare for your visit',
  waiting: 'Waiting room',
  consultation: 'Consultation',
  complete: 'Practice visit complete',
};

function Action({
  label,
  onPress,
  selected,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        selected && styles.selected,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.actionLabel, secondary && styles.secondaryLabel, disabled && styles.disabledLabel]}>{label}</Text>
    </Pressable>
  );
}

function Choice({
  label,
  detail,
  checked,
  role,
  onPress,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  role: 'radio' | 'checkbox';
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      accessibilityHint={detail}
      onPress={onPress}
      style={[styles.choice, checked && styles.selected]}
    >
      <View style={[styles.check, role === 'radio' && styles.radio, checked && styles.filled]} accessible={false}>
        {checked && <Text style={styles.symbol} accessibilityElementsHidden importantForAccessibility="no">✓</Text>}
      </View>
      <View style={styles.choiceContent}>
        <Text style={styles.strong}>{label}</Text>
        {detail && <Text style={styles.body}>{detail}</Text>}
      </View>
    </Pressable>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function HealthcareScreen({ onExit }: { onExit: () => void }) {
  const [state, dispatch] = useReducer(updateHealthcarePreview, undefined, startHealthcarePreview);
  const [panel, setPanel] = useState<'overview' | 'visit' | 'access' | 'help'>('overview');
  const [draft, setDraft] = useState('');
  const [captions, setCaptions] = useState<boolean | undefined>(undefined);
  const [relayError, setRelayError] = useState(false);
  const [coachScenario, setCoachScenario] = useState<PracticeScenario>();
  const scroll = useRef<ScrollView>(null);
  const previousHeading = useRef('');
  const heading = panel === 'visit' ? stageTitles[state.stage] : {
    overview: 'Your telehealth visit',
    access: 'Your access preferences',
    help: 'Help and alternatives',
  }[panel];

  const showCaptions = captions ?? state.access.includes('captions');
  const chosenAccess = accessOptions.filter((option) => state.access.includes(option.id));
  const shared = state.shareAccess && chosenAccess.length > 0;

  useEffect(() => {
    if (heading === previousHeading.current) return;
    previousHeading.current = heading;
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(heading);
  }, [heading]);

  function leave() {
    setDraft('');
    setCaptions(undefined);
    dispatch({ type: 'leave' });
  }

  function reset() {
    setDraft('');
    setCaptions(undefined);
    dispatch({ type: 'reset' });
  }

  return (
    <ScrollView ref={scroll} style={styles.screen} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <Action label="Back to More" onPress={onExit} secondary />
        <Text style={styles.demoBadge}>Synthetic preview</Text>
      </View>
      <Text accessibilityRole="header" style={styles.title}>{heading}</Text>

      {panel === 'overview' && (
        <>
          <Text style={styles.body}>Practise an appointment and choose how you want to communicate.</Text>
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>Your practice appointment</Text>
            <Text accessibilityRole="header" style={styles.heroTitle}>{visit.title}</Text>
            <Text style={styles.heroDetail}>With {visit.clinician}, demo clinician</Text>
            <Text style={styles.heroDetail}>{visit.date} · {visit.time} · {visit.duration}</Text>
            <Action label={state.stage === 'prepare' ? 'Prepare for visit' : 'Return to practice visit'} onPress={() => setPanel('visit')} secondary />
          </View>
          <Action label="Edit access preferences" onPress={() => setPanel('access')} secondary />
          <Action label="Help and alternatives" onPress={() => setPanel('help')} secondary />
        </>
      )}

      {panel !== 'overview' && <Action label="Back to appointments" onPress={() => setPanel('overview')} secondary />}

      {panel === 'access' && (
        <>
          <Card title="Communication and support">
            {accessOptions.map((option) => (
              <Choice key={option.id} label={option.label} detail={option.detail} role="checkbox" checked={state.access.includes(option.id)} onPress={() => dispatch({ type: 'toggleAccess', option: option.id })} />
            ))}
          </Card>
          <Card title="Decide what to share">
            <Text style={styles.body}>These choices stay in this practice visit. No interpreter or support person is contacted.</Text>
            <Choice label="Share my selected preferences for this visit" role="checkbox" checked={state.shareAccess} onPress={() => dispatch({ type: 'shareAccess', share: !state.shareAccess })} />
            <Text style={styles.strong}>Shared in this preview</Text>
            {shared ? chosenAccess.map((option) => <Text key={option.id} style={styles.body}>{option.label}</Text>) : <Text style={styles.body}>No preferences shared.</Text>}
            <Action label="Return to practice visit" onPress={() => setPanel('visit')} />
          </Card>
        </>
      )}

      {panel === 'visit' && state.stage === 'prepare' && (
        <>
          <Card title="How would you like to join?">
            <View accessibilityRole="radiogroup" accessibilityLabel="How would you like to join?" style={styles.choiceGroup}>
              {visitModes.map((mode) => (
                <Choice key={mode.id} label={mode.label} detail={mode.detail} role="radio" checked={mode.id === state.mode} onPress={() => dispatch({ type: 'chooseMode', mode: mode.id })} />
              ))}
            </View>
            <Text style={styles.body}>The mobile practice visit keeps your camera and microphone off.</Text>
          </Card>
          <Card title="Review and continue">
            <Text style={styles.body}>Use sample text. The typed conversation is cleared when you leave.</Text>
            {shared ? chosenAccess.map((option) => <Text key={option.id} style={styles.body}>{option.label}</Text>) : <Text style={styles.body}>No access preferences shared.</Text>}
            <Action label="Edit access preferences" onPress={() => setPanel('access')} secondary />
            <Choice label="I understand this is a practice visit." role="checkbox" checked={state.acknowledged} onPress={() => dispatch({ type: 'acknowledge', value: !state.acknowledged })} />
            <Action label="Enter waiting room" onPress={() => dispatch({ type: 'enterWaitingRoom' })} disabled={!state.acknowledged} />
          </Card>
        </>
      )}

      {panel === 'visit' && state.stage === 'waiting' && (
        <Card title={visit.title}>
          <Text style={styles.body} accessibilityLiveRegion="polite">
            {state.admitted ? 'The simulated clinician is ready. Join when you’re ready.' : 'You’re in the practice waiting room.'}
          </Text>
          {state.admitted ? (
            <Action label="Join consultation" onPress={() => dispatch({ type: 'joinConsultation' })} />
          ) : (
            <Action label="Simulate clinician admission" onPress={() => {
              dispatch({ type: 'simulateAdmission' });
              if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility('The simulated clinician is ready.');
            }} />
          )}
          <Action label="Change how I join" onPress={() => dispatch({ type: 'returnToPreparation' })} secondary />
          <Action label="Help and alternatives" onPress={() => setPanel('help')} secondary />
          <Action label="Leave waiting room" onPress={leave} secondary />
        </Card>
      )}

      {panel === 'visit' && state.stage === 'consultation' && (
        <>
          <Card title={state.mode === 'text' ? 'Text consultation' : `${state.mode === 'video' ? 'Video' : 'Audio'} practice mode`}>
            <Text style={styles.body}>Type or use your AAC device. Take as much time as you need.</Text>
            {shared && <>
              <Text style={styles.strong}>Shared access preferences</Text>
              {chosenAccess.map((option) => <Text key={option.id} style={styles.body}>{option.label}</Text>)}
            </>}
            <Action label="Demo captions" secondary selected={showCaptions} onPress={() => setCaptions(!showCaptions)} />
            {showCaptions && <Text accessibilityLiveRegion="polite" style={styles.caption}>Sample caption from Amelia. Take your time. You can type when you’re ready.</Text>}
            <Action label="Leave practice visit" onPress={leave} secondary />
          </Card>
          <Card title="Typed conversation">
            <View accessibilityLiveRegion="polite" style={styles.choiceGroup}>
              {state.messages.map((message) => (
                <View key={message.id} style={[styles.message, message.speaker === 'You' && styles.myMessage]}>
                  <Text style={styles.strong}>{message.speaker}</Text>
                  <Text style={styles.body}>{message.text}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.strong}>Quick phrases</Text>
            {quickPhrases.map((phrase) => (
              <Action key={phrase} label={phrase} secondary onPress={() => dispatch({ type: 'sendMessage', text: phrase })} />
            ))}
            <Text style={styles.strong}>Your message</Text>
            <TextInput accessibilityLabel="Your message" multiline maxLength={maxMessageLength} value={draft} onChangeText={setDraft} style={styles.input} />
            <Action label="Send message" disabled={!draft.trim()} onPress={() => {
              dispatch({ type: 'sendMessage', text: draft });
              setDraft('');
            }} />
          </Card>
        </>
      )}

      {panel === 'visit' && state.stage === 'complete' && (
        <Card title="You’ve left the practice room">
          <Text style={styles.body}>The typed conversation was cleared.</Text>
          <Action label="Start a new practice visit" onPress={reset} />
        </Card>
      )}

      {panel === 'help' && (
        <>
        <Card title="Choose another way to attend">
          <Text style={styles.body}>For a real appointment, ask your clinic about text, a phone call, relay or an in-person visit.</Text>
          <Action label={state.callback ? 'Callback simulated' : 'Simulate a callback request'} disabled={state.callback} onPress={() => dispatch({ type: 'callback' })} />
          {state.callback && <Text style={styles.caption} accessibilityLiveRegion="polite">This was a practice request. No clinic has been contacted.</Text>}
          <Action label="National Relay Service" secondary onPress={() => {
            void Linking.openURL('https://www.accesshub.gov.au/about-the-nrs').catch(() => setRelayError(true));
          }} />
          {relayError && <Text accessibilityRole="alert" style={styles.body}>Couldn’t open the National Relay Service website. Its address is accesshub.gov.au.</Text>}
          <Text style={styles.body}>For a medical emergency, call Triple Zero (000).</Text>
        </Card>
        <Card title="Practise asking for what you need">
          <Text style={styles.body}>Choose a practice phrase to see a sample reply.</Text>
          {(Object.keys(practiceScenarios) as PracticeScenario[]).map((value) => (
            <Action key={value} label={practiceScenarios[value].phrase} secondary selected={coachScenario === value} onPress={() => {
              setCoachScenario(value);
              if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(practiceScenarios[value].replies[0].text);
            }} />
          ))}
          {coachScenario && <Text accessibilityLiveRegion="polite" style={styles.caption}>{practiceScenarios[coachScenario].replies[0].text}</Text>}
        </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f3f7f6' },
  content: { gap: 14, padding: 18, paddingBottom: 36, width: '100%', maxWidth: 660, alignSelf: 'center' },
  topRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  demoBadge: { color: '#5a3915', backgroundColor: '#fbf0da', fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  title: { color: '#0c1833', fontSize: 30, fontWeight: '800' },
  sectionTitle: { color: '#0c1833', fontSize: 21, fontWeight: '800' },
  strong: { color: '#0c1833', fontSize: 16, fontWeight: '700' },
  body: { color: '#405162', fontSize: 16 },
  hero: { backgroundColor: '#083942', padding: 19, borderRadius: 19, gap: 9 },
  heroTitle: { color: '#ffffff', fontSize: 28, fontWeight: '800' },
  heroDetail: { color: '#e4f0ef', fontSize: 16 },
  heroKicker: { color: '#c1ece4', fontSize: 14, fontWeight: '700' },
  card: { borderWidth: 1, borderColor: '#d6e2df', backgroundColor: '#ffffff', padding: 15, borderRadius: 15, gap: 11 },
  button: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#005b7f', borderColor: '#005b7f', borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9 },
  secondary: { backgroundColor: '#ffffff', borderColor: '#91b7b7' },
  selected: { backgroundColor: '#e3f4ef', borderColor: '#51928e' },
  pressed: { opacity: 0.82 },
  disabled: { backgroundColor: '#e9efee', borderColor: '#d5dfdd' },
  actionLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  secondaryLabel: { color: '#005b7f' },
  disabledLabel: { color: '#4e5e67' },
  choiceGroup: { gap: 8 },
  choice: { borderWidth: 1, borderColor: '#a7c0bc', padding: 11, borderRadius: 9, minHeight: 48, alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  choiceContent: { flex: 1, gap: 3 },
  check: { width: 22, height: 22, borderWidth: 1, borderColor: '#005b7f', borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  radio: { borderRadius: 11 },
  filled: { backgroundColor: '#005b7f' },
  symbol: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  caption: { color: '#203f41', padding: 10, backgroundColor: '#edf7f4', borderRadius: 8, fontSize: 16 },
  message: { padding: 9, borderRadius: 8, backgroundColor: '#edf4f2', gap: 3 },
  myMessage: { backgroundColor: '#e8f2f8' },
  input: { color: '#0c1833', borderColor: '#819f9e', borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 78, fontSize: 16, textAlignVertical: 'top' },
});
