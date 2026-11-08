/**
 * MapAbleID v0.3: own-account read model for the EXISTING MapAble session.
 * Do not infer OIDC claims, verified second factor, session revocation,
 * YubiKey hardware, delegate authority or cross-app entitlements.
 *
 * Caller obtains identity from requireAuth/requireApiSession, not a browser-
 * supplied id, email, issuer or role. Inputs here are data presentation only.
 */
export type MapAbleIdReadInput = {
  displayName: string;
  email: string;
  roleLabel: string;
  storedPasskeyCredentials: number;
  activeRecipientConsents: number;
};

export type IdentityAdapterReadStatus = {
  id: "nextauth" | "webauthn_yubikey" | "google_identity_mfa" | "adid_oidc";
  label: string;
  state: "existing_authority" | "existing_flow_separate" | "disabled";
  reason: string;
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
  services: ReadonlyArray<{
    id: "mapable" | "providercloud" | "accessibooks" | "cripsquare" | "adid";
    label: string;
    state: "current_workspace" | "not_independently_verified";
  }>;
  adapters: ReadonlyArray<IdentityAdapterReadStatus>;
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
      storedCredentialCount: validCount(
        input.storedPasskeyCredentials,
        "PASSKEY_COUNT",
      ),
      usabilityOrRecentVerification: "not_attested",
    },
    sharing: {
      activeRecipientConsentCount: validCount(
        input.activeRecipientConsents,
        "CONSENT_COUNT",
      ),
      delegateAuthority: "not_determined",
    },
    services: [
      { id: "mapable", label: "MapAble", state: "current_workspace" },
      {
        id: "providercloud",
        label: "ProviderCloud",
        state: "not_independently_verified",
      },
      { id: "accessibooks", label: "AccessiBooks", state: "not_independently_verified" },
      { id: "cripsquare", label: "CripSquare", state: "not_independently_verified" },
      { id: "adid", label: "AD.iD federation", state: "not_independently_verified" },
    ],
    adapters: [
      {
        id: "nextauth",
        label: "MapAble NextAuth",
        state: "existing_authority",
        reason: "Current application session verified by MapAble's existing server guard.",
      },
      {
        id: "webauthn_yubikey",
        label: "WebAuthn and YubiKey",
        state: "existing_flow_separate",
        reason:
          "Existing passkey routes are separate. A stored passkey does not attest " +
          "YubiKey hardware, recent sign-in or additional-factor verification.",
      },
      {
        id: "google_identity_mfa",
        label: "Google Identity Platform MFA",
        state: "disabled",
        reason: "No Google MFA verification or enforcement by MapAbleID.",
      },
      {
        id: "adid_oidc",
        label: "AD.iD federation",
        state: "disabled",
        reason:
          "No federation, token exchange or automatic account linking to AD.iD.",
      },
    ],
    recovery: {
      configuredMethod: "not_attested",
      humanSupportRoute: "/dashboard/safety/support",
    },
    explanation:
      "MapAble confirms your existing application session and counts its own stored records. " +
      "This page does not attest your original sign-in method, recent MFA, YubiKey hardware, " +
      "legal delegate authority or AD.iD access. None of these records grants a new permission.",
  };
}
