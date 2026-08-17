"use client";

import { MapAbleSiteHeader } from "@/components/brand/MapAbleSiteHeader";
import { MAPABLE_MARKETING_URL } from "@/lib/brand/constants";

const PEER_PEERS_NAV = [
  { href: "/", label: "PEERS" },
  { href: "/principles", label: "Principles" },
  { href: "/access", label: "Access" },
] as const;

export function PeersSiteHeader() {
  return (
    <MapAbleSiteHeader
      logoHref="/"
      logoTitle="MapAble"
      logoSubtitle="PEERS"
      navItems={[...PEER_PEERS_NAV]}
      externalCta={{ href: MAPABLE_MARKETING_URL, label: "mapable.com.au" }}
    />
  );
}
