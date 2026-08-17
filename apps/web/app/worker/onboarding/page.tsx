import Link from "next/link";

import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { requireAuth } from "@/lib/auth/guards";
import { roleLabel } from "@/lib/auth/roles";

export const metadata = { title: "Worker onboarding | MapAble" };

export default async function WorkerOnboardingPage() {
  const user = await requireAuth();

  if (user.primaryRole !== "support_worker") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <h1 className="font-heading text-2xl font-bold">Worker onboarding</h1>
        <p className="text-muted-foreground">
          This page is for support workers. You are signed in as{" "}
          {roleLabel(user.primaryRole)}.
        </p>
        <Link href="/dashboard" className="text-primary underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <h1 className="font-heading text-2xl font-bold">Worker onboarding</h1>
      <p className="text-muted-foreground">
        Complete your profile and credentials so your provider can verify you for
        care shifts.
      </p>
      <OnboardingChecklist />
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/worker/profile" className="text-primary underline">
          Edit profile
        </Link>
        <Link href="/worker/today" className="text-primary underline">
          Today&apos;s shifts
        </Link>
        <Link href="/dashboard" className="text-primary underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
