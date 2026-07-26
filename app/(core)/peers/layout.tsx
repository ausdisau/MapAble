import type { Metadata } from "next";

import { isPeerPeersRequest } from "@/lib/community/mapable-peers/peers-request";

const PEER_PEERS_ORIGIN = "https://peer.mapable.com.au";

export async function generateMetadata(): Promise<Metadata> {
  const peer = await isPeerPeersRequest();
  if (!peer) return {};

  return {
    metadataBase: new URL(PEER_PEERS_ORIGIN),
    title: {
      default: "MapAble PEERS",
      template: "%s · MapAble PEERS",
    },
    description:
      "Disability community on MapAble — chronological rooms, no additive feed algorithms.",
    alternates: {
      canonical: PEER_PEERS_ORIGIN,
    },
  };
}

export default function PeersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
