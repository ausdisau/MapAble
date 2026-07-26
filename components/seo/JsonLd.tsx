import { serializeJsonLdForScript } from "@/lib/config/json-ld";

type JsonLdData = Record<string, unknown> | ReadonlyArray<Record<string, unknown>>;

type JsonLdProps = {
  data: JsonLdData;
  /** CSP nonce when preview enforce is active. */
  nonce?: string;
};

/**
 * Reusable JSON-LD injector for Organization, LocalBusiness, Service, Place, etc.
 * Escapes script-breaking characters via `serializeJsonLdForScript`.
 */
export function JsonLd({ data, nonce }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];

  return (
    <>
      {items.map((item, index) => (
        <script
          // Stable order; graphs rarely reorder within a single page render.
          key={`jsonld-${index}-${String(item["@type"] ?? "graph")}`}
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: serializeJsonLdForScript(item),
          }}
        />
      ))}
    </>
  );
}
