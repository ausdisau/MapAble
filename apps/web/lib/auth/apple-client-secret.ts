import { createPrivateKey, sign } from "node:crypto";

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

/** Apple Sign in with Apple client secret (JWT). Uses APPLE_SECRET or generates from key. */
export function getAppleClientSecret(clientId: string): string | undefined {
  const prebuilt = process.env.APPLE_SECRET?.trim();
  if (prebuilt) return prebuilt;

  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKeyPem = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!teamId || !keyId || !privateKeyPem) return undefined;

  const header = { alg: "ES256", kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 60 * 60 * 24 * 180,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const key = createPrivateKey(privateKeyPem);
  const signature = sign("sha256", Buffer.from(signingInput), {
    key,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64Url(signature)}`;
}
