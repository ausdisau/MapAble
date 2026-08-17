import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { developerPlatformConfig } from "@/lib/config/developer-platform";
import { prisma } from "@/lib/prisma";

export default async function DeveloperClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await requireAuth();
  const { clientId } = await params;

  if (!developerPlatformConfig.enabled) {
    return (
      <p className="p-6 text-muted-foreground">
        Developer platform disabled.
      </p>
    );
  }

  const client = await prisma.apiClient.findUnique({
    where: { id: clientId },
    include: {
      apiKeys: {
        where: { revokedAt: null },
        select: { id: true, keyPrefix: true, scopes: true, lastUsedAt: true, createdAt: true },
      },
      oauthClients: { select: { id: true, clientId: true, scopes: true, active: true } },
      serviceAccounts: { where: { active: true }, select: { id: true, name: true, scopes: true } },
      webhookSubscriptions: {
        select: { id: true, url: true, eventTypes: true, secretPrefix: true, active: true },
      },
      accessLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          path: true,
          method: true,
          statusCode: true,
          createdAt: true,
        },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <Link href="/developers" className="text-sm text-primary underline">
        ← Developer portal
      </Link>
      <header>
        <h1 className="font-heading text-2xl font-bold">{client.name}</h1>
        <p className="text-muted-foreground">
          {client.environment} · {client.status}
        </p>
      </header>

      <section>
        <h2 className="font-semibold">API keys</h2>
        <ul className="mt-2 space-y-2">
          {client.apiKeys.map((k) => (
            <li key={k.id} className="rounded border p-3 text-sm font-mono">
              {k.keyPrefix}… · {k.scopes.join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">OAuth clients</h2>
        <ul className="mt-2 space-y-2">
          {client.oauthClients.map((o) => (
            <li key={o.id} className="rounded border p-3 text-sm">
              {o.clientId} · {o.scopes.join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Webhooks</h2>
        <ul className="mt-2 space-y-2">
          {client.webhookSubscriptions.map((w) => (
            <li key={w.id} className="rounded border p-3 text-sm">
              {w.url} · {w.eventTypes.join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Recent access log</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {client.accessLogs.map((log, i) => (
            <li key={i} className="font-mono text-muted-foreground">
              {log.method} {log.path} → {log.statusCode}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
