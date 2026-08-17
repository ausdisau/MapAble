import { headers } from "next/headers";

import {
  isPeerPeersHostname,
  PEER_PEERS_REQUEST_HEADER,
  peersPath,
} from "@/lib/community/mapable-peers/peer-host";

export async function isPeerPeersRequest(): Promise<boolean> {
  const h = await headers();
  if (h.get(PEER_PEERS_REQUEST_HEADER) === "1") return true;
  return isPeerPeersHostname(h.get("host") ?? "");
}

export async function peersHref(subpath: string = ""): Promise<string> {
  const peer = await isPeerPeersRequest();
  const stripped = subpath
    .replace(/^\/?(?:square|peers)\/?/, "")
    .replace(/^\//, "");
  return peersPath(stripped ? `/${stripped}` : "", peer);
}

export async function getPeersLinkHelpers() {
  const peer = await isPeerPeersRequest();
  return {
    peer,
    home: peersPath("", peer),
    principles: peersPath("/principles", peer),
    room: (slug: string) => peersPath(`/rooms/${slug}`, peer),
  };
}
