import Link from "next/link";

import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Onboarding | MapAble" };

export default async function ParticipantOnboardingPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Your onboarding checklist</h1>
      <p className="text-muted-foreground">
        Complete these steps before matching and booking. Nothing is assigned
        automatically until you are ready.
      </p>
      <OnboardingChecklist />
      <Link
        href="/dashboard"
        className="inline-block text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
