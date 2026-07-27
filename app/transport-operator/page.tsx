import { ContinuityRecoveryPanel } from "@/components/transport/ContinuityRecoveryPanel";
import { DisruptionQueuePanel } from "@/components/transport/DisruptionQueuePanel";
import { requireAuth } from "@/lib/auth/guards";
import { transportCommandConfig } from "@/lib/config/transport-command";
import {
  listOpenDisruptions,
  listOpenRecoveries,
} from "@/lib/transport/continuity/recovery-service";

export const metadata = { title: "Transport command centre | MapAble" };

export default async function TransportOperatorPage() {
  await requireAuth();

  const enabled = transportCommandConfig.commandCentreEnabled;
  const [disruptions, recoveries] = enabled
    ? await Promise.all([listOpenDisruptions(), listOpenRecoveries()])
    : [[], []];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Transport command centre</h1>
        <p className="text-muted-foreground">
          Monitor disruptions, return-trip assurance, and continuity recovery. Automatic
          substitution is disabled — all changes require participant confirmation.
        </p>
      </header>

      {!enabled ? (
        <p className="rounded-lg border border-dashed p-4 text-sm" role="status">
          Set MAPABLE_TRANSPORT_COMMAND_ENABLED=true to activate the command centre.
        </p>
      ) : (
        <>
          <DisruptionQueuePanel disruptions={disruptions} />
          <ContinuityRecoveryPanel recoveries={recoveries} />
        </>
      )}
    </div>
  );
}
