/**
 * Public, read-only resource bridge for MapAble LocalLinks.
 * Never forwards MapAble sessions, location, disability profiles, or user credentials.
 * Disapedia content remains under MediaWiki editorial and revision control.
 */
export const PUBLIC_RESOURCE_LINKS = [
  {
    id: "accessibooks",
    title: "AccessiBooks",
    description: "Explore accessible reading and listening resources on the independent AccessiBooks site.",
    href: "https://accessibooks.com.au/",
    kind: "reading",
    verification: "external-link",
  },
  {
    id: "disapedia",
    title: "Australian Disapedia",
    description: "Explore disability history, policy, culture and rights through a disability-led MediaWiki.",
    href: "https://disapedia.au/index.php/Main_Page",
    kind: "knowledge",
    verification: "external-link",
  },
] as const;

export type WikiHit = {
  pageId: number;
  title: string;
  url: string;
  revisionId?: number;
  revisionTimestamp?: string;
};

export type WikiSearchResult = {
  status: "ok" | "disabled" | "invalid-query" | "unavailable";
  source: "disapedia";
  results: WikiHit[];
};

export function normalisePublicQuery(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

/** Host allowlist prevents user input or environment errors becoming an open proxy. */
export function makeDisapediaSearchUrl(origin: string, query: string): URL | null {
  try {
    const base = new URL(origin);
    if (
      base.protocol !== "https:" ||
      !["disapedia.au", "staging.disapedia.au"].includes(base.hostname) ||
      base.port || base.username || base.password ||
      base.pathname !== "/" || base.search || base.hash
    ) return null;
    const url = new URL("/api.php", base);
    url.search = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrlimit: "8",
      prop: "info|revisions",
      inprop: "url",
      rvprop: "ids|timestamp",
      rvlimit: "1",
      format: "json",
      formatversion: "2",
    }).toString();
    return url;
  } catch {
    return null;
  }
}

export function parseDisapediaPages(payload: unknown, allowedHost: string): WikiHit[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as { query?: { pages?: unknown } };
  if (!Array.isArray(root.query?.pages)) return [];
  const ids = new Set<number>();
  const hits: WikiHit[] = [];
  for (const raw of root.query.pages) {
    if (!raw || typeof raw !== "object") continue;
    const p = raw as {
      pageid?: unknown;
      title?: unknown;
      fullurl?: unknown;
      revisions?: Array<{ revid?: unknown; timestamp?: unknown }>;
    };
    if (!Number.isInteger(p.pageid) || (p.pageid as number) <= 0 || ids.has(p.pageid as number)) continue;
    if (typeof p.title !== "string" || !p.title.trim() || p.title.length > 240) continue;
    if (typeof p.fullurl !== "string") continue;
    let target: URL;
    try { target = new URL(p.fullurl); } catch { continue; }
    if (target.protocol !== "https:" || target.hostname !== allowedHost || target.port || target.username || target.password) continue;
    ids.add(p.pageid as number);
    const rev = Array.isArray(p.revisions) ? p.revisions[0] : undefined;
    hits.push({
      pageId: p.pageid as number,
      title: p.title,
      url: target.toString(),
      ...(Number.isInteger(rev?.revid) && (rev?.revid as number) > 0 ? { revisionId: rev?.revid as number } : {}),
      ...(typeof rev?.timestamp === "string" && /^\d{4}-\d\d-\d\dT/.test(rev.timestamp) ? { revisionTimestamp: rev.timestamp } : {}),
    });
    if (hits.length >= 8) break;
  }
  return hits;
}

type ReadOptions = {
  enabled?: boolean;
  origin?: string;
  fetcher?: typeof fetch;
};

/**
 * A user-initiated search; the text alone goes to public MediaWiki.
 * Disabled by default, with graceful fallback to direct external links.
 */
export async function searchPublicDisapedia(input: unknown, opts: ReadOptions = {}): Promise<WikiSearchResult> {
  const empty = (status: WikiSearchResult["status"]): WikiSearchResult => ({
    status, source: "disapedia", results: [],
  });
  const query = normalisePublicQuery(input);
  if (query.length < 2) return empty("invalid-query");
  const enabled = opts.enabled ?? process.env.MAPABLE_DISAPEDIA_SEARCH_ENABLED === "true";
  if (!enabled) return empty("disabled");
  const url = makeDisapediaSearchUrl(opts.origin ?? process.env.DISAPEDIA_READONLY_ORIGIN ?? "https://disapedia.au", query);
  if (!url) return empty("unavailable");
  try {
    const response = await (opts.fetcher ?? fetch)(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return empty("unavailable");
    const headerBytes = Number(response.headers.get("content-length"));
    if (Number.isFinite(headerBytes) && headerBytes > 100_000) return empty("unavailable");
    const body = await response.text();
    if (body.length > 100_000) return empty("unavailable");
    const payload: unknown = JSON.parse(body);
    if (payload && typeof payload === "object" && "error" in payload) return empty("unavailable");
    return { status: "ok", source: "disapedia", results: parseDisapediaPages(payload, url.hostname) };
  } catch {
    return empty("unavailable");
  }
}
