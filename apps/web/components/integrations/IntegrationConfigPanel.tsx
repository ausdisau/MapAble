import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";

export function IntegrationConfigPanel({
  integration,
}: {
  integration: {
    key: string;
    displayName: string;
    type: string;
    status: string;
    environment: string;
    configured: boolean;
  };
}) {
  return (
    <section
      aria-labelledby="integration-config-heading"
      className="rounded-lg border p-4"
    >
      <h2 id="integration-config-heading" className="text-lg font-semibold">
        {integration.displayName}
      </h2>
      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-muted-foreground">Key</dt>
          <dd>{integration.key}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Type</dt>
          <dd>{integration.type}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd>
            <IntegrationStatusBadge status={integration.status} />
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Environment</dt>
          <dd>{integration.environment}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Env configured</dt>
          <dd>{integration.configured ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-muted-foreground">
        Connection secrets are stored server-side only and are never shown in
        this panel.
      </p>
    </section>
  );
}
