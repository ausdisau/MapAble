import Link from "next/link";

import { ThrivingKidsIntakeWizard } from "@/components/onboarding/ThrivingKidsIntakeWizard";
import { requireAuth } from "@/lib/auth/guards";
import { isThrivingKidsTriageEnabled } from "@/lib/config/thriving-kids";

export const metadata = {
  title: "Thriving Kids triage | MapAble",
  description:
    "Draft parental intake routing for Thriving Kids foundational supports versus NDIS pathways.",
};

export default async function ThrivingKidsOnboardingPage() {
  const user = await requireAuth();

  if (!isThrivingKidsTriageEnabled()) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-12">
        <h1 className="font-heading text-2xl font-bold">
          Thriving Kids foundational triage
        </h1>
        <p className="text-sm text-muted-foreground">
          This scaffold is disabled. Set{" "}
          <code className="rounded bg-muted px-1">
            MAPABLE_THRIVING_KIDS_TRIAGE_ENABLED=true
          </code>{" "}
          to preview.
        </p>
        <Link href="/dashboard" className="text-sm underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <ThrivingKidsIntakeWizard participantId={user.id} />;
}
