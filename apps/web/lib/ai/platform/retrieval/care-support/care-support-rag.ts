/**
 * AURA x MAIRA Care Support RAG shadow integration.
 * Strictly read-only, synthetic evidence only, and no model calls or writes.
 * An authenticated server adapter supplies the only access to identity,
 * organisation membership and the existing ConsentRecord source of truth.
 * This module is deliberately independent of the Starting Work hybrid retriever.
 */

export const CARE_RAG_PURPOSE = "care_support_perception_v1" as const;
export const CARE_RAG_SCOPE = "support_profile_read" as const;
export const CARE_RAG_ACTION = "care_support_perception.read" as const;
const REQUIRED_DATA_SCOPES = ["support_needs", "ai_processing"] as const;

export function shouldEnableSyntheticRag(input: {
  nodeEnv: string | undefined;
  featureFlag: string | undefined;
  auraHarnessEnabled: boolean;
}): boolean {
  return input.nodeEnv !== "production" &&
    input.featureFlag === "true" &&
    input.auraHarnessEnabled;
}

export type RagErrorCode =
  | "FEATURE_DISABLED"
  | "NOT_AUTHENTICATED"
  | "ACCESS_DENIED"
  | "CONSENT_REQUIRED"
  | "INVALID_QUERY"
  | "AURA_STOPPED";

export class CareRagAccessError extends Error {
  readonly code: RagErrorCode;
  constructor(code: RagErrorCode) {
    super(code);
    this.code = code;
    this.name = "CareRagAccessError";
  }
}

export interface ServerActor {
  id: string;
}

export interface ExistingConsentView {
  id: string;
  subjectUserId: string;
  grantedToUserId: string | null;
  grantedToOrganisationId: string | null;
  createdById: string;
  scope: string;
  purpose: string;
  status: string;
  sourceAction: string | null;
  dataScope: unknown;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export type EvidenceStatus =
  | "participant_confirmed"
  | "verified_record"
  | "third_party_report"
  | "provider_claim"
  | "synthetic";

export interface CareRagEvidence {
  id: string;
  participantId: string | null;
  tenantId: string | null;
  purpose: string;
  visibility: "participant_private" | "public_provider";
  synthetic: true;
  redactedText: string;
  sourceRef: string;
  sourceVersion: string;
  evidenceStatus: EvidenceStatus;
  expiresAtIso: string | null;
}

export interface CareRagStore {
  /** The backing database adapter must apply participant+tenant+purpose in SQL. */
  loadParticipantEvidence(scope: {
    participantId: string;
    tenantId: string;
    purpose: typeof CARE_RAG_PURPOSE;
  }): Promise<CareRagEvidence[]>;
  /** Only public, synthetic provider source data in this phase. */
  loadPublicProviderEvidence(): Promise<CareRagEvidence[]>;
}

export interface CareRagPorts {
  enabled(): boolean;
  stopped(): boolean;
  authenticatedActor(): Promise<ServerActor | null>;
  organisationMembershipIds(actorId: string): Promise<string[]>;
  /** Return latest record for the exact purpose, regardless of status. */
  latestConsent(input: {
    participantId: string;
    actorId: string;
    purpose: typeof CARE_RAG_PURPOSE;
  }): Promise<ExistingConsentView | null>;
  auditRead(input: {
    actorId: string;
    participantId: string | null;
    tenantId: string | null;
    operation: "participant_rag.search" | "provider_rag.search";
    evidenceCount: number;
  }): Promise<void>;
  now(): Date;
}

export interface RagHit {
  id: string;
  text: string;
  sourceRef: string;
  sourceVersion: string;
  evidenceStatus: EvidenceStatus;
  score: number;
}

export interface RagSearchResult {
  hits: RagHit[];
  filteredBeforeRank: true;
  sourceMode: "synthetic_only";
  modelAuthority: "none";
  unknowns: string[];
}

function fail(code: RagErrorCode): never {
  throw new CareRagAccessError(code);
}

function validateQuery(query: string): string[] {
  if (typeof query !== "string" || !query.trim() || query.length > 240) {
    return fail("INVALID_QUERY");
  }
  const terms = query.toLowerCase().match(/[a-z0-9]+/g)?.filter((term) => term.length > 2) ?? [];
  if (terms.length === 0) return fail("INVALID_QUERY");
  return [...new Set(terms)].slice(0, 24);
}

function assertLiveGuard(ports: CareRagPorts): void {
  if (!ports.enabled()) fail("FEATURE_DISABLED");
  if (ports.stopped()) fail("AURA_STOPPED");
}

function validConsent(
  c: ExistingConsentView | null,
  participantId: string,
  actorId: string,
  now: Date,
): boolean {
  if (!c) return false;
  if (
    c.subjectUserId !== participantId ||
    c.grantedToUserId !== actorId ||
    c.grantedToOrganisationId !== null ||
    c.createdById !== participantId ||
    c.scope !== CARE_RAG_SCOPE ||
    c.purpose !== CARE_RAG_PURPOSE ||
    c.sourceAction !== CARE_RAG_ACTION ||
    c.status !== "active" ||
    c.revokedAt !== null ||
    (c.expiresAt !== null && c.expiresAt <= now)
  ) return false;
  const scopeFields = c.dataScope;
  if (!Array.isArray(scopeFields)) return false;
  return REQUIRED_DATA_SCOPES.every((field) => scopeFields.includes(field));
}

function rankFiltered(records: CareRagEvidence[], terms: string[], now: Date): RagHit[] {
  return records
    .filter((item) => item.expiresAtIso === null || (
      Number.isFinite(Date.parse(item.expiresAtIso)) && Date.parse(item.expiresAtIso) > now.getTime()
    ))
    .map((item) => {
      const text = item.redactedText.toLowerCase();
      const matched = terms.filter((term) => text.includes(term)).length;
      return {
        id: item.id,
        text: item.redactedText,
        sourceRef: item.sourceRef,
        sourceVersion: item.sourceVersion,
        evidenceStatus: item.evidenceStatus,
        score: matched / terms.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 8);
}

function output(hits: RagHit[]): RagSearchResult {
  return {
    hits,
    filteredBeforeRank: true,
    sourceMode: "synthetic_only",
    modelAuthority: "none",
    unknowns: hits.length === 0 ? ["no_authorised_evidence_match"] : [],
  };
}

export class ParticipantRAG {
  private readonly ports: CareRagPorts;
  private readonly store: CareRagStore;
  constructor(ports: CareRagPorts, store: CareRagStore) {
    this.ports = ports;
    this.store = store;
  }

  /** Denies delegated access even if the actor has a separate general authority grant. */
  async search(input: {
    participantId: string;
    tenantId: string;
    query: string;
  }): Promise<RagSearchResult> {
    assertLiveGuard(this.ports);
    const terms = validateQuery(input.query);
    const actor = await this.ports.authenticatedActor();
    if (!actor) fail("NOT_AUTHENTICATED");
    if (!input.participantId || input.participantId !== actor.id) fail("ACCESS_DENIED");
    if (!input.tenantId?.trim()) fail("ACCESS_DENIED");
    const memberships = await this.ports.organisationMembershipIds(actor.id);
    if (!memberships.includes(input.tenantId)) fail("ACCESS_DENIED");

    const intent = {
      participantId: actor.id,
      actorId: actor.id,
      purpose: CARE_RAG_PURPOSE,
    } as const;
    const originalConsent = await this.ports.latestConsent(intent);
    if (!validConsent(originalConsent, actor.id, actor.id, this.ports.now())) {
      fail("CONSENT_REQUIRED");
    }

    const candidates = await this.store.loadParticipantEvidence({
      participantId: actor.id,
      tenantId: input.tenantId,
      purpose: CARE_RAG_PURPOSE,
    });
    // Exclude every wrong-tenant, wrong-participant, unscoped, stale, or non-synthetic record
    // before any relevance ranking or return to the model.
    const permitted = candidates.filter((e) =>
      e.synthetic === true &&
      e.visibility === "participant_private" &&
      e.participantId === actor.id &&
      e.tenantId === input.tenantId &&
      e.purpose === CARE_RAG_PURPOSE
    );
    const hits = rankFiltered(permitted, terms, this.ports.now());

    // Reconfirm identity, membership, consent and Stop AURA after asynchronous retrieval.
    assertLiveGuard(this.ports);
    const actorAfter = await this.ports.authenticatedActor();
    if (!actorAfter || actorAfter.id !== actor.id) fail("ACCESS_DENIED");
    const membershipsAfter = await this.ports.organisationMembershipIds(actor.id);
    if (!membershipsAfter.includes(input.tenantId)) fail("ACCESS_DENIED");
    const latest = await this.ports.latestConsent(intent);
    if (
      !validConsent(latest, actor.id, actor.id, this.ports.now()) ||
      !originalConsent || latest?.id !== originalConsent.id
    ) fail("CONSENT_REQUIRED");
    await this.ports.auditRead({
      actorId: actor.id,
      participantId: actor.id,
      tenantId: input.tenantId,
      operation: "participant_rag.search",
      evidenceCount: hits.length,
    });
    return output(hits);
  }
}

export class ProviderRAG {
  private readonly ports: CareRagPorts;
  private readonly store: CareRagStore;
  constructor(ports: CareRagPorts, store: CareRagStore) {
    this.ports = ports;
    this.store = store;
  }

  async search(query: string): Promise<RagSearchResult> {
    assertLiveGuard(this.ports);
    const terms = validateQuery(query);
    const actor = await this.ports.authenticatedActor();
    if (!actor) fail("NOT_AUTHENTICATED");
    const candidates = await this.store.loadPublicProviderEvidence();
    const permitted = candidates.filter((e) =>
      e.synthetic === true &&
      e.visibility === "public_provider" &&
      e.participantId === null &&
      e.tenantId === null &&
      e.purpose === "provider_directory_explain"
    );
    const hits = rankFiltered(permitted, terms, this.ports.now());
    assertLiveGuard(this.ports);
    const actorAfter = await this.ports.authenticatedActor();
    if (!actorAfter || actorAfter.id !== actor.id) fail("ACCESS_DENIED");
    await this.ports.auditRead({
      actorId: actor.id,
      participantId: null,
      tenantId: null,
      operation: "provider_rag.search",
      evidenceCount: hits.length,
    });
    return output(hits);
  }
}
