import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Choice = 'review' | 'decline' | 'human';

const options: { id: Choice; label: string; explanation: string }[] = [
  {
    id: 'review',
    label: 'Review the proposed worker',
    explanation: 'Review identity and relevant competency evidence before deciding.',
  },
  {
    id: 'decline',
    label: 'Decline this replacement',
    explanation: 'Do not accept the proposal. The unmet support need remains visible.',
  },
  {
    id: 'human',
    label: 'Ask a human coordinator for help',
    explanation: 'Ask for alternatives without approving a replacement worker.',
  },
];

const colours = {
  navy: '#0C1833',
  blue: '#005B7F',
  orange: '#C45A1E',
  text: '#1C2433',
  muted: '#4F5968',
  border: '#C9D2DB',
  surface: '#FFFFFF',
  background: '#F4F7FA',
  selected: '#EAF3F7',
  warm: '#FFF7F0',
};

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.sectionHeading}>{heading}</Text>
      {children}
    </View>
  );
}

export function MySupportScreen() {
  const [choice, setChoice] = useState<Choice>('review');
  const current = options.find((option) => option.id === choice) ?? options[0]!;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>PARTICIPANT CONTROL · EXAMPLE ONLY</Text>
      <Text accessibilityRole="header" style={styles.title}>My Support</Text>
      <Text style={styles.lead}>My life. My decisions.</Text>
      <Text style={styles.body}>
        Review options, express your preferences and keep the people supporting you accountable.
      </Text>

      <View style={styles.notice}>
        <Text style={styles.noticeHeading}>This is a fictional, offline example.</Text>
        <Text style={styles.body}>
          No worker, provider, calendar or consent account is connected to this screen.
          Nothing you select is sent, stored or shared.
        </Text>
      </View>

      <Section heading="My decision">
        <Text style={styles.body}>
          Example: your morning worker cancels. A replacement has been proposed but not accepted.
        </Text>
        <Text style={styles.prompt}>What would you prefer?</Text>
        {options.map((option) => {
          const selected = choice === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setChoice(option.id)}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && styles.choicePressed,
              ]}
            >
              <Text style={styles.choiceText}>
                {selected ? 'Selected: ' : ''}{option.label}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.receipt} accessibilityLiveRegion="polite">
          <Text style={styles.noticeHeading}>Decision receipt preview</Text>
          <Text style={styles.body}>{current.explanation}</Text>
          <Text style={styles.small}>
            This selection changes only the current screen. It is not a provider acknowledgement,
            cancellation, booking change or consent record.
          </Text>
        </View>
      </Section>

      <Section heading="My permissions">
        <Text style={styles.body}>
          In a connected release, access would be purpose-specific, limited in time, and
          revocable. This prototype cannot grant or revoke access.
        </Text>
        <Text style={styles.small}>No live permission status is available.</Text>
      </Section>

      <Section heading="My care and transport">
        <Text style={styles.body}>
          No authenticated care or transport records are connected to the mobile app yet.
        </Text>
        <Text style={styles.small}>
          A missing record is not proof that a support arrangement does not exist.
        </Text>
      </Section>

      <Section heading="My rights and human support">
        <Text style={styles.body}>
          You can ask for information, request corrections, challenge invoices and involve
          a chosen supporter. Future connected actions require scoped authority and clear receipts.
        </Text>
        <Text style={styles.small}>
          This screen does not notify a person or call emergency services.
        </Text>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.background },
  content: { padding: 18, paddingBottom: 44, gap: 16 },
  eyebrow: { color: colours.blue, fontSize: 12, lineHeight: 19, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: colours.navy, fontSize: 32, lineHeight: 40, fontWeight: '900' },
  lead: { color: colours.navy, fontSize: 20, lineHeight: 28, fontWeight: '700' },
  body: { color: colours.text, fontSize: 16, lineHeight: 24 },
  prompt: { color: colours.navy, fontSize: 17, lineHeight: 25, fontWeight: '800' },
  card: {
    gap: 12,
    backgroundColor: colours.surface,
    borderColor: colours.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionHeading: { color: colours.navy, fontSize: 21, lineHeight: 28, fontWeight: '800' },
  notice: {
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 5,
    borderLeftColor: colours.orange,
    backgroundColor: colours.warm,
    gap: 6,
  },
  noticeHeading: { color: colours.navy, fontSize: 16, lineHeight: 24, fontWeight: '800' },
  choice: {
    minHeight: 56,
    justifyContent: 'center',
    borderColor: colours.border,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colours.surface,
  },
  choiceSelected: { borderColor: colours.blue, backgroundColor: colours.selected },
  choicePressed: { opacity: 0.8 },
  choiceText: { color: colours.navy, fontWeight: '700', fontSize: 16, lineHeight: 24 },
  receipt: {
    borderLeftWidth: 4,
    borderLeftColor: colours.orange,
    backgroundColor: colours.warm,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  small: { color: colours.muted, fontSize: 14, lineHeight: 21 },
});
