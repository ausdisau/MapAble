import assert from "node:assert/strict";
import test from "node:test";

import {
  buildMapAbleIdReadSnapshot,
} from "../../lib/identity/mapableid-read-model.ts";
import {
  isMapAbleIdReadOnlyEnabled,
} from "../../lib/identity/mapableid-read-flag.ts";

const USER = {
  displayName: "Example Participant",
  email: "example@example.invalid",
  roleLabel: "Participant",
  storedPasskeyCredentials: 2,
  activeRecipientConsents: 1,
};

test("shadow display is disabled by default and in every production environment", () => {
  assert.equal(isMapAbleIdReadOnlyEnabled({}), false);
  assert.equal(isMapAbleIdReadOnlyEnabled({ NODE_ENV: "test", MAPABLE_ID_DASHBOARD_ENABLED: "true" }), true);
  assert.equal(isMapAbleIdReadOnlyEnabled({ NODE_ENV: "production", MAPABLE_ID_DASHBOARD_ENABLED: "true" }), false);
});

test("returns current-account metadata without inferring sign-in or federation", () => {
  const out = buildMapAbleIdReadSnapshot(USER);
  assert.equal(out.mode, "server_verified_read_only");
  assert.equal(out.account.email, USER.email);
  assert.equal(out.passkeys.storedCredentialCount, 2);
  assert.equal(out.sharing.activeRecipientConsentCount, 1);
  assert.equal(out.session.authenticationService, "Existing MapAble NextAuth session");
  assert.equal(out.session.originalSignInMethod, "not_attested");
  assert.equal(out.session.mfaAssurance, "not_attested");
  assert.equal(out.services[1].state, "not_independently_verified");
  assert.equal(out.services.length, 5);
  assert.equal(out.adapters.find((item) => item.id === "nextauth")?.state, "existing_authority");
  assert.equal(out.adapters.find((item) => item.id === "adid_oidc")?.state, "disabled");
  assert.equal(out.adapters.find((item) => item.id === "google_identity_mfa")?.state, "disabled");
  assert.equal(out.adapters.find((item) => item.id === "webauthn_yubikey")?.state, "existing_flow_separate");
  assert.equal(out.sharing.delegateAuthority, "not_determined");
});

test("zero is a valid credential or consent count, not a claim of no recovery", () => {
  const out = buildMapAbleIdReadSnapshot({
    ...USER, storedPasskeyCredentials: 0, activeRecipientConsents: 0,
  });
  assert.equal(out.passkeys.storedCredentialCount, 0);
  assert.equal(out.recovery.configuredMethod, "not_attested");
  assert.equal(out.session.mfaAssurance, "not_attested");
});

test("never serializes secrets or personal identifiers that do not belong in a summary", () => {
  const input = {
    ...USER,
    id: "private-user-id",
    passwordHash: "private-password-hash",
    ndisParticipantNumberEnc: "private-health-info",
    sessionToken: "private-session-token",
    accessToken: "private-token",
  };
  const json = JSON.stringify(buildMapAbleIdReadSnapshot(input));
  for (const secret of [
    "private-user-id", "private-password-hash", "private-health-info",
    "private-session-token", "private-token",
  ]) {
    assert.ok(!json.includes(secret), "Unexpected data in read model");
  }
});

test("invalid empty, overlong and non-finite input fails closed", () => {
  assert.throws(
    () => buildMapAbleIdReadSnapshot({ ...USER, displayName: "" }),
    /INVALID_DISPLAY_NAME/,
  );
  assert.throws(
    () => buildMapAbleIdReadSnapshot({ ...USER, email: " " }),
    /INVALID_EMAIL/,
  );
  assert.throws(
    () => buildMapAbleIdReadSnapshot({ ...USER, storedPasskeyCredentials: -1 }),
    /INVALID_PASSKEY_COUNT/,
  );
  assert.throws(
    () => buildMapAbleIdReadSnapshot({ ...USER, activeRecipientConsents: Number.NaN }),
    /INVALID_CONSENT_COUNT/,
  );
});


test("legacy flag cannot enable MapAbleID and production stays blocked", () => {
  assert.equal(isMapAbleIdReadOnlyEnabled({ NODE_ENV: "test", MAPABLEID_READ_ONLY_ENABLED: "true" }), false);
  assert.equal(isMapAbleIdReadOnlyEnabled({ NODE_ENV: "production", MAPABLE_ID_DASHBOARD_ENABLED: "true" }), false);
});
