import { AacMethodsPanel } from "@/components/communication/AacMethodsPanel";
import { CommunicationPassportPanel } from "@/components/communication/CommunicationPassportPanel";
import { DegradedModeBanner } from "@/components/communication/DegradedModeBanner";
import { EmergencyCardPanel } from "@/components/communication/EmergencyCardPanel";
import { SavedPhrasesPanel } from "@/components/communication/SavedPhrasesPanel";
import { VoiceCommandsDemo } from "@/components/communication/VoiceCommandsDemo";
import { requireAuth } from "@/lib/auth/guards";
import { mobileCommunicationConfig } from "@/lib/config/mobile-communication";
import { getOrCreatePassport } from "@/lib/communication/communication-passport-service";
import { computeDegradedModeIndicator } from "@/lib/platform/offline/degraded-mode";
import { createInitialOfflineShellState } from "@/lib/platform/offline/offline-contracts";

export const metadata = { title: "Communication passport | MapAble" };

export default async function ParticipantCommunicationPage() {
  const user = await requireAuth();
  const aacEnabled = mobileCommunicationConfig.aacCommunicationEnabled;
  const voiceEnabled = mobileCommunicationConfig.voiceCommandsEnabled;
  const offlineEnabled = mobileCommunicationConfig.pwaOfflineEnabled;

  const passport = aacEnabled ? await getOrCreatePassport(user.id) : null;

  const degradedIndicator = offlineEnabled
    ? computeDegradedModeIndicator({
        shell: createInitialOfflineShellState(),
        pendingSyncCount: 0,
        conflictCount: 0,
        pushAvailable: mobileCommunicationConfig.mobilePushEnabled,
      })
    : { active: false, reasons: [], message: "", ariaLive: "polite" as const };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Communication passport</h1>
        <p className="text-muted-foreground">
          Share how you communicate using AAC preferences, saved phrases, and an
          emergency card. Speech difficulty is never treated as reduced capacity.
        </p>
      </header>

      {offlineEnabled ? <DegradedModeBanner indicator={degradedIndicator} /> : null}

      {!aacEnabled ? (
        <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
          AAC communication passport is not enabled in this environment.
        </p>
      ) : (
        <>
          <CommunicationPassportPanel passport={passport} />
          <SavedPhrasesPanel phrases={passport?.savedPhrases ?? []} />
          <AacMethodsPanel methods={passport?.aacMethodPreferences ?? []} />
          <EmergencyCardPanel card={passport?.emergencyCard} />
        </>
      )}

      {voiceEnabled ? (
        <section aria-labelledby="voice-heading" className="space-y-3">
          <h2 id="voice-heading" className="font-heading text-lg font-semibold">
            Voice commands
          </h2>
          <p className="text-sm text-muted-foreground">
            Consequential voice actions always require confirmation on an accessible
            screen — bypass is disabled.
          </p>
          <VoiceCommandsDemo />
        </section>
      ) : null}
    </div>
  );
}
