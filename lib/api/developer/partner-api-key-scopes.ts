/** Partner API Program scopes selectable when creating a key. */
export const PARTNER_API_KEY_SCOPES = [
  {
    id: "directory:read",
    label: "Directory:Read",
    description: "Read provider and venue directory data.",
  },
  {
    id: "wayfinding:compute",
    label: "Wayfinding:Compute",
    description: "Compute indoor 3D wayfinding routes.",
  },
  {
    id: "claims:write",
    label: "Claims:Write",
    description: "Submit and update partner claims payloads.",
  },
] as const;

export type PartnerApiKeyScopeId =
  (typeof PARTNER_API_KEY_SCOPES)[number]["id"];

export const PARTNER_API_KEY_SCOPE_IDS = [
  "directory:read",
  "wayfinding:compute",
  "claims:write",
] as const satisfies readonly PartnerApiKeyScopeId[];

export function isPartnerApiKeyScopeId(
  value: string
): value is PartnerApiKeyScopeId {
  return (PARTNER_API_KEY_SCOPE_IDS as readonly string[]).includes(value);
}
