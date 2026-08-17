import { ParticipantProfileForm } from "@/components/forms/ParticipantProfileForm";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Edit profile | MapAble Core" };

export default async function EditProfilePage() {
  const user = await requireAuth();
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Edit profile</h1>
        <p className="mt-1 max-w-xl text-muted-foreground">
          Only you and approved supporters or MapAble admins can see your full
          profile. NDIS numbers are encrypted at rest.
        </p>
      </header>
      <ParticipantProfileForm
        initial={{
          displayName: profile?.displayName ?? user.name,
          preferredName: profile?.preferredName,
          homeSuburb: profile?.homeSuburb,
          homeState: profile?.homeState,
          participantNotes: profile?.participantNotes,
          primaryContactMethod: profile?.primaryContactMethod,
        }}
      />
    </div>
  );
}
