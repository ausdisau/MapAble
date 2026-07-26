/**
 * MapAble PEERS on peer.mapable.com.au — community without /peers in public URLs.
 * DNS: CNAME peer → Vercel project; add host in Vercel Domains.
 */
export const PEER_PEERS_REQUEST_HEADER = "x-mapable-peer-peers";

/** Comma-separated hostnames (no port). */
export const PEER_PEERS_HOSTS = (
  process.env.MAPABLE_PEER_PEERS_HOSTS ??
  process.env.MAPABLE_PEER_SQUARE_HOSTS ??
  "peer.mapable.com.au"
)
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

export function isPeerPeersHostname(host: string): boolean {
  const name = host.split(":")[0].toLowerCase();
  return PEER_PEERS_HOSTS.some((allowed) => name === allowed || name === `www.${allowed}`);
}

/** Public path for a PEERS route (peer host omits /peers prefix). */
export function peersPath(subpath: string, peer: boolean): string {
  const normalized =
    subpath === "" || subpath === "/"
      ? ""
      : subpath.startsWith("/")
        ? subpath
        : `/${subpath}`;
  if (peer) return normalized || "/";
  return normalized ? `/peers${normalized}` : "/peers";
}

export const PEER_PEERS_PUBLIC_PATHS = ["/", "/principles", "/rooms"] as const;

export function isPeerPeersPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/principles") return true;
  return pathname.startsWith("/rooms/") && pathname.length > "/rooms/".length;
}
