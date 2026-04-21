import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import type { NdisClaim } from "@shared/schema";

interface IntegrationStatus {
  configured: boolean;
  missingEnvVars: string[];
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  apiBaseUrl: string;
  tokenUrl: string;
  tokenCached: boolean;
  tokenExpiresAt: string | null;
  lastPriceGuideSyncAt: string | null;
}

export default function NdisAdminPage() {
  const { data: status, isLoading: loadingStatus } = useQuery<IntegrationStatus>({ queryKey: ["/api/ndis/integration-status"] });
  const { data: claims, isLoading: loadingClaims } = useQuery<NdisClaim[]>({ queryKey: ["/api/ndis/claims"] });

  if (loadingStatus) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-ndis-admin">NDIS PRODA admin</h1>
        <p className="text-sm text-muted-foreground">Integration status and recent claims.</p>
      </div>

      <Card className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            {status?.configured
              ? <><ShieldCheck className="w-5 h-5 text-green-600" /> PRODA configured</>
              : <><ShieldOff className="w-5 h-5 text-amber-600" /> PRODA not configured</>}
          </h2>
          <Badge variant={status?.configured ? "default" : "secondary"} data-testid="badge-proda-status">
            {status?.configured ? "Live" : "Disabled"}
          </Badge>
        </div>

        {!status?.configured && status?.missingEnvVars && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-md p-3 text-sm">
            <div className="font-medium mb-1">Missing environment variables</div>
            <ul className="list-disc list-inside text-xs font-mono" data-testid="list-missing-env">
              {status.missingEnvVars.map((v) => <li key={v}>{v}</li>)}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-muted-foreground">API base</div>
            <div className="font-mono text-xs break-all" data-testid="text-api-base">{status?.apiBaseUrl}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Token cached</div>
            <div data-testid="text-token-cached">{status?.tokenCached ? `Until ${status.tokenExpiresAt}` : "No"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Last price guide sync</div>
            <div data-testid="text-last-sync">{status?.lastPriceGuideSyncAt ?? "Never"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Required vars</div>
            <div className="font-mono text-xs">{status?.requiredEnvVars.join(", ")}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Recent claims</h2>
        {loadingClaims ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : claims && claims.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-claims">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Reference</th><th>Item</th><th>Date</th><th>Total</th><th>Status</th></tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.id} className="border-t" data-testid={`row-claim-${c.id}`}>
                    <td className="py-2 font-mono text-xs">{c.claimReference}</td>
                    <td>{c.itemCode}</td>
                    <td>{c.serviceDate}</td>
                    <td>${Number(c.totalAmount).toFixed(2)}</td>
                    <td>
                      <Badge variant={c.status === "accepted" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid="text-no-claims">No claims yet.</p>
        )}
      </Card>
    </div>
  );
}
