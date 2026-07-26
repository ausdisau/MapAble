import {
  isNdiaProviderLiveSubmitAllowed,
  ndiaProviderClaimingConfig,
} from "@/lib/ndis/provider-claiming/config";
import type { NdiaProviderClaimPayload } from "@/lib/ndis/provider-claiming/types";

export type NdiaSubmitResult = {
  mode: "mock" | "http";
  externalClaimId: string;
  externalStatus: string;
  response?: unknown;
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function fetchAccessToken(): Promise<string> {
  if (!ndiaProviderClaimingConfig.tokenUrl) {
    throw new Error("NDIA_PROVIDER_TOKEN_URL not configured");
  }
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: ndiaProviderClaimingConfig.apiClientId,
    client_secret: ndiaProviderClaimingConfig.apiClientSecret,
  });

  const res = await fetch(ndiaProviderClaimingConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`NDIA token request failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in?: number;
  };
  cachedToken = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 3600) * 1000 - 60_000,
  };
  return cachedToken.token;
}

/**
 * Submit claim to NDIA partner API. Uses mock adapter until credentials are configured.
 * Replace `submitPath` when NDIA issues your Payments/Claims endpoint path.
 */
export async function submitProviderClaimToNdia(
  payload: NdiaProviderClaimPayload
): Promise<NdiaSubmitResult> {
  if (!isNdiaProviderLiveSubmitAllowed()) {
    const mockId = `ndia_mock_${Date.now()}`;
    return {
      mode: "mock",
      externalClaimId: mockId,
      externalStatus: "submitted_mock",
      response: {
        message:
          "Mock submission — configure NDIA_PROVIDER_API_* and NDIA_REAL_SUBMISSION_ENABLED for live API.",
        payloadSummary: {
          lines: payload.lines.length,
          totalCents: payload.totals.totalCents,
          registration: payload.provider.ndisRegistrationNumber,
        },
      },
    };
  }

  const token = await fetchAccessToken();
  const submitPath =
    process.env.NDIA_PROVIDER_CLAIM_SUBMIT_PATH ?? "/v1/provider/claims";
  const url = `${ndiaProviderClaimingConfig.apiBaseUrl.replace(/\/$/, "")}${submitPath}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `NDIA claim submit failed: ${res.status} ${typeof json === "object" ? JSON.stringify(json) : text}`
    );
  }

  const record = json as { claimId?: string; id?: string; status?: string };
  return {
    mode: "http",
    externalClaimId: record.claimId ?? record.id ?? `ndia_${Date.now()}`,
    externalStatus: record.status ?? "submitted",
    response: json,
  };
}
