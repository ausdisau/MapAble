import { requirePermission } from "@/lib/auth/guards";
import { phase7Config } from "@/lib/config/phase7";

export default async function GovernmentPartnerPage() {
  await requirePermission("government:portal");

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Government partner portal</h1>
      {!phase7Config.governmentPartnerPortalEnabled ? (
        <p>This portal is not enabled in this environment.</p>
      ) : (
        <p className="text-muted-foreground">
          Access approved aggregate reports via your assigned workspace. No
          participant-identifiable data is shown by default.
        </p>
      )}
    </main>
  );
}
