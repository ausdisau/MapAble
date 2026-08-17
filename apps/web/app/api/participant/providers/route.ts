import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { participantMarketplaceConfig } from "@/lib/config/participant-marketplace";
import {
  compareProviderEvidence,
  discoverProviders,
} from "@/lib/marketplace/participant-marketplace-service";

export async function GET(request: Request) {
  if (!participantMarketplaceConfig.enabled) {
    return jsonError("Participant marketplace is unavailable", 503);
  }
  const participant = await requireApiSession();
  if (participant instanceof Response) return participant;
  try {
    const query = new URL(request.url).searchParams;
    const providers = await discoverProviders({
      participantId: participant.id,
      serviceType: query.get("serviceType") ?? undefined,
      serviceArea: query.get("serviceArea") ?? undefined,
      deliveryMode: query.get("deliveryMode") ?? undefined,
      communicationCapability:
        query.get("communicationCapability") ?? undefined,
      accessibilityFeature: query.get("accessibilityFeature") ?? undefined,
    });
    return jsonOk({
      providers,
      comparison: compareProviderEvidence(providers),
      rankingPolicy:
        "Results use active filters and evidence only. No sponsored or universal score affects order.",
    });
  } catch {
    return jsonError("Participant marketplace is unavailable", 503);
  }
}
