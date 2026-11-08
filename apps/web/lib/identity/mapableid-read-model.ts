/**
 * Participant-owned account metadata only. Does not certify the original login
 * method, MFA, identity proofing, service federation or delegate authority.
 *
 * This is a pure presenter: caller MUST obtain identity from the authenticated
 * MapAble server session, never a browser-provided userId or role.
 */
export type MapAbleIdReadInput = {
  displayName: string;
  email: string;
  roleLabel: string;
  storedPasskeyCredentials: number;
  activeRecipientConsents: number;
};

export type MapAbleIdReadSnapshot = {
  version: 1;
  mode: "server_verified_read_only";
  account: {
    displayName: string;
    email: string;
    role: string;
  };
  session: {
    authenticationService: "Existing MapAble NextAuth session";
    signedIn: true;
    originalSignInMethod: "not_attested";
    mfaAssurance: "not_attested";
  };
  passkeys: {
    storedCredentialCount: number;
    usabilityOrRecentVerification: "not_attested";
  };
  sharing: {
    activeRecipientConsentCount: number;
    delegateAuthority: "not_determined";
  };
  services: readonly [
    { id: "mapable"; label: "MapAble"; state: "current_workspace" },
    { id: "adid"; label: "AD.iD federation"; state: "not_independently_verified" },
  ];
  recovery: {
    configuredMethod: "not_attested";
    humanSupportRoute: "/dashboard/safety/support";
  };
  explanation: string;
};

function boundedText(value: string, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error("MAPABLEID_INVALID_" + label);
  const normalised = value.trim();
  if (!normalised || normalised.length > maxLength) {
    throw new Error("MAPABLEID_INVALID_" + label);
  }
  return normalised;
}

function validCount(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("MAPABLEID_INVALID_" + label);
  }
  return value;
}

export function buildMapAbleIdReadSnapshot(
  input: MapAbleIdReadInput,
): MapAbleIdReadSnapshot {
  return {
    version: 1,
    mode: "server_verified_read_only",
    account: {
      displayName: boundedText(input.displayName, "DISPLAY_NAME", 200),
      email: boundedText(input.email, "EMAIL", 320),
      role: boundedText(input.roleLabel, "ROLE", 100),
    },
    session: {
      authenticationService: "Existing MapAble NextAuth session",
      signedIn: true,
      originalSignInMethod: "not_attested",
      mfaAssurance: "not_attested",
    },
    passkeys: {
      storedCredentialCount: validCount(input.storedPasskeyCredentials, "PASSKEY_COUNT"),
      usabilityOrRecentVerification: "not_attested",
    },
    sharing: {
      activeRecipientConsentCount: validCount(input.activeRecipientConsents, "CONSENT_COUNT"),
      delegateAuthority: "not_determined",
    },
    services: [
      { id: "mapable", label: "MapAble", state: "current_workspace" },
      { id: "adid", label: "AD.iD federation", state: "not_independently_verified" },
    ],
    recovery: {
      configuredMethod: "not_attested",
      humanSupportRoute: "/dashboard/safety/support",
    },
    explanation:
      "MapAble confirms your current application session and counts its own stored records. " +
      "This page does not certify the sign-in method, MFA, a functioning passkey, delegate authority, " +
      "AD.iD federation, or access to other applications.",
  };
}
