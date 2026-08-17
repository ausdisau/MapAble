import Link from "next/link";

import { PasskeyRegistrationPanel } from "@/components/auth/PasskeyRegistrationPanel";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Profile | MapAble Core" };

export default async function ProfilePage() {
  const user = await requireAuth();
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
  });
  const passkeyCount = await prisma.passkeyCredential.count({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Basic information about you. Sensitive details are protected.
        </p>
        <Link
          href="/dashboard/profile/edit"
          className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
        >
          Edit profile →
        </Link>
        <Link
          href="/dashboard/support-profile"
          className="mt-2 ml-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Support profile →
        </Link>
      </header>

      {profile ? (
        <dl className="grid max-w-xl gap-3 rounded-xl border border-border bg-card p-4 text-sm">
          <div>
            <dt className="font-medium">Display name</dt>
            <dd>{profile.displayName}</dd>
          </div>
          {profile.preferredName ? (
            <div>
              <dt className="font-medium">Preferred name</dt>
              <dd>{profile.preferredName}</dd>
            </div>
          ) : null}
          {profile.homeSuburb || profile.homeState ? (
            <div>
              <dt className="font-medium">Location</dt>
              <dd>
                {[profile.homeSuburb, profile.homeState]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          ) : null}
          {profile.ndisParticipantNumberEnc ? (
            <div>
              <dt className="font-medium">NDIS number</dt>
              <dd>On file (masked for privacy)</dd>
            </div>
          ) : null}
        </dl>
      ) : (
        <p>No profile yet. Use edit to create one.</p>
      )}

      <PasskeyRegistrationPanel passkeyCount={passkeyCount} />
    </div>
  );
}
