import Link from "next/link";

import { CopyToClipboardButton } from "@/components/partner/CopyToClipboardButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Placeholder API keys for technical partners.
 * Secrets are never shown — only prefix + expiry (matches Partner API Program model).
 * TODO: fetch from ApiKey / DeveloperApiKey services scoped to the partner org.
 */
const API_KEYS = [
  {
    id: "key_1",
    name: "Production Wayfinding",
    prefix: "mapable_live_a1b2c3d4***",
    expiresAt: "2027-01-15",
    scopes: ["directory:read", "wayfinding:compute"],
  },
  {
    id: "key_2",
    name: "Staging Embeds",
    prefix: "mapable_live_9f8e7d6c***",
    expiresAt: "2026-10-01",
    scopes: ["directory:read"],
  },
] as const;

const EMBED_SNIPPET = `<iframe
  src="https://mapable.com.au/embed/wayfinding?venue=YOUR_VENUE_ID"
  title="MapAble 3D indoor wayfinding"
  width="100%"
  height="640"
  style="border:0;border-radius:12px;"
  allow="geolocation; fullscreen"
  loading="lazy"
></iframe>`;

export default function PartnerDeveloperPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold">Developer &amp; API</h2>
          <p className="max-w-2xl text-muted-foreground">
            Manage Partner API keys and white-label 3D wayfinding embeds for your
            websites and apps.
          </p>
        </div>
        <Button asChild variant="default" size="default">
          {/* TODO: open create-key dialog wired to POST /api/developer/apps/keys */}
          <Link href="/provider/developer">Manage keys in Provider console</Link>
        </Button>
      </header>

      <section aria-labelledby="partner-api-keys-heading">
        <Card variant="default">
          <CardHeader>
            <CardTitle id="partner-api-keys-heading">API keys</CardTitle>
            <CardDescription>
              Secrets are masked. Only the key prefix and expiration date are
              shown. Plain-text keys are never stored after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <caption className="sr-only">
                  Partner API keys with masked secrets
                </caption>
                <thead className="border-b border-border/60 text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Prefix
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Scopes
                    </th>
                    <th scope="col" className="px-3 py-3 font-medium">
                      Expires
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {API_KEYS.map((key) => (
                    <tr key={key.id}>
                      <th
                        scope="row"
                        className="px-3 py-3 font-medium text-foreground"
                      >
                        {key.name}
                      </th>
                      <td className="px-3 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {key.prefix}
                        </code>
                      </td>
                      <td className="px-3 py-3">
                        <ul className="flex flex-wrap gap-1">
                          {key.scopes.map((scope) => (
                            <li
                              key={scope}
                              className="rounded-full bg-muted px-2 py-0.5 text-xs"
                            >
                              {scope}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        <time dateTime={key.expiresAt}>{key.expiresAt}</time>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="partner-embed-heading">
        <Card variant="default">
          <CardHeader>
            <CardTitle id="partner-embed-heading">
              Embed the MapAble 3D widget
            </CardTitle>
            <CardDescription>
              Drop this iframe on your website to white-label indoor wayfinding.
              Replace <code className="font-mono text-xs">YOUR_VENUE_ID</code>{" "}
              with your venue identifier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre
              className="overflow-x-auto rounded-lg border border-border/60 bg-muted/40 p-4 text-xs leading-relaxed"
              aria-label="MapAble iframe embed code snippet"
            >
              <code>{EMBED_SNIPPET}</code>
            </pre>
            <CopyToClipboardButton
              value={EMBED_SNIPPET}
              label="Copy embed code"
              copiedLabel="Embed code copied"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
