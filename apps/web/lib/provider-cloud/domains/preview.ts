/**
 * Synthetic-only ProviderCloud planning. No registrar, DNS, Vercel or persistence.
 */
export type DomainPreviewMode = "platform_subdomain" | "existing_domain";
export type DomainBindingPreview = {
  synthetic: true;
  organisationId: string;
  hostname: string;
  mode: DomainPreviewMode;
  state: "draft_only";
  registrarStatus: "not_requested";
  ownershipStatus: "not_verified";
  dnsStatus: "not_checked";
  tlsStatus: "not_checked";
  publicationStatus: "blocked";
  nextSteps: string[];
};

export class DomainPreviewInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainPreviewInputError";
  }
}

/** Hard deny production even if the preview flag is accidentally enabled. */
export function isDomainPreviewEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    env.MAPABLE_PROVIDER_DOMAIN_PREVIEW_ENABLED === "true" &&
    env.NODE_ENV !== "production" &&
    env.VERCEL_ENV !== "production"
  );
}

/** Neither a global role nor a user-supplied org ID is sufficient on its own. */
export function canPreviewOrganisationDomain(input: {
  actorRoles: readonly string[];
  organisationId: string;
  memberOrganisationIds: readonly string[];
}): boolean {
  return (
    input.actorRoles.includes("provider_admin") &&
    input.organisationId.length > 0 &&
    input.memberOrganisationIds.includes(input.organisationId)
  );
}

const RESERVED_EXAMPLES = ["example.com", "example.org", "example.net"];

export function normaliseSyntheticHostname(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 253) {
    throw new DomainPreviewInputError("Enter a valid example domain name.");
  }
  const hostname = raw.trim().toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname.length > 253 || !/^[a-z0-9.-]+$/.test(hostname)) {
    throw new DomainPreviewInputError("Enter a plain hostname, without a URL or port.");
  }
  const labels = hostname.split(".");
  if (
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        label.startsWith("-") ||
        label.endsWith("-"),
    )
  ) {
    throw new DomainPreviewInputError("The hostname contains an invalid label.");
  }
  const exampleSuffix = RESERVED_EXAMPLES.some(
    (suffix) => hostname === suffix || hostname.endsWith("." + suffix),
  );
  if (!exampleSuffix && !hostname.endsWith(".test")) {
    throw new DomainPreviewInputError(
      "Synthetic previews only accept reserved .test or example.com/.org/.net hostnames. Do not enter a real domain.",
    );
  }
  return hostname;
}

export function buildSyntheticDomainPreview(input: {
  organisationId: string;
  hostname: unknown;
  mode: unknown;
}): DomainBindingPreview {
  const hostname = normaliseSyntheticHostname(input.hostname);
  if (input.mode !== "platform_subdomain" && input.mode !== "existing_domain") {
    throw new DomainPreviewInputError("Choose one of the domain connection modes.");
  }
  if (
    input.mode === "platform_subdomain" &&
    !hostname.endsWith(".sites.example.test")
  ) {
    throw new DomainPreviewInputError(
      "For a platform subdomain preview, use a name such as provider.sites.example.test.",
    );
  }
  return {
    synthetic: true,
    organisationId: input.organisationId,
    hostname,
    mode: input.mode,
    state: "draft_only",
    registrarStatus: "not_requested",
    ownershipStatus: "not_verified",
    dnsStatus: "not_checked",
    tlsStatus: "not_checked",
    publicationStatus: "blocked",
    nextSteps:
      input.mode === "existing_domain"
        ? [
            "Confirm provider control of the domain using a real ownership challenge in a later phase.",
            "Request exact DNS configuration from Vercel without altering existing email records.",
            "Verify ownership, DNS routing, TLS and tenant isolation before human-approved publication.",
          ]
        : [
            "Confirm control of the platform-managed child DNS zone in a later phase.",
            "Create a unique hostname binding with server-verified organisation permissions.",
            "Verify routing and TLS before human-approved publication.",
          ],
  };
}
