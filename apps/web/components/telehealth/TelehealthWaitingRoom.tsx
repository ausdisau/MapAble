import { TelehealthConsentPanel } from "@/components/telehealth/TelehealthConsentPanel";
import { TelehealthJoinButton } from "@/components/telehealth/TelehealthJoinButton";

export function TelehealthWaitingRoom({
  joinUrl,
  ready,
}: {
  joinUrl: string;
  ready: boolean;
}) {
  return (
    <div className="space-y-4">
      <TelehealthConsentPanel />
      <TelehealthJoinButton joinUrl={joinUrl} disabled={!ready} />
    </div>
  );
}
