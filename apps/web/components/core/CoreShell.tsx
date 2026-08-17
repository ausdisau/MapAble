import { CoreFooter } from "@/components/core/CoreFooter";
import { CoreHubNav } from "@/components/core/CoreHubNav";
import { MapAbleUserBar } from "@/components/layout/MapAbleUserBar";
import { PeersSiteHeader } from "@/components/mapable-peers/PeersSiteHeader";
import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";
import { requireAuth } from "@/lib/auth/guards";
import { isPeerPeersRequest } from "@/lib/community/mapable-peers/peers-request";
import type { UserRole } from "@/types/mapable";

export async function CoreShell({ children }: { children: React.ReactNode }) {
  const peerPeers = await isPeerPeersRequest();

  if (peerPeers) {
    return (
      <div className="mapable-soft flex min-h-screen flex-col bg-[#F6FBFC] text-[#0C1833]">
        <PeersSiteHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <CoreFooter />
      </div>
    );
  }

  const user = await requireAuth();

  return (
    <MapAbleAppShell
      variant="app"
      headerTitle="Core hub"
      logoHref="/dashboard"
      headerActions={
        <MapAbleUserBar userName={user.name} role={user.primaryRole as UserRole} />
      }
      secondaryNav={<CoreHubNav />}
    >
      {children}
    </MapAbleAppShell>
  );
}
