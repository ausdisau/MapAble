import Link from "next/link";

import { CorePageHeader } from "@/components/core/CorePageHeader";
import { PeersContrastTable } from "@/components/mapable-peers/PeersContrastTable";
import { PeersPrincipleList } from "@/components/mapable-peers/PeersPrincipleList";
import { PEERS_TAGLINE } from "@/lib/community/mapable-peers/copy";
import { getPeersLinkHelpers } from "@/lib/community/mapable-peers/peers-request";

export const metadata = {
  title: "MapAble PEERS — Principles",
  description:
    "Design principles for MapAble PEERS: genuine disability community without additive feed algorithms.",
};

export default async function PeersPrinciplesPage() {
  const links = await getPeersLinkHelpers();

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      <CorePageHeader
        eyebrow="MapAble PEERS"
        title="Principles"
        description="PEERS is intentionally boring in the right ways: predictable order, clear rooms, and no hidden ranking inside discussion."
      />

      <PeersPrincipleList />

      <section className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Contrast with feed logic</h2>
        <PeersContrastTable />
      </section>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-sm">
        <h2 className="font-heading text-lg font-semibold">Commitment</h2>
        <p className="mt-2 text-muted-foreground">
          MapAble PEERS will not ship “For you”, “Trending”, or engagement-weighted discussion
          ordering. If we ever propose a different sort, it will be explicit, opt-in, and listed in
          the{" "}
          <Link href="/algorithms" className="font-medium text-primary hover:underline">
            algorithm register
          </Link>{" "}
          — and never the default.
        </p>
        <p className="mt-4 font-medium">{PEERS_TAGLINE}</p>
      </section>

      <p>
        <Link href={links.home} className="text-sm font-medium text-primary hover:underline">
          ← Back to PEERS
        </Link>
      </p>
    </div>
  );
}
