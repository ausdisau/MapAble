import type { User } from "@prisma/client";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from "@simplewebauthn/server";

import {
  createTwoFactorToken,
  verifyTwoFactorToken,
} from "@/lib/auth/two-factor-token";
import { prisma } from "@/lib/prisma";

const PASSKEY_CHALLENGE_TTL_SECONDS = 10 * 60;

function appOrigin(): string {
  const origin =
    process.env.PASSKEY_ORIGIN?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (origin) return origin.replace(/\/$/, "");

  const vercelUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

function rpID(): string {
  return process.env.PASSKEY_RP_ID?.trim() || new URL(appOrigin()).hostname;
}

function userDisplayName(user: Pick<User, "email" | "name">): string {
  return user.name?.trim() || user.email;
}

export async function startPasskeyRegistration(userId: string): Promise<{
  challengeToken: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { passkeyCredentials: true },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const options = await generateRegistrationOptions({
    attestationType: "none",
    excludeCredentials: user.passkeyCredentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports as AuthenticatorTransportFuture[],
    })),
    rpID: rpID(),
    rpName: "MapAble",
    userID: Buffer.from(user.id, "utf8"),
    userName: user.email,
    userDisplayName: userDisplayName(user),
  });

  return {
    challengeToken: createTwoFactorToken({
      challenge: options.challenge,
      purpose: "passkey-registration",
      ttlSeconds: PASSKEY_CHALLENGE_TTL_SECONDS,
      userId: user.id,
    }),
    options,
  };
}

export async function finishPasskeyRegistration({
  challengeToken,
  credential,
}: {
  challengeToken: string;
  credential: RegistrationResponseJSON;
}): Promise<void> {
  const challenge = verifyTwoFactorToken(
    challengeToken,
    "passkey-registration",
  );
  if (!challenge?.challenge) {
    throw new Error("Passkey registration challenge expired");
  }

  const verification = await verifyRegistrationResponse({
    expectedChallenge: challenge.challenge,
    expectedOrigin: appOrigin(),
    expectedRPID: rpID(),
    response: credential,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Passkey registration failed");
  }

  const { credential: registeredCredential } = verification.registrationInfo;

  await prisma.passkeyCredential.create({
    data: {
      backedUp: verification.registrationInfo.credentialBackedUp,
      counter: registeredCredential.counter,
      credentialId: registeredCredential.id,
      deviceType: verification.registrationInfo.credentialDeviceType,
      publicKey: Buffer.from(registeredCredential.publicKey),
      transports: registeredCredential.transports ?? [],
      userId: challenge.userId,
    },
  });
}

export async function startPasskeyAuthentication(email: string): Promise<{
  challengeToken: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { passkeyCredentials: true },
  });
  if (!user || user.passkeyCredentials.length === 0) {
    throw new Error("No passkey is registered for this account");
  }

  const options = await generateAuthenticationOptions({
    allowCredentials: user.passkeyCredentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports as AuthenticatorTransportFuture[],
    })),
    rpID: rpID(),
    userVerification: "preferred",
  });

  return {
    challengeToken: createTwoFactorToken({
      challenge: options.challenge,
      purpose: "passkey-authentication",
      ttlSeconds: PASSKEY_CHALLENGE_TTL_SECONDS,
      userId: user.id,
    }),
    options,
  };
}

export async function finishPasskeyAuthentication({
  challengeToken,
  credential,
}: {
  challengeToken: string;
  credential: AuthenticationResponseJSON;
}): Promise<{ signInToken: string }> {
  const challenge = verifyTwoFactorToken(
    challengeToken,
    "passkey-authentication",
  );
  if (!challenge?.challenge) {
    throw new Error("Passkey sign-in challenge expired");
  }

  const storedCredential = await prisma.passkeyCredential.findUnique({
    where: { credentialId: credential.id },
  });
  if (!storedCredential || storedCredential.userId !== challenge.userId) {
    throw new Error("Passkey credential is not registered");
  }

  const verification = await verifyAuthenticationResponse({
    credential: {
      counter: Number(storedCredential.counter),
      id: storedCredential.credentialId,
      publicKey: storedCredential.publicKey,
      transports: storedCredential.transports as AuthenticatorTransportFuture[],
    } satisfies WebAuthnCredential,
    expectedChallenge: challenge.challenge,
    expectedOrigin: appOrigin(),
    expectedRPID: rpID(),
    response: credential,
  });

  if (!verification.verified) {
    throw new Error("Passkey sign-in failed");
  }

  await prisma.passkeyCredential.update({
    where: { id: storedCredential.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  });

  return {
    signInToken: createTwoFactorToken({
      purpose: "credentials-passkey",
      ttlSeconds: 2 * 60,
      userId: challenge.userId,
    }),
  };
}
