import * as Crypto from 'expo-crypto';

const MOBILE_REDIRECT_URI = 'mapable://auth/callback';

export type MobileIdentity = {
  id: string;
  email: string;
  name: string;
  primaryRole: string;
};

export type MobileSession = {
  accessToken: string;
  expiresAt: number;
  user: MobileIdentity;
};

export type MobileAuthRequest = {
  authorizeUrl: string;
  codeVerifier: string;
  redirectUri: string;
  state: string;
};

export class MobileAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MobileAuthError';
  }
}

function getBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_MAPABLE_API_URL ?? '').trim().replace(/\/+$/, '');
}

export function isMobileAuthConfigured(): boolean {
  return getBaseUrl().length > 0;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toBase64Url(value: string): string {
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function createMobileAuthRequest(): Promise<MobileAuthRequest> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new MobileAuthError('MapAble platform connection is not configured.');
  }

  // 32 cryptographically random bytes represented as 64 unreserved hex
  // characters satisfy the RFC 7636 verifier length requirements.
  const verifierBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = bytesToHex(verifierBytes);
  const challengeBase64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  const codeChallenge = toBase64Url(challengeBase64);
  const state = Crypto.randomUUID();

  const params = new URLSearchParams({
    redirect_uri: MOBILE_REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  return {
    authorizeUrl: `${baseUrl}/api/mobile/auth/authorize?${params.toString()}`,
    codeVerifier,
    redirectUri: MOBILE_REDIRECT_URI,
    state,
  };
}

export function readMobileAuthCallback(
  callbackUrl: string,
  expectedState: string,
): { code: string } {
  let parsed: URL;
  try {
    parsed = new URL(callbackUrl);
  } catch {
    throw new MobileAuthError('MapAble returned an invalid sign-in callback.');
  }

  if (`${parsed.protocol}//${parsed.host}${parsed.pathname}` !== MOBILE_REDIRECT_URI) {
    throw new MobileAuthError('MapAble returned an unexpected sign-in callback.');
  }

  const state = parsed.searchParams.get('state');
  const code = parsed.searchParams.get('code');
  const error = parsed.searchParams.get('error');

  if (error) throw new MobileAuthError(error);
  if (!state || state !== expectedState) {
    throw new MobileAuthError('Sign-in state did not match. Start sign-in again.');
  }
  if (!code) throw new MobileAuthError('MapAble did not return an authorization code.');

  return { code };
}

function isIdentity(value: unknown): value is MobileIdentity {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.name === 'string' &&
    typeof user.primaryRole === 'string'
  );
}

export async function exchangeMobileAuthCode(
  request: MobileAuthRequest,
  code: string,
): Promise<MobileSession> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new MobileAuthError('MapAble platform connection is not configured.');
  }

  const response = await fetch(`${baseUrl}/api/mobile/auth/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      codeVerifier: request.codeVerifier,
      redirectUri: request.redirectUri,
    }),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new MobileAuthError('MapAble returned an unreadable sign-in response.');
  }

  if (!response.ok) {
    const error =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'MapAble sign-in could not be completed.';
    throw new MobileAuthError(error);
  }

  if (!payload || typeof payload !== 'object') {
    throw new MobileAuthError('MapAble returned an unexpected sign-in response.');
  }

  const tokenResponse = payload as Record<string, unknown>;
  if (
    typeof tokenResponse.accessToken !== 'string' ||
    typeof tokenResponse.expiresIn !== 'number' ||
    !Number.isFinite(tokenResponse.expiresIn) ||
    !isIdentity(tokenResponse.user)
  ) {
    throw new MobileAuthError('MapAble returned an unexpected sign-in response.');
  }

  return {
    accessToken: tokenResponse.accessToken,
    expiresAt: Date.now() + tokenResponse.expiresIn * 1000,
    user: tokenResponse.user,
  };
}
