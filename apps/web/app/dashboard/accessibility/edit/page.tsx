import { AccessibilityProfileForm } from "@/components/forms/AccessibilityProfileForm";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { DigitalPreferences, TransportRequirements } from "@/types/mapable";

export const metadata = { title: "Edit accessibility | MapAble Core" };

export default async function EditAccessibilityPage() {
  const user = await requireAuth();
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Edit accessibility preferences
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Tell MapAble how to support your access needs. You control sharing via
          consent on each booking.
        </p>
      </header>
      <AccessibilityProfileForm
        initial={{
          mobilityNeeds: (profile?.mobilityNeeds as string[]) ?? [],
          communicationPreferences:
            (profile?.communicationPreferences as string[]) ?? [],
          transportRequirements:
            (profile?.transportRequirements as TransportRequirements) ?? {},
          digitalPreferences:
            (profile?.digitalPreferences as DigitalPreferences) ?? {},
        }}
      />
    </div>
  );
}
