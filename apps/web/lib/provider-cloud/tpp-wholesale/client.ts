/**
 * TPP Wholesale's current REST/JSON API (not the legacy auth.pl gateway).
 * This module contains real server-to-server HTTPS calls for authentication and
 * domain availability only. It cannot register, renew, transfer or modify DNS.
 *
 * Source: https://www.tppwholesale.com.au/api/
 */
export const TPP_WHOLESALE_ORIGIN = "https://api.tppwholesale.com.au" as const;

export type TppAvailability = {
  source: "tpp_wholesale";
  domain: string;
  available: boolean;
  premium: boolean;
  prices: Array<{ years: number; price: number }>;
  checkedAt: string;
  currency: "unconfirmed";
  orderStatus: "not_requested";
};

type Transport = typeof fetch;

type ClientOptions = {
  apiKey: string;
  secretKey: string;
  transport?: Transport;
  now?: () => number;
  timeoutMs?: number;
};

export type TppErrorCode =
  | "INVALID_DOMAIN"
  | "TPP_CONFIGURATION_MISSING"
  | "TPP_AUTH_FAILED"
  | "TPP_UPSTREAM_FAILED"
  | "TPP_INVALID_RESPONSE";

export class TppWholesaleError extends Error {
  readonly code: TppErrorCode;
  constructor(code: TppErrorCode) {
    super(code);
    this.name = "TppWholesaleError";
    this.code = code;
  }
}

const RESERVED_SUFFIXES = [
  "test", "invalid", "example", "localhost", "local", "internal",
  "onion", "arpa",
];
const RESERVED_EXAMPLES = ["example.com", "example.net", "example.org"];

/** Validate before any HTTP request; never build arbitrary user-selected URLs. */
export function normaliseTppDomain(value: unknown): string {
  if (typeof value !== "string" || value.length > 253) {
    throw new TppWholesaleError("INVALID_DOMAIN");
  }
  const domain = value.trim().toLowerCase().replace(/\.$/, "");
  if (!domain || domain.length > 253 || !/^[a-z0-9.-]+$/.test(domain)) {
    throw new TppWholesaleError("INVALID_DOMAIN");
  }
  const labels = domain.split(".");
  if (
    labels.length < 2 ||
    labels.some((label) =>
      label.length < 1 || label.length > 63 ||
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    ) ||
    !/^[a-z]{2,63}$/.test(labels[labels.length - 1])
  ) {
    throw new TppWholesaleError("INVALID_DOMAIN");
  }
  if (
    RESERVED_SUFFIXES.includes(labels[labels.length - 1]) ||
    RESERVED_EXAMPLES.some((reserved) => domain === reserved || domain.endsWith("." + reserved))
  ) {
    throw new TppWholesaleError("INVALID_DOMAIN");
  }
  return domain;
}

function parseToken(payload: string): string {
  let token = payload.trim();
  if (token.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(token);
      token = typeof parsed === "string" ? parsed : "";
    } catch {
      token = "";
    }
  }
  // JWT is delivered as plain text, never return its contents to the caller.
  if (token.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    throw new TppWholesaleError("TPP_INVALID_RESPONSE");
  }
  return token;
}

function parseAvailability(raw: unknown, requestedDomain: string, now: number): TppAvailability {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new TppWholesaleError("TPP_INVALID_RESPONSE");
  }
  const body = raw as Record<string, unknown>;
  if (
    body.domain !== requestedDomain ||
    typeof body.available !== "boolean" ||
    (body.premium !== undefined && typeof body.premium !== "boolean") ||
    (body.prices !== undefined && !Array.isArray(body.prices))
  ) {
    throw new TppWholesaleError("TPP_INVALID_RESPONSE");
  }
  const rawPrices = Array.isArray(body.prices) ? body.prices : [];
  if (rawPrices.length > 25) throw new TppWholesaleError("TPP_INVALID_RESPONSE");
  const prices = rawPrices.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new TppWholesaleError("TPP_INVALID_RESPONSE");
    }
    const price = item as Record<string, unknown>;
    if (
      typeof price.years !== "number" || !Number.isInteger(price.years) ||
      price.years < 1 || price.years > 100 ||
      typeof price.price !== "number" || !Number.isFinite(price.price) || price.price < 0
    ) {
      throw new TppWholesaleError("TPP_INVALID_RESPONSE");
    }
    return { years: price.years, price: price.price };
  });
  return {
    source: "tpp_wholesale",
    domain: requestedDomain,
    available: body.available,
    premium: body.premium === true,
    prices,
    checkedAt: new Date(now).toISOString(),
    currency: "unconfirmed",
    orderStatus: "not_requested",
  };
}

/** Real read-only TPP adapter; a transport argument supports deterministic tests. */
export class TppWholesaleClient {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly transport: Transport;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private cachedToken: { token: string; expiresAt: number } | null = null;
  private authenticating: Promise<string> | null = null;

  constructor(options: ClientOptions) {
    if (!options.apiKey || !options.secretKey) {
      throw new TppWholesaleError("TPP_CONFIGURATION_MISSING");
    }
    this.apiKey = options.apiKey;
    this.secretKey = options.secretKey;
    this.transport = options.transport ?? fetch;
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? 8000;
  }

  private async authenticate(): Promise<string> {
    let response: Response;
    try {
      response = await this.transport(TPP_WHOLESALE_ORIGIN + "/jwt/auth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/plain" },
        body: JSON.stringify({ apiKey: this.apiKey, secretKey: this.secretKey }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new TppWholesaleError("TPP_AUTH_FAILED");
    }
    if (!response.ok) throw new TppWholesaleError("TPP_AUTH_FAILED");
    let token: string;
    try {
      token = parseToken(await response.text());
    } catch {
      throw new TppWholesaleError("TPP_AUTH_FAILED");
    }
    // TPP tokens last one hour and are bound to originating IP; renew early.
    this.cachedToken = { token, expiresAt: this.now() + 50 * 60_000 };
    return token;
  }

  private async getToken(force = false): Promise<string> {
    if (!force && this.cachedToken && this.cachedToken.expiresAt > this.now()) {
      return this.cachedToken.token;
    }
    if (!this.authenticating) {
      this.authenticating = this.authenticate().finally(() => { this.authenticating = null; });
    }
    return this.authenticating;
  }

  /** Read-only operation documented at GET /domains/{domain}/check-availability. */
  async checkAvailability(input: unknown): Promise<TppAvailability> {
    const domain = normaliseTppDomain(input);
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.getToken(attempt === 1);
      let response: Response;
      try {
        response = await this.transport(
          TPP_WHOLESALE_ORIGIN + "/domains/" + encodeURIComponent(domain) + "/check-availability",
          {
            method: "GET",
            headers: { Authorization: "Bearer " + token, Accept: "application/json" },
            cache: "no-store",
            redirect: "error",
            signal: AbortSignal.timeout(this.timeoutMs),
          },
        );
      } catch {
        throw new TppWholesaleError("TPP_UPSTREAM_FAILED");
      }
      if (response.status === 401 && attempt === 0) {
        this.cachedToken = null;
        continue; // Re-auth once, but never retry transactions or unknown outcomes.
      }
      if (!response.ok) throw new TppWholesaleError("TPP_UPSTREAM_FAILED");
      let parsed: unknown;
      try {
        const raw = await response.text();
        if (raw.length > 64_000) throw new Error("oversize");
        parsed = JSON.parse(raw) as unknown;
      } catch {
        throw new TppWholesaleError("TPP_INVALID_RESPONSE");
      }
      return parseAvailability(parsed, domain, this.now());
    }
    throw new TppWholesaleError("TPP_AUTH_FAILED");
  }
}

/** Never construct this client in a browser or expose credentials in API JSON. */
export function createTppWholesaleClient(
  env: Record<string, string | undefined> = process.env,
  transport?: Transport,
): TppWholesaleClient {
  return new TppWholesaleClient({
    apiKey: env.TPP_WHOLESALE_API_KEY ?? "",
    secretKey: env.TPP_WHOLESALE_SECRET_KEY ?? "",
    transport,
  });
}
