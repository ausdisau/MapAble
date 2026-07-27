import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { careOSFeatureFlags } from "@/lib/intelligence/careos/config/feature-flags";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const [activity, lifeTwin, recommendations] = await Promise.all([
    prisma.careOSActivityEvent.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.participantLifeTwin.findFirst({
      where: { participantId: user.id, deletedAt: null },
      include: { memories: { where: { deletedAt: null } } },
    }),
    prisma.careOSRecommendation.findMany({
      where: { mission: { participantId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { evidence: true },
    }),
  ]);
  return jsonOk({
    agentsEnabled: careOSFeatureFlags.aiEnabled && careOSFeatureFlags.enabled
      ? ["Core Navigator", "Care Specialist", "Transport Specialist", "Access Evidence Specialist"]
      : [],
    modulesEnabled: ["core", "care", "transport", "access"].filter(
      (module) =>
        careOSFeatureFlags.enabled &&
        careOSFeatureFlags[`${module}Enabled` as "coreEnabled" | "careEnabled" | "transportEnabled" | "accessEnabled"]
    ),
    memory: lifeTwin?.memories ?? [],
    recentRecommendations: recommendations,
    activity,
    controls: {
      paused: !careOSFeatureFlags.enabled,
      canClearOptionalMemory: true,
      nonAIPath: "/care/new",
    },
  });
}
