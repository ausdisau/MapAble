import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import { listApiClients } from "@/lib/platform/developer-auth/api-client-service";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Developer Portal | CareOS" };

export default async function DevelopersPortalPage() {
  await requireAuth();

  const clients = developerPlatformConfig.enabled
    ? await listApiClients()
    : [];
  const scopeCatalog = await prisma.apiAccessScope.findMany({
    orderBy: { scope: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <h1 className="font-heading text-3xl font-bold">CareOS Developer Portal</h1>
        <p className="mt-2 text-muted-foreground">
          Open API credentials, OAuth clients, webhooks, and sandbox access for
          certified partners.
        </p>
      </header>

      {!developerPlatformConfig.enabled ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-4 text-amber-950">
          Developer platform is disabled. Set MAPABLE_DEVELOPER_PLATFORM_ENABLED=true.
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded border p-4">
          <h2 className="font-semibold">API clients</h2>
          <p className="mt-1 text-2xl font-bold">{clients.length}</p>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold">Webhooks</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {developerPlatformConfig.partnerWebhooksEnabled
              ? "Enabled"
              : "Disabled (MAPABLE_PARTNER_WEBHOOKS_ENABLED)"}
          </p>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold">Environment</h2>
          <p className="mt-1 text-sm">Sandbox uses synthetic data only</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your API clients</h2>
          <Link
            href="/developers/docs"
            className="text-sm text-primary underline"
          >
            API reference
          </Link>
        </div>
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id} className="rounded border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.environment} · {c.status}
                  </p>
                </div>
                <Link
                  href={`/developers/clients/${c.id}`}
                  className="text-sm text-primary underline"
                >
                  Manage
                </Link>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.apiKeys.length} active key(s) · {c.webhookSubscriptions.length}{" "}
                webhook(s)
              </p>
            </li>
          ))}
          {clients.length === 0 && developerPlatformConfig.enabled ? (
            <li className="rounded border border-dashed p-6 text-center text-muted-foreground">
              No API clients yet. Create one via POST /api/developers/clients.
            </li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Available scopes</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {scopeCatalog.map((s) => (
            <li key={s.id} className="rounded border px-3 py-2 text-sm">
              <code className="font-mono">{s.scope}</code> — {s.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border bg-muted/30 p-4 text-sm">
        <h2 className="font-semibold">Safety</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>API keys and webhook secrets are hashed; shown once at creation.</li>
          <li>Partner access requires participant authority via x-participant-id.</li>
          <li>Service accounts cannot inherit participant session authority.</li>
          <li>Sandbox environment returns synthetic data only.</li>
        </ul>
      </section>
    </div>
  );
}
