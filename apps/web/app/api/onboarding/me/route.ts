import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import {
  getOnboardingForUser,
  refreshParticipantOnboarding,
  refreshProviderOnboarding,
  refreshWorkerOnboarding,
} from "@/lib/onboarding/onboarding-service";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const profile = await getOnboardingForUser(user.id, user.primaryRole);
  return jsonOk({ profile });
}

export async function PATCH() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  try {
    if (user.primaryRole === "participant") {
      const profile = await refreshParticipantOnboarding(user.id, user.id);
      return jsonOk({ profile });
    }

    if (user.primaryRole === "support_worker") {
      const worker = await prisma.workerProfile.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (!worker) return jsonError("No worker profile", 404);
      const profile = await refreshWorkerOnboarding(worker.id, user.id);
      return jsonOk({ profile });
    }

    const membership = await prisma.organisationMember.findFirst({
      where: { userId: user.id },
    });
    if (!membership) return jsonError("No organisation membership", 404);
    const profile = await refreshProviderOnboarding(
      membership.organisationId,
      user.id
    );
    return jsonOk({ profile });
  } catch {
    return jsonError("Onboarding refresh failed", 500);
  }
}
