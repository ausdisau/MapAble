"use client";

import { useCallback, useState } from "react";

import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import { Button } from "@/components/ui/button";

type IntegrationRow = {
  key: string;
  displayName: string;
  type: string;
  status: string;
  enabled: boolean;
  configured: boolean;
  lastHealthCheckAt: string | null;
  lastError: string | null;
};

export function IntegrationHealthDashboard({
  initialIntegrations,
}: {
  initialIntegrations: IntegrationRow[];
}) {
  const [rows, setRows] = useState(initialIntegrations);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const runHealthCheck = useCallback(async (key: string) => {
    setLoadingKey(key);
    try {
      const res = await fetch(`/api/admin/integrations/${key}/health-check`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.integration) {
        setRows((prev) =>
          prev.map((r) => (r.key === key ? { ...r, ...data.integration } : r))
        );
      }
    } finally {
      setLoadingKey(null);
    }
  }, []);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <caption className="sr-only">
          Integration health status for MapAble platform engines
        </caption>
        <thead className="bg-muted/50 text-left">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Integration
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Configured
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Last check
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t">
              <td className="px-4 py-3">
                <span className="font-medium">{row.displayName}</span>
                <span className="block text-xs text-muted-foreground">
                  {row.key}
                </span>
              </td>
              <td className="px-4 py-3">{row.type}</td>
              <td className="px-4 py-3">
                <IntegrationStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3">
                {row.configured ? "Yes" : "No"}
              </td>
              <td className="px-4 py-3">
                {row.lastHealthCheckAt
                  ? new Date(row.lastHealthCheckAt).toLocaleString()
                  : "—"}
                {row.lastError ? (
                  <span className="mt-1 block text-xs text-destructive">
                    {row.lastError}
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loadingKey === row.key}
                  onClick={() => runHealthCheck(row.key)}
                  aria-label={`Run health check for ${row.displayName}`}
                >
                  {loadingKey === row.key ? "Checking…" : "Health check"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
