import { NextResponse } from "next/server";

import { getApiVersionPolicy } from "@/lib/api/versioning/version-policy-service";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";

export type ResolvedApiVersion = "v1" | "v2";

export async function resolveApiVersion(req: Request): Promise<ResolvedApiVersion> {
  const path = new URL(req.url).pathname;
  if (path.startsWith("/api/v2/")) return "v2";
  if (path.startsWith("/api/v1/")) return "v1";

  const header = req.headers.get("accept-version")?.toLowerCase();
  if (header === "v2" && y3NationalTrustConfig.publicApiV2PartnerEnabled) {
    return "v2";
  }

  const policy = await getApiVersionPolicy();
  return (policy.defaultVersion as ResolvedApiVersion) ?? "v1";
}

export function withApiVersionHeaders(
  response: NextResponse,
  version: ResolvedApiVersion,
  v2Stable: boolean
) {
  response.headers.set("X-MapAble-Api-Version", version);
  if (version === "v1" && y3NationalTrustConfig.publicApiV2PartnerEnabled) {
    response.headers.set(
      "Deprecation",
      v2Stable ? "true" : "false — v2 available in draft"
    );
    response.headers.set("Link", '</api/v2/places>; rel="successor-version"');
  }
  return response;
}

export async function isPublicApiV2Enabled() {
  if (!y3NationalTrustConfig.publicApiV2PartnerEnabled) return false;
  const policy = await getApiVersionPolicy();
  const v2 = policy.versions.find((v) => v.version === "v2");
  return v2?.status === "stable" || v2?.status === "draft";
}
