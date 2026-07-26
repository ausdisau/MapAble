import { CreateApiKeyDialog } from "@/components/provider/CreateApiKeyDialog";
import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import { requireAuth } from "@/lib/auth/guards";
import { isAdminRole } from "@/lib/auth/roles";
import { PARTNER_API_KEY_SCOPES } from "@/lib/api/developer/partner-api-key-scopes";
import { listPartnerApiKeys } from "@/lib/api/developer/partner-api-key-service";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Sydney",
  }).format(value);
}

function scopeLabel(scopeId: string) {
  return (
    PARTNER_API_KEY_SCOPES.find((scope) => scope.id === scopeId)?.label ??
    scopeId
  );
}

export default async function ProviderDeveloperPage() {
  const user = await requireAuth();
  const canManage =
    isAdminRole(user.primaryRole) ||
    user.primaryRole === "provider_admin" ||
    user.roles.includes("provider_admin") ||
    user.primaryRole === "transport_operator" ||
    user.roles.includes("transport_operator");

  if (!canManage) {
    return (
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Developer</h1>
        <p className="text-muted-foreground" role="alert">
          You need a provider or admin role to manage Partner API keys.
        </p>
      </div>
    );
  }

  const partnerIds = await getUserOrganisationIds(user.id);
  const [keys, organisations] = await Promise.all([
    listPartnerApiKeys(partnerIds),
    partnerIds.length > 0
      ? prisma.organisation.findMany({
          where: { id: { in: partnerIds } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Developer</h1>
          <p className="text-muted-foreground">
            Generate and manage API keys for the MapAble Partner API Program.
          </p>
        </div>
        <CreateApiKeyDialog organisations={organisations} />
      </div>

      <section
        aria-labelledby="api-keys-heading"
        className="rounded-xl border border-border/60"
      >
        <div className="border-b border-border/60 px-4 py-3">
          <h2 id="api-keys-heading" className="text-lg font-semibold">
            API keys
          </h2>
          <p className="text-sm text-muted-foreground">
            Only the key prefix and creation date are shown. Plain-text secrets
            are never stored.
          </p>
        </div>

        {keys.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              No API keys yet. Create one to connect a partner integration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Prefix
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Scopes
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Last used
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-4 py-3 font-medium">{key.name}</td>
                    <td className="px-4 py-3">
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {key.prefix}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <ul className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <li
                            key={scope}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs"
                          >
                            {scopeLabel(scope)}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <time dateTime={key.createdAt.toISOString()}>
                        {formatDate(key.createdAt)}
                      </time>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {key.lastUsedAt ? (
                        <time dateTime={key.lastUsedAt.toISOString()}>
                          {formatDate(key.lastUsedAt)}
                        </time>
                      ) : (
                        "Never"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
