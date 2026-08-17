import { createHash } from "node:crypto";

import type { Prisma } from "@prisma/client";

import { regGroupIndicesToCategories } from "@/app/provider-finder/regGroupOptions";
import {
  parseAddressFromNdisRecord,
  parseHeadOfficeLocation,
} from "@/lib/ingestion/ndis-location-parse";
import { NDIS_LIST_PROVIDERS_URL } from "@/lib/ndis/list-providers-source";
import { prisma } from "@/lib/prisma";

export const DEFAULT_NDIS_PROVIDER_SOURCE_URL = NDIS_LIST_PROVIDERS_URL;

const FETCH_HEADERS = {
  "User-Agent": "MapAble/1.0 (NDIS provider directory ingest)",
  Accept: "application/json, text/plain, */*",
  Referer:
    "https://www.ndis.gov.au/participants/working-providers/finding-providers/provider-finder",
};

export type NormalisedNdisProvider = {
  sourceId: string;
  providerName: string;
  legalName: string | null;
  abn: string | null;
  registrationNumber: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  services: string[];
  registrationGroups: string[];
  raw: Record<string, unknown>;
  rawHash: string;
};

export type NdisIngestionResult = {
  ok: boolean;
  dryRun: boolean;
  /** Normalised rows written or previewed. */
  providerCount: number;
  /** Records extracted from payload before normalisation. */
  rawRecordCount?: number;
  runId?: string;
  sourceUrl: string;
  sourceHash: string;
  durationMs: number;
  sample?: NormalisedNdisProvider;
  rawFieldKeys?: string[];
  error?: string;
};

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/** Locate provider array from unknown NDIS export shapes. */
export function extractProviderRecords(payload: unknown): {
  records: Record<string, unknown>[];
  sourceDate?: string;
} {
  if (Array.isArray(payload)) {
    return { records: payload as Record<string, unknown>[] };
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return {
        records: obj.data as Record<string, unknown>[],
        sourceDate: typeof obj.date === "string" ? obj.date : undefined,
      };
    }
    if (Array.isArray(obj.providers)) {
      return {
        records: obj.providers as Record<string, unknown>[],
        sourceDate: typeof obj.date === "string" ? obj.date : undefined,
      };
    }
    if (Array.isArray(obj.results)) {
      return { records: obj.results as Record<string, unknown>[] };
    }
  }
  throw new Error(
    "Could not locate provider array in payload (expected data[], providers[], or top-level array).",
  );
}

function pickString(
  raw: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return null;
}

function pickNumber(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number.parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

function pickStringArray(
  raw: Record<string, unknown>,
  keys: string[],
): string[] {
  for (const key of keys) {
    const v = raw[key];
    if (Array.isArray(v)) {
      return v
        .map((item) => {
          if (typeof item === "string") return item.trim();
          if (typeof item === "number") return String(item);
          return "";
        })
        .filter(Boolean);
    }
    if (typeof v === "string" && v.trim()) {
      return v
        .split(/[|,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function pickRegistrationGroups(raw: Record<string, unknown>): string[] {
  const explicit = pickStringArray(raw, [
    "registration_groups",
    "registrationGroups",
    "RegGroups",
  ]);
  if (explicit.length > 0) return explicit;

  const regGroup = raw.RegGroup ?? raw.regGroup;
  if (Array.isArray(regGroup) && regGroup.every((x) => typeof x === "number")) {
    return regGroupIndicesToCategories(regGroup as number[]);
  }
  return [];
}

function pickServices(raw: Record<string, unknown>): string[] {
  const fromFields = pickStringArray(raw, [
    "services",
    "serviceTypes",
    "service_types",
    "Supports",
  ]);
  if (fromFields.length > 0) return fromFields;

  const prfsn = pickString(raw, ["prfsn", "professions", "Professions"]);
  if (prfsn) {
    return prfsn
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 80);
}

export function buildStableSourceId(
  raw: Record<string, unknown>,
  index: number,
  normalised: Pick<
    NormalisedNdisProvider,
    "providerName" | "abn" | "registrationNumber"
  >,
): string {
  const explicit = pickString(raw, [
    "source_id",
    "sourceId",
    "id",
    "providerId",
    "provider_id",
    "organisationId",
    "organisation_id",
    "outletId",
    "outlet_id",
  ]);
  if (explicit) return explicit.slice(0, 512);

  if (normalised.registrationNumber) {
    const outlet = pickString(raw, ["Outletname", "outletName", "outlet_name"]);
    const suffix = outlet ? `:${slugify(outlet)}` : `:${index}`;
    return `reg:${normalised.registrationNumber}${suffix}`.slice(0, 512);
  }

  if (normalised.abn) {
    const outlet = pickString(raw, ["Outletname", "outletName", "outlet_name"]);
    const addr = pickString(raw, ["Address", "address"]) ?? "";
    const key = `${normalised.abn}:${slugify(outlet ?? "")}:${slugify(addr)}:${index}`;
    return `abn:${key}`.slice(0, 512);
  }

  return `idx:${sha256Hex(`${normalised.providerName}:${index}`)}`.slice(0, 512);
}

export function normaliseNdisProviderRecord(
  raw: Record<string, unknown>,
  index: number,
): NormalisedNdisProvider {
  const providerName =
    pickString(raw, [
      "provider_name",
      "providerName",
      "Prov_N",
      "name",
      "organisationName",
      "Outletname",
      "outletName",
    ]) ?? "Unknown provider";

  const legalName =
    pickString(raw, [
      "legal_name",
      "legalName",
      "legal_entity_name",
      "registeredName",
    ]) ??
    pickString(raw, ["Outletname", "outletName"]) ??
    null;

  const abn = pickString(raw, ["abn", "ABN", "Abn"]);
  const registrationNumber = pickString(raw, [
    "registration_number",
    "registrationNumber",
    "ndis_registration_number",
    "NDISNumber",
    "ndisNumber",
  ]);

  const address =
    pickString(raw, ["address", "Address", "streetAddress", "street_address"]) ??
    null;
  const headOffice = pickString(raw, ["Head_Office", "head_office", "headOffice"]);
  const parsed =
    (address ? parseAddressFromNdisRecord(address) : null) ??
    (headOffice ? parseHeadOfficeLocation(headOffice) : null);

  const state =
    pickString(raw, ["state", "State", "State_cd", "stateCode"]) ??
    parsed?.state ??
    null;
  const suburb = pickString(raw, ["suburb", "Suburb", "city"]) ?? parsed?.suburb ?? null;
  const postcode =
    pickString(raw, ["postcode", "Postcode", "Post_cd", "postCode"]) ??
    parsed?.postcode ??
    null;

  let latitude = pickNumber(raw, ["latitude", "Latitude", "lat"]);
  let longitude = pickNumber(raw, ["longitude", "Longitude", "lng", "lon"]);
  if (latitude === 0) latitude = null;
  if (longitude === 0) longitude = null;

  const base = {
    providerName,
    legalName,
    abn,
    registrationNumber,
  };
  const sourceId = buildStableSourceId(raw, index, base);
  const rawHash = sha256Hex(JSON.stringify(raw));

  return {
    sourceId,
    providerName,
    legalName,
    abn,
    registrationNumber,
    phone: pickString(raw, ["phone", "Phone", "phoneNumber", "telephone"]),
    email: pickString(raw, ["email", "Email", "emailAddress"]),
    website: pickString(raw, ["website", "Website", "web", "url"]),
    address,
    suburb,
    state,
    postcode,
    latitude,
    longitude,
    services: pickServices(raw),
    registrationGroups: pickRegistrationGroups(raw),
    raw,
    rawHash,
  };
}

export async function fetchNdisProviderPayload(
  sourceUrl: string,
): Promise<{ body: string; sourceUrl: string }> {
  const urls = [
    sourceUrl,
    sourceUrl.replace("://ndis.gov.au", "://www.ndis.gov.au"),
    sourceUrl.replace("://www.ndis.gov.au", "://ndis.gov.au"),
  ];
  const tried = new Set<string>();

  for (const url of urls) {
    if (tried.has(url)) continue;
    tried.add(url);
    const res = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
    if (res.ok) {
      return { body: await res.text(), sourceUrl: url };
    }
  }

  const { resolveNdisListProvidersPath } = await import(
    "@/lib/ndis/list-providers-source"
  );
  const { readFile } = await import("node:fs/promises");
  const path = resolveNdisListProvidersPath();
  const body = await readFile(path, "utf8");
  return { body, sourceUrl: `file://${path}` };
}

function parseSourceUpdatedAt(sourceDate?: string): Date | null {
  if (!sourceDate?.trim()) return null;
  const parsed = Date.parse(sourceDate);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
}

/** Keep batches small — large interactive transactions drop Neon/pooler connections. */
export const NDIS_PROVIDER_UPSERT_BATCH_SIZE = 25;

function resolveIngestBatchSize(): number {
  const fromEnv = Number(process.env.NDIS_INGEST_BATCH_SIZE);
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.min(Math.floor(fromEnv), 100);
  }
  return NDIS_PROVIDER_UPSERT_BATCH_SIZE;
}

export function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  const code =
    "code" in error && typeof error.code === "string" ? error.code : "";
  return (
    code === "P1001" ||
    code === "P1017" ||
    code === "P2024" ||
    message.includes("server has closed the connection") ||
    message.includes("connection terminated") ||
    message.includes("timeout")
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTransientDbRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 4,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === maxAttempts) {
        throw error;
      }
      await sleep(500 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

function ndisProviderUpsertArgs(
  row: NormalisedNdisProvider,
  resolvedUrl: string,
  sourceUpdatedAt: Date | null,
): {
  where: { sourceId: string };
  create: Prisma.NdisProviderCreateInput;
  update: Prisma.NdisProviderUpdateInput;
} {
  const data = {
    providerName: row.providerName,
    legalName: row.legalName,
    abn: row.abn,
    registrationNumber: row.registrationNumber,
    phone: row.phone,
    email: row.email,
    website: row.website,
    address: row.address,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    latitude: row.latitude,
    longitude: row.longitude,
    services: row.services,
    registrationGroups: row.registrationGroups,
    raw: row.raw as Prisma.InputJsonValue,
    rawHash: row.rawHash,
    sourceUrl: resolvedUrl,
    sourceUpdatedAt,
  };

  return {
    where: { sourceId: row.sourceId },
    create: { sourceId: row.sourceId, ...data },
    update: data,
  };
}

async function persistNdisProviders(
  rows: NormalisedNdisProvider[],
  resolvedUrl: string,
  sourceUpdatedAt: Date | null,
): Promise<void> {
  const batchSize = resolveIngestBatchSize();

  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const chunk = rows.slice(offset, offset + batchSize);
    await withTransientDbRetry(() =>
      prisma.$transaction(
        async (tx) => {
          for (const row of chunk) {
            await tx.ndisProvider.upsert(
              ndisProviderUpsertArgs(row, resolvedUrl, sourceUpdatedAt),
            );
          }
        },
        { maxWait: 10_000, timeout: 120_000 },
      ),
    );
  }
}

export async function runNdisProviderIngestion(options?: {
  dryRun?: boolean;
  sourceUrl?: string;
}): Promise<NdisIngestionResult> {
  const started = Date.now();
  const dryRun = options?.dryRun ?? process.env.DRY_RUN === "true";
  const sourceUrl =
    options?.sourceUrl?.trim() ||
    process.env.NDIS_PROVIDER_SOURCE_URL?.trim() ||
    DEFAULT_NDIS_PROVIDER_SOURCE_URL;

  try {
    const { body, sourceUrl: resolvedUrl } = await fetchNdisProviderPayload(
      sourceUrl,
    );
    const sourceHash = sha256Hex(body);
    const payload = JSON.parse(body) as unknown;
    const { records, sourceDate } = extractProviderRecords(payload);
    const normalised = records.map((r, i) =>
      normaliseNdisProviderRecord(r, i),
    );
    const sourceUpdatedAt = parseSourceUpdatedAt(sourceDate);

    const rawFieldKeys = records[0]
      ? Object.keys(records[0]).sort()
      : [];

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        rawRecordCount: records.length,
        providerCount: normalised.length,
        sourceUrl: resolvedUrl,
        sourceHash,
        durationMs: Date.now() - started,
        sample: normalised[0],
        rawFieldKeys,
      };
    }

    const run = await prisma.ndisProviderIngestionRun.create({
      data: {
        sourceUrl: resolvedUrl,
        sourceHash,
        providerCount: 0,
        status: "running",
      },
    });

    try {
      await persistNdisProviders(normalised, resolvedUrl, sourceUpdatedAt);

      // TODO: mark providers missing from this source_hash as stale after verification workflow exists.

      await prisma.ndisProviderIngestionRun.update({
        where: { id: run.id },
        data: {
          status: "success",
          providerCount: normalised.length,
          finishedAt: new Date(),
        },
      });

      return {
        ok: true,
        dryRun: false,
        providerCount: normalised.length,
        runId: run.id,
        sourceUrl: resolvedUrl,
        sourceHash,
        durationMs: Date.now() - started,
      };
    } catch (inner) {
      const message =
        inner instanceof Error ? inner.message : "Ingestion failed";
      await prisma.ndisProviderIngestionRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
      throw inner;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return {
      ok: false,
      dryRun,
      providerCount: 0,
      sourceUrl,
      sourceHash: "",
      durationMs: Date.now() - started,
      error: message,
    };
  }
}
