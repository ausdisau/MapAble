import {
  BETA_CONNECTED_ADAPTERS, BETA_PUBLISHED_RECORDS, resolveBetaPhase,
} from "@/lib/marketplace/alpha/open-beta-source-contract";

/**
 * Future public READ-ONLY beta catalogue. No imports are currently connected.
 * This route NEVER queries the internet, accepts records from the client,
 * returns supplier prices, or triggers payments.
 *
 * Review a later source-adapter PR before the enabled flags can return data.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const headers = {
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
  };
  if (resolveBetaPhase({
    MAPABLE_MARKETPLACE_OPEN_BETA_ENABLED:
      process.env.MAPABLE_MARKETPLACE_OPEN_BETA_ENABLED,
    MAPABLE_MARKETPLACE_EXTERNAL_DATA_ENABLED:
      process.env.MAPABLE_MARKETPLACE_EXTERNAL_DATA_ENABLED,
    MAPABLE_MARKETPLACE_BETA_SECURITY_REVIEW_APPROVED:
      process.env.MAPABLE_MARKETPLACE_BETA_SECURITY_REVIEW_APPROVED,
    MAPABLE_MARKETPLACE_BETA_PRIVACY_REVIEW_APPROVED:
      process.env.MAPABLE_MARKETPLACE_BETA_PRIVACY_REVIEW_APPROVED,
    MAPABLE_MARKETPLACE_BETA_LICENCE_REVIEW_APPROVED:
      process.env.MAPABLE_MARKETPLACE_BETA_LICENCE_REVIEW_APPROVED,
    MAPABLE_MARKETPLACE_BETA_PUBLISH_APPROVED:
      process.env.MAPABLE_MARKETPLACE_BETA_PUBLISH_APPROVED,
  }) !== "open-beta-readonly") {
    return Response.json({ error: "Not available" }, { status: 404, headers });
  }
  if (BETA_CONNECTED_ADAPTERS.length === 0 || BETA_PUBLISHED_RECORDS.length === 0) {
    return Response.json({
      mode: "open-beta-readonly",
      state: "no-approved-source-adapter",
      records: [],
      notice: "Live external catalogue ingestion has not been authorised.",
    }, { status: 503, headers });
  }
  return Response.json({
    mode: "open-beta-readonly",
    state: "read-only-reviewed-records",
    records: BETA_PUBLISHED_RECORDS,
    notice: "Directory evidence only. No item may be purchased from this feed.",
  }, { status: 200, headers });
}
