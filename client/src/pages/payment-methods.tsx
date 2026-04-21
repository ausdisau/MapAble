import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Trash2, Star, Plus, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BecsMandate } from "@shared/schema";
import { getStripe } from "@/lib/stripe-loader";
import type { Stripe, StripeElements, StripeAuBankAccountElement } from "@stripe/stripe-js";

interface PaymentMethodsResponse {
  becsMandates: BecsMandate[];
  autoDebitEnabled: boolean;
  autoDebitGraceDays: number;
  defaultBecsPaymentMethodId: string | null;
}

interface StripeCapabilities {
  enabled: boolean;
  publishableKey: string;
  capabilities: { card: boolean; link: boolean; becs: boolean; connect: boolean; autoDebit: boolean };
}

export default function PaymentMethodsPage() {
  const { toast } = useToast();
  const [showSetup, setShowSetup] = useState(false);

  const { data: caps } = useQuery<StripeCapabilities>({ queryKey: ["/api/stripe/config"] });
  const { data, isLoading } = useQuery<PaymentMethodsResponse>({ queryKey: ["/api/payment-methods"] });

  const setDefault = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/payment-methods/${id}/default`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Default payment method updated" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/payment-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({ title: "Payment method removed" });
    },
  });

  const setAutoDebit = useMutation({
    mutationFn: (enabled: boolean) => apiRequest("PUT", "/api/billing/auto-debit", { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] }),
    onError: (e: Error) => toast({ title: "Could not update auto-debit", description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="heading-payment-methods">Payment methods</h1>
        <p className="text-sm text-muted-foreground">Manage your bank accounts and auto-debit settings.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Auto-debit</h2>
            <p className="text-sm text-muted-foreground">Automatically charge your default bank account when invoices are due.</p>
          </div>
          <Switch
            checked={!!data?.autoDebitEnabled}
            onCheckedChange={(v) => setAutoDebit.mutate(v)}
            disabled={!caps?.capabilities.autoDebit || setAutoDebit.isPending}
            data-testid="switch-auto-debit"
          />
        </div>
        {data?.autoDebitEnabled && (
          <div className="text-sm text-muted-foreground space-y-1">
            <div data-testid="text-grace-period">
              Grace period: {data.autoDebitGraceDays} days after invoice issue
            </div>
            <div data-testid="text-becs-settlement">
              BECS direct debit settlements typically take <strong>3–4 business days</strong> to clear.
              Invoices remain in <em>processing</em> until the bank confirms the debit.
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard className="w-5 h-5" /> Bank accounts (BECS)</h2>
          {caps?.capabilities.becs && (
            <Button onClick={() => setShowSetup(true)} size="sm" data-testid="button-add-bank">
              <Plus className="w-4 h-4 mr-1" /> Add bank account
            </Button>
          )}
        </div>
        {!caps?.capabilities.becs && (
          <p className="text-sm text-muted-foreground" data-testid="text-becs-disabled">BECS Direct Debit is not enabled on this account.</p>
        )}
        {data?.becsMandates.length === 0 && (
          <p className="text-sm text-muted-foreground" data-testid="text-no-mandates">No bank accounts on file.</p>
        )}
        <div className="space-y-2">
          {data?.becsMandates.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`row-mandate-${m.id}`}>
              <div>
                <div className="font-medium">
                  BSB •••{m.bsbLast4 ?? "----"} / Acct •••{m.accountLast4 ?? "----"}
                  {m.isDefault && <Badge className="ml-2" data-testid={`badge-default-${m.id}`}>Default</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">Status: {m.status}</div>
              </div>
              <div className="flex gap-2">
                {!m.isDefault && (
                  <Button size="sm" variant="ghost" onClick={() => setDefault.mutate(m.id)} data-testid={`button-default-${m.id}`}>
                    <Star className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(m.id)} data-testid={`button-remove-${m.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showSetup && caps?.publishableKey && (
        <BecsSetupModal publishableKey={caps.publishableKey} onClose={() => setShowSetup(false)} />
      )}
    </div>
  );
}

function BecsSetupModal({ publishableKey, onClose }: { publishableKey: string; onClose: () => void }) {
  const { toast } = useToast();
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountHolder, setAccountHolder] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await getStripe(publishableKey);
        if (!s) throw new Error("Failed to load Stripe");
        if (cancelled) return;
        setStripe(s);
        const res = await apiRequest("POST", "/api/payment-methods/setup-intent", {});
        const data = await res.json();
        if (cancelled) return;
        setClientSecret(data.clientSecret);
        const el = s.elements({ clientSecret: data.clientSecret, appearance: { theme: "stripe" } });
        const auEl = el.create("auBankAccount");
        auEl.mount("#au-bank-account-element");
        setElements(el);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to initialize");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [publishableKey]);

  const handleSubmit = async () => {
    if (!stripe || !elements || !clientSecret) return;
    if (!accountHolder || !email) {
      setError("Account holder name and email are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    const auEl: StripeAuBankAccountElement | null = elements.getElement("auBankAccount");
    if (!auEl) {
      setError("Bank account form not ready");
      setSubmitting(false);
      return;
    }
    const result = await stripe.confirmAuBecsDebitSetup(clientSecret, {
      payment_method: {
        au_becs_debit: auEl,
        billing_details: { name: accountHolder, email },
      },
    });
    if (result.error) {
      setError(result.error.message || "Setup failed");
      setSubmitting(false);
      return;
    }
    toast({ title: "Bank account added", description: "Mandate confirmed" });
    queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()} data-testid="modal-becs-setup">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Add Australian bank account</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              <input
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Account holder name"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                data-testid="input-account-holder"
              />
              <input
                className="w-full border rounded-md p-2 text-sm"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-account-email"
              />
              <div id="au-bank-account-element" className="border rounded-md p-3" />
              <p className="text-xs text-muted-foreground" data-testid="text-becs-timeline">
                BECS direct debit payments take <strong>3–4 business days</strong> to settle. Your invoice
                will remain in <em>processing</em> status until the bank confirms the debit.
              </p>
              <p className="text-xs text-muted-foreground">
                By providing your bank details and confirming, you agree to a Direct Debit Request and the
                Direct Debit Request Service Agreement.
              </p>
            </div>
            {error && <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 rounded-md p-3 mb-4 text-sm text-red-700">{error}</div>}
            <Button onClick={handleSubmit} disabled={submitting} className="w-full" data-testid="button-confirm-mandate">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm bank account
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
