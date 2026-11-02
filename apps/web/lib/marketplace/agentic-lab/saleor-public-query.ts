/**
 * Saleor PUBLIC products GraphQL proof-of-contract (no transport, token or endpoint).
 * Uses only documented public products/variants. No pricing, stock, eligibility
 * or vendor verification is inferred from a public query.
 * A future server-only transport needs an explicitly approved immutable endpoint,
 * HTTPS, outbound network policy, size/time budgets and tenant data isolation.
 */
export const SALEOR_PUBLIC_NETWORK_ENABLED = false as const;
export const SALEOR_PUBLIC_PRODUCTS_QUERY = `
  query MapAblePublicCatalogue($channel: String!) {
    products(first: 6, channel: $channel) {
      edges {
        node {
          id
          name
          variants {
            id
            name
          }
        }
      }
    }
  }
`;
export interface SaleorPublicQuery {
  readonly operationName: "MapAblePublicCatalogue";
  readonly query: string;
  readonly variables: { readonly channel: string };
}
export interface SaleorProductPreview {
  readonly source: "saleor_public_graphql_projection";
  readonly channel: string;
  readonly productId: string;
  readonly productName: string;
  readonly variantIds: readonly string[];
  readonly observedAt: string;
  readonly available: "NOT_VERIFIED";
  readonly samplePriceCents: null;
  readonly sellerVerification: "NOT_VERIFIED";
  readonly productSafety: "NOT_VERIFIED";
  readonly ndisFunding: "NOT_DETERMINED";
  readonly checkoutEnabled: false;
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function prepareSaleorPublicQuery(channel: string): SaleorPublicQuery {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(channel)) {
    throw new Error("SALEOR_CHANNEL_NOT_ALLOWLISTED");
  }
  return { operationName: "MapAblePublicCatalogue",
    query: SALEOR_PUBLIC_PRODUCTS_QUERY, variables: { channel } };
}
/** Fail closed on malformed and partial responses, rather than invent prices. */
export function projectSaleorPublicResponse(
  raw: unknown, channel: string, observedAt: string,
): readonly SaleorProductPreview[] {
  prepareSaleorPublicQuery(channel);
  if (!Number.isFinite(Date.parse(observedAt))) {
    throw new Error("SALEOR_OBSERVED_AT_INVALID");
  }
  if (!isRecord(raw) || ("errors" in raw && raw.errors !== undefined)) {
    throw new Error("SALEOR_GRAPHQL_FAILED");
  }
  const data = raw.data;
  if (!isRecord(data) || !isRecord(data.products) || !Array.isArray(data.products.edges)) {
    throw new Error("SALEOR_PRODUCTS_MISSING");
  }
  const edges: unknown[] = data.products.edges;
  if (edges.length > 6) throw new Error("SALEOR_PRODUCTS_LIMIT_EXCEEDED");
  return edges.map((edge): SaleorProductPreview => {
    if (!isRecord(edge) || !isRecord(edge.node)) {
      throw new Error("SALEOR_PRODUCT_MALFORMED");
    }
    const node = edge.node;
    if (typeof node.id !== "string" || node.id.length < 1 || node.id.length > 256 ||
        typeof node.name !== "string" || !node.name.trim() || node.name.length > 200) {
      throw new Error("SALEOR_PRODUCT_MALFORMED");
    }
    if (!Array.isArray(node.variants) || node.variants.length > 40) {
      throw new Error("SALEOR_VARIANTS_MALFORMED");
    }
    const variantIds: string[] = node.variants.map((variant: unknown) => {
      if (!isRecord(variant) || typeof variant.id !== "string" ||
          !variant.id || variant.id.length > 256) {
        throw new Error("SALEOR_VARIANT_INVALID");
      }
      return variant.id;
    });
    return {
      source: "saleor_public_graphql_projection",
      channel, productId: node.id, productName: node.name,
      variantIds, observedAt,
      available: "NOT_VERIFIED", samplePriceCents: null,
      sellerVerification: "NOT_VERIFIED",
      productSafety: "NOT_VERIFIED",
      ndisFunding: "NOT_DETERMINED",
      checkoutEnabled: false,
    };
  });
}
/** Explicitly separate GraphQL schema evaluation from network enablement. */
export function evaluateSaleorConnection(): {
  readonly liveConnectionEnabled: false;
  readonly requiredApprovals: readonly string[];
} {
  return {
    liveConnectionEnabled: SALEOR_PUBLIC_NETWORK_ENABLED,
    requiredApprovals: [
      "Approved Saleor tenant/URL and channel; allowlist DNS and egress",
      "Privacy, data residency, vendor identity and licence review",
      "Server-only rate limiting, timeouts and read-only GraphQL allowlist",
      "Independent product and AT-safety verification",
      "Human approval before any future checkout, invoice or payment",
    ],
  };
}
