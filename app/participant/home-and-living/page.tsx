import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Home and Living | MapAble" };

export default async function HomeLivingPage() {
  const participant = await requireAuth();
  const profile = await prisma.homeLivingProfile.findUnique({
    where: { participantId: participant.id },
  });
  return (
    <section aria-labelledby="home-living-heading" className="space-y-5">
      <header>
        <h1
          id="home-living-heading"
          className="font-heading text-3xl font-bold"
        >
          Home and Living
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Record your own preferences, access requirements, privacy choices and
          non-negotiables. This does not determine funding or choose a home for
          you.
        </p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <dt className="font-bold">Living arrangements</dt>
          <dd>
            {profile?.desiredLivingArrangements.join(", ") || "Not recorded"}
          </dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="font-bold">Preferred locations</dt>
          <dd>{profile?.preferredLocations.join(", ") || "Not recorded"}</dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="font-bold">Accessibility requirements</dt>
          <dd>
            {profile?.accessibilityRequirements.join(", ") || "Not recorded"}
          </dd>
        </div>
        <div className="rounded-xl border p-4">
          <dt className="font-bold">Your non-negotiables</dt>
          <dd>{profile?.nonNegotiables.join(", ") || "Not recorded"}</dd>
        </div>
      </dl>
      <Link
        className="inline-flex min-h-11 items-center underline"
        href="/dashboard/messages"
      >
        Ask a person for Home and Living support
      </Link>
    </section>
  );
}
