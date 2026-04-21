import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Banknote, ExternalLink, RefreshCw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PayoutAccount {
  connectEnabled: boolean;
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  stripeChargesEnabled: boolean | null;
  stripePayoutsEnabled: boolean | null;
  stripeRequirementsDue: any;
  platformFeeBps: number;
}

export default function PayoutsPage() {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<PayoutAccount>({ queryKey: ["/api/payouts/account"] });

  const onboard = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/payouts/onboard", {});
      return r.json();
    },
    onSuccess: (d: { url: string }) => { window.location.href = d.url; },
    onError: (e: any) => toast({ title: "Could not start onboarding", description: e?.message, variant: "destructive" }),
  });

  const sync = useMutation({
    mutationFn: () => apiRequest("POST", "/api/payouts/sync", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payouts/account"] });
      toast({ title: "Account refreshed" });
    },
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const fee = ((data?.platformFeeBps ?? 0) / 100).toFixed(2);
  const status = data?.stripeAccountStatus || "not_started";

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-payouts">Payouts</h1>
        <p className="text-sm text-muted-foreground">Manage your Stripe Connect account to receive payments from MapAble.</p>
      </div>

      {!data?.connectEnabled && (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground" data-testid="text-connect-disabled">
            Stripe Connect is not enabled on this MapAble instance. Contact your administrator.
          </p>
        </Card>
      )}

      {data?.connectEnabled && (
        <>
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Banknote className="w-5 h-5" /> Account status</h2>
              <Badge variant={status === "active" ? "default" : "secondary"} data-testid="badge-account-status">{status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Charges enabled</div>
                <div className="font-medium" data-testid="text-charges-enabled">{data.stripeChargesEnabled ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Payouts enabled</div>
                <div className="font-medium" data-testid="text-payouts-enabled">{data.stripePayoutsEnabled ? "Yes" : "No"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Stripe account</div>
                <div className="font-mono text-xs" data-testid="text-stripe-account-id">{data.stripeAccountId ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Platform fee</div>
                <div className="font-medium" data-testid="text-platform-fee">{fee}%</div>
              </div>
            </div>

            {data.stripeRequirementsDue?.currently_due?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-md p-3 text-sm">
                <div className="font-medium mb-1">Action required</div>
                <ul className="list-disc list-inside text-xs">
                  {data.stripeRequirementsDue.currently_due.map((r: string) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => onboard.mutate()} disabled={onboard.isPending} data-testid="button-onboard">
                {onboard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <ExternalLink className="w-4 h-4 mr-1" />}
                {data.stripeAccountId ? "Continue onboarding" : "Start payouts onboarding"}
              </Button>
              {data.stripeAccountId && (
                <Button variant="outline" onClick={() => sync.mutate()} disabled={sync.isPending} data-testid="button-sync-account">
                  <RefreshCw className="w-4 h-4 mr-1" /> Refresh
                </Button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
