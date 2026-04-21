import { db } from "./db";
import { ndisPlanCache, ndisClaims, type NdisClaim } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

interface ProdaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface NdisClaimSubmission {
  participantId: string;
  /** Internal MapAble user id of the provider (worker.userId), used for filtering and reporting. */
  providerId: string;
  /** External NDIS provider identifier sent in the request payload (PROV-* string). */
  ndisProviderRef: string;
  invoiceId?: string;
  serviceSessionId?: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  serviceDate: string;
  claimReference: string;
}

interface NdisClaimResponse {
  claimId: string;
  status: "submitted" | "accepted" | "rejected";
  message: string;
  submittedAt: string;
  rejectionReason?: string;
}

interface NdisPlanGoal {
  id: string;
  name: string;
  category: string;
  budget: number;
}

interface NdisPlanData {
  planId: string;
  participantName: string;
  startDate: string;
  endDate: string;
  managementType: string;
  goals: NdisPlanGoal[];
  budgetCategories: {
    category: string;
    allocated: number;
    used: number;
  }[];
}

interface NdisPriceGuideItem {
  itemCode: string;
  itemName: string;
  registrationGroup: string;
  supportCategory: string;
  unit: string;
  nationalPrice: number;
  remotePrice: number;
  veryRemotePrice: number;
}

export class ProdaNotConfiguredError extends Error {
  status = 503;
  code = "PRODA_NOT_CONFIGURED";
  missingEnvVars: string[];
  constructor(missing: string[]) {
    super("NDIS PRODA not configured");
    this.missingEnvVars = missing;
  }
}

export class ProdaApiError extends Error {
  status: number;
  upstreamStatus?: number;
  body?: string;
  constructor(message: string, status = 502, upstreamStatus?: number, body?: string) {
    super(message);
    this.status = status;
    this.upstreamStatus = upstreamStatus;
    this.body = body;
  }
}

const REQUIRED_ENV = [
  "NDIS_PRODA_CLIENT_ID",
  "NDIS_PRODA_CLIENT_SECRET",
  "NDIS_PRODA_DEVICE_NAME",
  "NDIS_PRODA_ORG_ID",
] as const;

function ndisApiBaseUrl(): string {
  return process.env.NDIS_PRODA_BASE_URL || process.env.NDIS_API_BASE_URL || "https://api.ndis.gov.au";
}

export function prodaConfigured(): boolean {
  return REQUIRED_ENV.every((k) => !!process.env[k]);
}

export function missingProdaEnv(): string[] {
  return REQUIRED_ENV.filter((k) => !process.env[k]);
}

function ensureConfigured() {
  if (!prodaConfigured()) {
    throw new ProdaNotConfiguredError(missingProdaEnv());
  }
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let lastSyncedAt: Date | null = null;

export function getProdaIntegrationStatus() {
  return {
    configured: prodaConfigured(),
    missingEnvVars: missingProdaEnv(),
    requiredEnvVars: [...REQUIRED_ENV],
    optionalEnvVars: ["NDIS_API_BASE_URL", "NDIS_PRODA_TOKEN_URL"],
    apiBaseUrl: ndisApiBaseUrl(),
    tokenUrl: process.env.NDIS_PRODA_TOKEN_URL || "https://proda.humanservices.gov.au/piaweb/api/oauth/token",
    tokenCached: !!cachedToken && cachedToken.expiresAt > Date.now(),
    tokenExpiresAt: cachedToken ? new Date(cachedToken.expiresAt).toISOString() : null,
    lastPriceGuideSyncAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
  };
}

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error contacting PRODA");
}

export async function getProdaToken(): Promise<string> {
  ensureConfigured();
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  const tokenUrl = process.env.NDIS_PRODA_TOKEN_URL || "https://proda.humanservices.gov.au/piaweb/api/oauth/token";
  const res = await fetchWithRetry(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.NDIS_PRODA_CLIENT_ID!,
      client_secret: process.env.NDIS_PRODA_CLIENT_SECRET!,
      ...(process.env.NDIS_PRODA_SCOPE ? { scope: process.env.NDIS_PRODA_SCOPE } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProdaApiError(`PRODA auth failed: ${res.status}`, 502, res.status, body);
  }
  const data = (await res.json()) as ProdaTokenResponse;
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

async function ndisGet<T>(path: string): Promise<T> {
  ensureConfigured();
  const token = await getProdaToken();
  const baseUrl = ndisApiBaseUrl();
  const res = await fetchWithRetry(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status === 401) {
    cachedToken = null;
    throw new ProdaApiError("PRODA token rejected", 502, 401);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProdaApiError(`NDIS API error: ${res.status}`, 502, res.status, body);
  }
  return (await res.json()) as T;
}

async function ndisPost<T>(path: string, payload: unknown): Promise<T> {
  ensureConfigured();
  const token = await getProdaToken();
  const baseUrl = ndisApiBaseUrl();
  const res = await fetchWithRetry(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ProdaApiError(`NDIS API error: ${res.status}`, 502, res.status, body);
  }
  return (await res.json()) as T;
}

export async function fetchParticipantPlan(_participantId: string, ndisNumber: string): Promise<NdisPlanData> {
  return ndisGet<NdisPlanData>(`/myplace/v1/participants/${ndisNumber}/plan`);
}

export async function fetchPriceGuide(itemCode?: string): Promise<NdisPriceGuideItem[]> {
  const data = await ndisGet<NdisPriceGuideItem | NdisPriceGuideItem[]>(
    itemCode ? `/priceguide/v1/items/${itemCode}` : `/priceguide/v1/items`
  );
  lastSyncedAt = new Date();
  return Array.isArray(data) ? data : [data];
}

export async function syncParticipantPlan(participantId: string, ndisNumber: string) {
  const planData = await fetchParticipantPlan(participantId, ndisNumber);
  const existing = await db.select().from(ndisPlanCache).where(eq(ndisPlanCache.participantId, participantId));
  if (existing.length > 0) {
    const [updated] = await db
      .update(ndisPlanCache)
      .set({ planData, goals: planData.goals, fetchedAt: new Date() })
      .where(eq(ndisPlanCache.participantId, participantId))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(ndisPlanCache)
    .values({ participantId, planData, goals: planData.goals })
    .returning();
  return created;
}

export async function getCachedPlan(participantId: string) {
  const [plan] = await db.select().from(ndisPlanCache).where(eq(ndisPlanCache.participantId, participantId));
  return plan || null;
}

export function validateRateAgainstPriceGuide(
  itemCode: string,
  chargedRate: number,
  priceGuide: NdisPriceGuideItem[]
): { valid: boolean; maxRate: number; message: string } {
  const item = priceGuide.find((p) => p.itemCode === itemCode);
  if (!item) {
    return { valid: true, maxRate: chargedRate, message: "Item not found in price guide — rate accepted" };
  }
  if (chargedRate > item.nationalPrice) {
    return {
      valid: false,
      maxRate: item.nationalPrice,
      message: `Rate $${chargedRate} exceeds NDIS max $${item.nationalPrice} for ${item.itemName}`,
    };
  }
  return { valid: true, maxRate: item.nationalPrice, message: "Rate within NDIS price guide limits" };
}

export interface NdisParticipantLookup {
  ndisNumber: string;
  fullName: string;
  planStartDate: string;
  planEndDate: string;
  managementType: string;
  status: string;
}

export interface NdisProviderLookup {
  providerNumber: string;
  businessName: string;
  abn: string;
  registrationGroups: string[];
  status: string;
}

export interface NdisWorkerScreeningLookup {
  screeningNumber: string;
  fullName: string;
  clearanceStatus: string;
  expiryDate: string;
  state: string;
}

export async function lookupParticipant(ndisNumber: string): Promise<NdisParticipantLookup> {
  return ndisGet<NdisParticipantLookup>(`/myplace/v1/participants/${ndisNumber}`);
}

export async function lookupProvider(identifier: string): Promise<NdisProviderLookup> {
  return ndisGet<NdisProviderLookup>(`/providers/v1/lookup/${identifier}`);
}

export async function lookupWorkerScreening(screeningNumber: string): Promise<NdisWorkerScreeningLookup> {
  return ndisGet<NdisWorkerScreeningLookup>(`/workers/v1/screening/${screeningNumber}`);
}

export async function submitNdisClaim(claim: NdisClaimSubmission): Promise<NdisClaimResponse & { record: NdisClaim }> {
  const total = claim.quantity * claim.unitPrice;
  const requestPayload = {
    participantId: claim.participantId,
    providerId: claim.ndisProviderRef,
    lineItems: [
      {
        itemCode: claim.itemCode,
        quantity: claim.quantity,
        unitPrice: claim.unitPrice,
        serviceDate: claim.serviceDate,
      },
    ],
    claimReference: claim.claimReference,
  };

  let response: NdisClaimResponse;
  try {
    response = await ndisPost<NdisClaimResponse>(`/providers/claims`, requestPayload);
  } catch (err) {
    if (err instanceof ProdaNotConfiguredError) throw err;
    if (err instanceof ProdaApiError) {
      // Record the failed attempt for audit, then rethrow so the caller surfaces a real error.
      try {
        await db.insert(ndisClaims).values({
          invoiceId: claim.invoiceId,
          serviceSessionId: claim.serviceSessionId,
          participantId: claim.participantId,
          providerId: claim.providerId,
          prodaClaimId: null,
          claimReference: claim.claimReference,
          itemCode: claim.itemCode,
          quantity: claim.quantity.toFixed(2),
          unitPrice: claim.unitPrice.toFixed(2),
          totalAmount: total.toFixed(2),
          serviceDate: claim.serviceDate,
          status: "rejected",
          statusMessage: err.message,
          rejectionReason: err.body || err.message,
          requestPayload,
          responsePayload: { error: err.message, body: err.body, status: err.status },
        });
      } catch (insertErr) {
        console.error("[ndis-claim] failed to record rejected attempt:", insertErr);
      }
      console.warn(
        `[ndis-claim] PRODA error: status=${err.status} ref=${claim.claimReference} ` +
        `participant=${claim.participantId} provider=${claim.providerId}`,
      );
    }
    throw err;
  }

  const status = response.status;
  const rejectionReason = response.rejectionReason ?? null;

  const [record] = await db
    .insert(ndisClaims)
    .values({
      invoiceId: claim.invoiceId,
      serviceSessionId: claim.serviceSessionId,
      participantId: claim.participantId,
      providerId: claim.providerId,
      prodaClaimId: response.claimId,
      claimReference: claim.claimReference,
      itemCode: claim.itemCode,
      quantity: claim.quantity.toFixed(2),
      unitPrice: claim.unitPrice.toFixed(2),
      totalAmount: total.toFixed(2),
      serviceDate: claim.serviceDate,
      status,
      statusMessage: response.message,
      rejectionReason,
      requestPayload,
      responsePayload: response,
    })
    .returning();

  console.log(
    `[ndis-claim] audit: claim=${record.id} proda=${response.claimId} status=${status} ` +
    `invoice=${claim.invoiceId ?? "-"} session=${claim.serviceSessionId ?? "-"} ` +
    `participant=${claim.participantId} provider=${claim.providerId} ref=${claim.claimReference}` +
    (rejectionReason ? ` reason=${rejectionReason}` : ""),
  );

  return { ...response, record };
}

export async function getRecentClaims(limit = 20): Promise<NdisClaim[]> {
  return db.select().from(ndisClaims).orderBy(desc(ndisClaims.submittedAt)).limit(limit);
}
