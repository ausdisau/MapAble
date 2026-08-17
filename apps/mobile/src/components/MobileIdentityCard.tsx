import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import {
  fetchAccessibilityProfile,
  updateCommunicationPreferences,
  updateDigitalPreferences,
  type AccessibilityProfile,
  type CommunicationPreference,
} from '../runtime/accessibilityApi';
import {
  createMobileAuthRequest,
  exchangeMobileAuthCode,
  isMobileAuthConfigured,
  readMobileAuthCallback,
  type MobileAuthRequest,
  type MobileSession,
} from '../runtime/mobileAuth';

const communicationOptions: Array<{ value: CommunicationPreference; label: string }> = [
  { value: 'plain_language', label: 'Plain language' },
  { value: 'aac', label: 'AAC' },
  { value: 'auslan', label: 'Auslan' },
  { value: 'written_only', label: 'Written only' },
  { value: 'support_person', label: 'Support person' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

type Props = {
  highContrast: boolean;
  setHighContrast: (value: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
};

export function MobileIdentityCard({
  highContrast,
  setHighContrast,
  reduceMotion,
  setReduceMotion,
}: Props) {
  const [pendingRequest, setPendingRequest] = useState<MobileAuthRequest | null>(null);
  const [session, setSession] = useState<MobileSession | null>(null);
  const [profile, setProfile] = useState<AccessibilityProfile | null>(null);
  const [communicationPreferences, setCommunicationPreferences] = useState<CommunicationPreference[]>([]);
  const [largeText, setLargeText] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const configured = isMobileAuthConfigured();
  const nativeAuthSupported = Platform.OS !== 'web';

  async function loadProfile(nextSession: MobileSession) {
    const nextProfile = await fetchAccessibilityProfile(nextSession.accessToken);
    setProfile(nextProfile);
    setCommunicationPreferences(nextProfile.communicationPreferences);
    if (typeof nextProfile.digitalPreferences.highContrast === 'boolean') {
      setHighContrast(nextProfile.digitalPreferences.highContrast);
    }
    if (typeof nextProfile.digitalPreferences.reducedMotion === 'boolean') {
      setReduceMotion(nextProfile.digitalPreferences.reducedMotion);
    }
    if (typeof nextProfile.digitalPreferences.largeText === 'boolean') {
      setLargeText(nextProfile.digitalPreferences.largeText);
    }
  }

  useEffect(() => {
    async function handleCallback(callbackUrl: string) {
      if (!pendingRequest) return;
      setBusy(true);
      setMessage(null);
      try {
        const { code } = readMobileAuthCallback(callbackUrl, pendingRequest.state);
        const nextSession = await exchangeMobileAuthCode(pendingRequest, code);
        setPendingRequest(null);
        setSession(nextSession);
        await loadProfile(nextSession);
        setMessage('Signed in. Your accessibility profile is connected for this app session.');
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'MapAble sign-in could not be completed.');
      } finally {
        setBusy(false);
      }
    }

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleCallback(url);
    });
    void Linking.getInitialURL().then((url) => {
      if (url) void handleCallback(url);
    });

    return () => subscription.remove();
  }, [pendingRequest]);

  async function startSignIn() {
    setMessage(null);
    if (!configured) {
      setMessage('MapAble platform connection is not configured for this build.');
      return;
    }
    if (!nativeAuthSupported) {
      setMessage('Native account linking is available in the iOS and Android app, not this web preview.');
      return;
    }

    setBusy(true);
    try {
      const request = await createMobileAuthRequest();
      setPendingRequest(request);
      await Linking.openURL(request.authorizeUrl);
      setMessage('Complete sign-in in your browser, then return to MapAble.');
    } catch (error) {
      setPendingRequest(null);
      setMessage(error instanceof Error ? error.message : 'MapAble sign-in could not be started.');
    } finally {
      setBusy(false);
    }
  }

  async function saveDigitalPreference(
    key: 'largeText' | 'highContrast' | 'reducedMotion',
    value: boolean,
  ) {
    if (!session) {
      setMessage('Sign in before syncing accessibility preferences.');
      return;
    }

    if (key === 'largeText') setLargeText(value);
    if (key === 'highContrast') setHighContrast(value);
    if (key === 'reducedMotion') setReduceMotion(value);

    setBusy(true);
    setMessage(null);
    try {
      await updateDigitalPreferences(session.accessToken, { [key]: value });
      setMessage('Accessibility preference saved to MapAble.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Accessibility preference could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  function toggleCommunicationPreference(value: CommunicationPreference) {
    setCommunicationPreferences((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function saveCommunicationPreferences() {
    if (!session) {
      setMessage('Sign in before syncing communication preferences.');
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const updated = await updateCommunicationPreferences(
        session.accessToken,
        communicationPreferences,
      );
      setProfile(updated);
      setCommunicationPreferences(updated.communicationPreferences);
      setMessage('Communication preferences saved to MapAble.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Communication preferences could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    setSession(null);
    setProfile(null);
    setPendingRequest(null);
    setCommunicationPreferences([]);
    setMessage('Signed out of the mobile session.');
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>MapAble account & My Access</Text>
      <Text style={styles.body}>
        Sign in through the MapAble browser flow. Your password, passkey and two-factor code stay in the web sign-in experience and are not collected by this native screen.
      </Text>
      <Text style={styles.note}>
        The mobile token is short-lived, limited to identity and accessibility scopes, and is kept only in memory in this first integration. Restarting the app signs you out.
      </Text>

      {!session ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in to MapAble"
          accessibilityState={{ disabled: busy || !configured || !nativeAuthSupported }}
          disabled={busy || !configured || !nativeAuthSupported}
          onPress={startSignIn}
          style={({ pressed }) => [
            styles.primaryButton,
            (busy || !configured || !nativeAuthSupported) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Starting sign-in…' : 'Sign in to MapAble'}</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.identityBox}>
            <Text style={styles.title}>{session.user.name}</Text>
            <Text style={styles.body}>{session.user.email}</Text>
            <Text style={styles.note}>Role: {session.user.primaryRole}</Text>
          </View>

          <Text style={styles.subheading}>Digital access preferences</Text>
          <PreferenceSwitch
            label="Large text"
            value={largeText}
            disabled={busy}
            onValueChange={(value) => void saveDigitalPreference('largeText', value)}
          />
          <PreferenceSwitch
            label="High contrast"
            value={highContrast}
            disabled={busy}
            onValueChange={(value) => void saveDigitalPreference('highContrast', value)}
          />
          <PreferenceSwitch
            label="Reduce motion"
            value={reduceMotion}
            disabled={busy}
            onValueChange={(value) => void saveDigitalPreference('reducedMotion', value)}
          />

          <Text style={styles.subheading}>Communication preferences</Text>
          <Text style={styles.note}>Choose any that help you communicate with MapAble services.</Text>
          <View style={styles.chipWrap}>
            {communicationOptions.map((option) => {
              const selected = communicationPreferences.includes(option.value);
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected, disabled: busy }}
                  disabled={busy}
                  onPress={() => toggleCommunicationPreference(option.value)}
                  style={[styles.chip, selected && styles.chipSelected, busy && styles.disabled]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save communication preferences"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() => void saveCommunicationPreferences()}
            style={({ pressed }) => [styles.secondaryButton, busy && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Save communication preferences</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out of MapAble mobile session"
            disabled={busy}
            onPress={signOut}
            style={({ pressed }) => [styles.secondaryButton, busy && styles.disabled, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </>
      )}

      {busy ? (
        <View style={styles.statusRow} accessibilityLiveRegion="polite">
          <ActivityIndicator accessibilityLabel="Working" />
          <Text style={styles.note}>Working…</Text>
        </View>
      ) : null}

      {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
      {profile ? <Text style={styles.note}>Profile connection active for this session.</Text> : null}
    </View>
  );
}

function PreferenceSwitch({
  label,
  value,
  disabled,
  onValueChange,
}: {
  label: string;
  value: boolean;
  disabled: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.body}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DAD6',
    borderRadius: 14,
  },
  title: { fontSize: 17, lineHeight: 24, fontWeight: '800', color: '#171A1B' },
  subheading: { marginTop: 4, fontSize: 16, lineHeight: 23, fontWeight: '800', color: '#171A1B' },
  body: { fontSize: 16, lineHeight: 23, color: '#171A1B' },
  note: { fontSize: 14, lineHeight: 20, color: '#5D6264' },
  message: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: '#243B53' },
  identityBox: { gap: 3, padding: 12, borderRadius: 10, backgroundColor: '#F0F1EF' },
  preferenceRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D8DAD6',
  },
  primaryButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 9,
    backgroundColor: '#243B53',
  },
  primaryButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  secondaryButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D8DAD6',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '800', color: '#171A1B' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D8DAD6',
    backgroundColor: '#FFFFFF',
  },
  chipSelected: { backgroundColor: '#243B53', borderColor: '#243B53' },
  chipText: { fontSize: 15, fontWeight: '700', color: '#171A1B' },
  chipTextSelected: { color: '#FFFFFF' },
  statusRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
