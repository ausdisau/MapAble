import { ParticipantProviderDiscovery } from "@/components/marketplace/ParticipantProviderDiscovery";
import { requireAuth } from "@/lib/auth/guards";
import { participantMarketplaceConfig } from "@/lib/config/participant-marketplace";
import { discoverProviders } from "@/lib/marketplace/participant-marketplace-service";

export const metadata = { title: "Find providers | MapAble" };

export default async function ParticipantDiscoverPage() {
  const participant = await requireAuth();
  const providers: Awaited<ReturnType<typeof discoverProviders>> =
    participantMarketplaceConfig.enabled
      ? await discoverProviders({ participantId: participant.id })
      : [];
  return <ParticipantProviderDiscovery initialProviders={providers} />;
}
