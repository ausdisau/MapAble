import Link from "next/link";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { PeersContrastTable } from "@/components/mapable-peers/PeersContrastTable";
import { PeersHeritage } from "@/components/mapable-peers/PeersHeritage";
import { PeersPrincipleList } from "@/components/mapable-peers/PeersPrincipleList";
import { PeersRelatedLinks } from "@/components/mapable-peers/PeersRelatedLinks";
import { PeersRoomGrid } from "@/components/mapable-peers/PeersRoomGrid";
import { PEERS_DESCRIPTION, PEERS_TAGLINE } from "@/lib/community/mapable-peers/copy";
import { getPeersLinkHelpers } from "@/lib/community/mapable-peers/peers-request";
import { PEERS_ROOMS } from "@/lib/community/mapable-peers/rooms";

export const metadata = {
  title: "MapAble PEERS",
  description: PEERS_TAGLINE,
};

export default async function MapAblePeersPage() {
  const links = await getPeersLinkHelpers();

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
      <CorePageHeader
        eyebrow="Community"
        title={
          <>
            MapAble <span className="text-primary">PEERS</span>
          </>
        }
        description={PEERS_DESCRIPTION}
      >
        <p className="max-w-2xl text-sm font-medium text-foreground">{PEERS_TAGLINE}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={links.principles}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read the principles
          </Link>
          <Link
            href={links.room("introduce-yourself")}
            className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            Enter a room
          </Link>
        </div>
      </CorePageHeader>

      <section aria-labelledby="peers-contrast-heading" className="space-y-4">
        <h2 id="peers-contrast-heading" className="font-heading text-xl font-semibold">
          Against additive feeds posing as community
        </h2>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Many platforms sort disability discussion by engagement predictions. PEERS refuses that
          trade: the same room order for everyone, moderation in the open, and algorithms only where
          MapAble publishes them elsewhere.
        </p>
        <PeersContrastTable />
      </section>

      <section aria-labelledby="peers-principles-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="peers-principles-heading" className="font-heading text-xl font-semibold">
            How PEERS works
          </h2>
          <Link href={links.principles} className="text-sm font-medium text-primary hover:underline">
            Full principles →
          </Link>
        </div>
        <PeersPrincipleList />
      </section>

      <section aria-labelledby="peers-rooms-heading" className="space-y-4">
        <h2 id="peers-rooms-heading" className="font-heading text-xl font-semibold">
          Rooms
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick a room by purpose — not by what an algorithm thinks you will engage with.
        </p>
        <PeersRoomGrid rooms={PEERS_ROOMS} roomHref={links.room} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(16rem,22rem)]">
        <PeersHeritage />
        <PeersRelatedLinks />
      </div>
    </div>
  );
}
