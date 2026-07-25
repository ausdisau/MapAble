import { jsonError } from "@/lib/api/response";

export const POST_V1_GOVERNANCE_MESSAGE =
  "Smart contracts and Trust Fabric APIs are slated for Post-V1. Year-One governance uses audit logs and attestations only.";

/** HTTP 501 — not implemented in Year-One MVP. */
export function postV1NotImplementedResponse() {
  return jsonError(POST_V1_GOVERNANCE_MESSAGE, 501);
}

/** HTTP 503 — service unavailable for Year-One MVP. */
export function postV1UnavailableResponse() {
  return jsonError(POST_V1_GOVERNANCE_MESSAGE, 503);
}
