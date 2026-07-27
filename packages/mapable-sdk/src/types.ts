/** Configuration for the MapAble SDK client. */
export interface MapAbleConfig {
  /** API key used for Bearer authentication. */
  apiKey: string;
  /** Optional API base URL. Defaults to the MapAble production API host. */
  baseUrl?: string;
}

/** Mobility / accessibility profile used when planning indoor routes. */
export type MobilityProfile =
  | "standard"
  | "manual_wheelchair"
  | "power_wheelchair"
  | "sensory_sensitive";

/** A geographic point with optional indoor context. */
export interface RoutePoint {
  lat: number;
  lng: number;
  /** Floor identifier within a venue (e.g. "G", "1", "B1"). */
  floor?: string;
  /** Venue identifier when the point is indoors. */
  venueId?: string;
}

/** Optional preferences that influence indoor path planning. */
export interface RoutePreferences {
  /** Prefer step-free / elevator routes when true. */
  avoidStairs?: boolean;
  /** Prefer quieter corridors when true (sensory-friendly routing). */
  preferQuiet?: boolean;
  /** Maximum walking distance in meters, if constrained. */
  maxDistanceMeters?: number;
}

/** Request payload for indoor route planning. */
export interface RouteRequest {
  origin: RoutePoint;
  destination: RoutePoint;
  mobilityProfile: MobilityProfile;
  preferences?: RoutePreferences;
}

/** GeoJSON position: [longitude, latitude] or [longitude, latitude, elevation]. */
export type GeoJSONPosition = [number, number] | [number, number, number];

/** Minimal GeoJSON geometry union used by route responses. */
export type GeoJSONGeometry =
  | {
      type: "Point";
      coordinates: GeoJSONPosition;
    }
  | {
      type: "LineString";
      coordinates: GeoJSONPosition[];
    }
  | {
      type: "MultiLineString";
      coordinates: GeoJSONPosition[][];
    }
  | {
      type: "Polygon";
      coordinates: GeoJSONPosition[][];
    }
  | {
      type: "MultiPolygon";
      coordinates: GeoJSONPosition[][][];
    };

/** A single GeoJSON Feature. */
export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry | null;
  properties: Record<string, unknown> | null;
  id?: string | number;
}

/** A GeoJSON FeatureCollection (e.g. planned indoor path geometry). */
export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

/** Service types accepted when creating a draft invoice. */
export type BillingServiceType =
  | "care"
  | "transport"
  | "jobs"
  | "foods"
  | "moves"
  | "academy"
  | "marketplace"
  | "subscription"
  | "other";

/** Approval actor types for invoice review. */
export type BillingApprovalType =
  | "participant"
  | "provider"
  | "mapable_finance";

/** Approval decision values. */
export type BillingApprovalDecision =
  | "approved"
  | "rejected"
  | "changes_requested";

/** Line item input for draft invoice creation. */
export interface CreateInvoiceLineItem {
  description: string;
  quantity?: number;
  unitAmountCents: number;
  ndisLineItem?: string;
  gstApplicable?: boolean;
  metadata?: Record<string, unknown>;
}

/** POST /api/billing/invoices body. */
export interface CreateInvoiceRequest {
  providerId?: string;
  bookingId?: string;
  serviceType: BillingServiceType;
  fundingSourceId?: string;
  ndisLineItem?: string;
  ndisClaimable?: boolean;
  dueAt?: string;
  lineItems: CreateInvoiceLineItem[];
  providerSplits?: Array<{
    recipientType:
      | "provider"
      | "worker"
      | "transport_operator"
      | "mapable_platform";
    recipientId?: string;
    amountCents: number;
  }>;
}

/** Opaque invoice record returned by billing APIs (Prisma shape may grow). */
export interface BillingInvoice {
  id: string;
  status: string;
  [key: string]: unknown;
}

export interface IssueInvoiceRequest {
  reason?: string;
}

export interface SendInvoiceRequest {
  channel?: string;
  recipient?: string;
  reason?: string;
}

export interface VoidInvoiceRequest {
  reason: string;
}

export interface ApproveInvoiceRequest {
  approvalType: BillingApprovalType;
  decision?: BillingApprovalDecision;
  reason?: string;
}

export interface DisputeInvoiceRequest {
  reason: string;
}

export interface RequestApprovalRequest {
  approvalType: BillingApprovalType;
  reason?: string;
}

export interface CreateCreditNoteRequest {
  amountCents: number;
  reason: string;
  lineItemIds?: string[];
  transitionInvoice?: boolean;
}

/** CareOS Open API cursor page (openapi-careos-v1 CursorPage). */
export interface CareOsCursorPage {
  nextCursor?: string | null;
  hasMore?: boolean;
}

export interface CareOsListOptions {
  limit?: number;
  cursor?: string;
}

export interface CareOsParticipantSummary {
  id: string;
  authorityDomains?: string[];
  [key: string]: unknown;
}

export interface CareOsCareShift {
  id: string;
  [key: string]: unknown;
}

export interface CareOsAccessPlace {
  id: string;
  [key: string]: unknown;
}

export interface CareOsWebhookSubscription {
  id: string;
  [key: string]: unknown;
}
