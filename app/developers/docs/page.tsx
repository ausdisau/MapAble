import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "API Docs | CareOS Developers" };

export default async function DevelopersDocsPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <Link href="/developers" className="text-sm text-primary underline">
        ← Developer portal
      </Link>
      <header>
        <h1 className="font-heading text-3xl font-bold">CareOS Open API v1</h1>
        <p className="mt-2 text-muted-foreground">
          Versioned REST API with cursor pagination, structured errors, and
          participant authority enforcement.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Authentication</h2>
        <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
{`curl -H "X-Api-Key: cos_..." \\
     -H "X-Participant-Id: participant_id" \\
     https://api.example.com/api/v1/care`}
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Endpoints</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2">Resource</th>
              <th className="py-2">Scope</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["/api/v1/participants", "providers_read"],
              ["/api/v1/organisations", "providers_read"],
              ["/api/v1/missions", "bookings_read"],
              ["/api/v1/care", "bookings_read"],
              ["/api/v1/transport", "bookings_read"],
              ["/api/v1/access", "places_read"],
              ["/api/v1/jobs", "bookings_read"],
              ["/api/v1/documents", "invoices_read"],
              ["/api/v1/events", "bookings_read"],
              ["/api/v1/webhooks", "webhooks_receive"],
            ].map(([path, scope]) => (
              <tr key={path} className="border-b">
                <td className="py-2 font-mono">{path}</td>
                <td className="py-2">{scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-xl font-semibold">SDK generation</h2>
        <p className="text-muted-foreground">
          See docs/developer-api/sdk-workflows.md for TypeScript, Python, and C#
          generation workflows. Generated SDKs are not committed to this repo.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">OpenAPI</h2>
        <p className="text-muted-foreground">
          OpenAPI fragments live in docs/api/openapi-careos-v1.yaml.
        </p>
      </section>
    </div>
  );
}
