import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FileText, ChevronDown, ChevronUp, Calendar, DollarSign, ShieldCheck, AlertCircle, CreditCard, Clock, Car, Zap, Loader2, X, RefreshCw, CheckCircle2, XCircle, CloudOff, Cloud, AlertTriangle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import type { Invoice, User } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { loadStripe, type Stripe as StripeType, type StripeElements } from "@stripe/stripe-js";

let stripePromise: Promise<StripeType | null> | null = null;
function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
  submitted: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300",
  pending: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300",
  processing: "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300",
  paid: "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300",
  failed: "bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300",
};

interface LineItem {
  type: string;
  ndisItemCode: string;
  description: string;
  quantity: number;
  unitRate: number;
  subtotal: number;
  date: string;
  workerId?: string;
  workerAbn?: string | null;
  abnVerified?: boolean;
}

function StripePaymentModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<StripeType | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const configRes = await fetch("/api/stripe/config");
        const config = await configRes.json();
        if (!config.enabled || !config.publishableKey) {
          setError("Payment processing is not configured. Please contact support.");
          setLoading(false);
          return;
        }
        const stripe = await getStripe(config.publishableKey);
        if (cancelled || !stripe) {
          if (!cancelled) {
            setError("Failed to load payment processor.");
            setLoading(false);
          }
          return;
        }
        setStripeInstance(stripe);

        const res = await apiRequest("POST", "/api/payments/create-intent", { invoiceId: invoice.id });
        const data = await res.json();
        if (data.requiresAbnVerification) {
          setError(data.message);
          setLoading(false);
          return;
        }
        const cs = data.clientSecret;
        if (cancelled) return;
        setClientSecret(cs);

        const el = stripe.elements({
          clientSecret: cs,
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#1B6EB5" },
          },
        });
        const paymentElement = el.create("payment", {
          layout: "tabs",
        });
        paymentElement.mount("#stripe-payment-element");
        setElements(el);
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to initialize payment");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [invoice.id]);

  const handleSubmit = async () => {
    if (!stripeInstance || !elements || !clientSecret) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripeInstance.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setSubmitting(false);
      return;
    }

    const status = paymentIntent?.status;
    if (status === "succeeded") {
      toast({ title: "Payment successful", description: "Your invoice has been paid." });
      onSuccess();
      onClose();
    } else if (status === "processing") {
      toast({
        title: "Payment processing",
        description:
          "BECS direct debit takes 3–4 business days to settle. Your invoice will update to paid once the bank confirms the debit.",
      });
      onSuccess();
      onClose();
    } else if (status === "requires_action" || status === "requires_confirmation") {
      setError("Additional confirmation is required. Please follow the prompts and try again.");
      setSubmitting(false);
    } else {
      setError(`Payment is in an unexpected state (${status ?? "unknown"}). Please try again or contact support.`);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()} data-testid="modal-stripe-payment">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Pay Invoice
          </h3>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-payment">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mb-4 text-sm text-muted-foreground">
          Amount: <span className="font-bold text-foreground">${Number(invoice.totalAmount).toFixed(2)} AUD</span>
        </div>

        {loading && !error && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div id="stripe-payment-element" className="mb-4" />

        {!loading && !error && (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full gap-2"
            data-testid="button-confirm-payment"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {submitting ? "Processing..." : `Pay $${Number(invoice.totalAmount).toFixed(2)}`}
          </Button>
        )}
      </Card>
    </div>
  );
}

type InvoiceWithQb = Invoice;

function QbSyncBadge({ invoice, onSyncSuccess }: { invoice: InvoiceWithQb; onSyncSuccess: () => void }) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const qbSync = invoice.qbSyncStatus || null;
  const qbError = invoice.qbSyncError || null;
  const qbLastSynced = invoice.qbLastSyncedAt || null;

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSyncing(true);
    try {
      await apiRequest("POST", "/api/quickbooks/sync-invoice", { invoiceId: invoice.id });
      toast({ title: "Synced", description: "Invoice synced to QuickBooks." });
      onSyncSuccess();
    } catch (err) {
      toast({ title: "Sync failed", description: err instanceof Error ? err.message : "Failed to sync", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  if (!qbSync) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            data-testid={`button-qb-sync-${invoice.id}`}
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudOff className="w-3 h-3" />}
            Not synced
          </button>
        </TooltipTrigger>
        <TooltipContent>Click to sync to QuickBooks</TooltipContent>
      </Tooltip>
    );
  }

  if (qbSync === "syncing") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400" data-testid={`badge-qb-syncing-${invoice.id}`}>
        <Loader2 className="w-3 h-3 animate-spin" /> Syncing...
      </span>
    );
  }

  if (qbSync === "synced") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400" data-testid={`badge-qb-synced-${invoice.id}`}>
            <CheckCircle2 className="w-3 h-3" /> QB Synced
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {qbLastSynced ? `Last synced: ${new Date(qbLastSynced).toLocaleString()}` : "Synced to QuickBooks"}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (qbSync === "error") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-700 transition-colors"
            data-testid={`button-qb-retry-${invoice.id}`}
          >
            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            Sync Error
          </button>
        </TooltipTrigger>
        <TooltipContent>{qbError || "Sync failed. Click to retry."}</TooltipContent>
      </Tooltip>
    );
  }

  return null;
}

function InvoiceRow({ invoice, onPaySuccess, qbConnected }: { invoice: InvoiceWithQb; onPaySuccess: () => void; qbConnected: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const items = (invoice.lineItems as LineItem[]) || [];
  const hasUnverifiedAbn = items.some(item => item.abnVerified === false);
  const unverifiedCount = items.filter(item => item.abnVerified === false).length;
  const canPay = ["draft", "submitted", "failed", "pending"].includes(invoice.status) && !hasUnverifiedAbn;

  return (
    <>
      <Card className="overflow-hidden" data-testid={`card-invoice-${invoice.id}`}>
        <button
          className="w-full px-5 py-4 flex items-center justify-between text-left"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          data-testid={`button-toggle-invoice-${invoice.id}`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-bold text-sm">
                {invoice.periodStart} to {invoice.periodEnd}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>{items.length} line item{items.length !== 1 ? "s" : ""}</span>
                {qbConnected && <QbSyncBadge invoice={invoice} onSyncSuccess={onPaySuccess} />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-black text-lg" data-testid={`text-invoice-total-${invoice.id}`}>
                ${Number(invoice.totalAmount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
              </div>
              {invoice.ndisClaimable && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <ShieldCheck className="w-3 h-3 text-[#2EAA6E]" />
                  NDIS claimable: ${Number(invoice.ndisClaimable).toFixed(2)}
                </div>
              )}
            </div>
            <Badge className={statusColors[invoice.status] || ""} data-testid={`badge-invoice-status-${invoice.id}`}>
              {invoice.status}
            </Badge>
            {hasUnverifiedAbn && (
              <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 gap-1" data-testid={`badge-abn-warning-${invoice.id}`}>
                <AlertTriangle className="w-3 h-3" />
                ABN Unverified
              </Badge>
            )}
            {canPay && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); setShowPayment(true); }}
                className="gap-1.5"
                data-testid={`button-pay-invoice-${invoice.id}`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Pay Now
              </Button>
            )}
            {!canPay && hasUnverifiedAbn && ["draft", "submitted", "failed", "pending"].includes(invoice.status) && (
              <Button
                size="sm"
                variant="outline"
                disabled
                className="gap-1.5 opacity-60"
                data-testid={`button-pay-blocked-${invoice.id}`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                Payment Blocked
              </Button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {expanded && hasUnverifiedAbn && (
          <div className="border-t bg-amber-50 dark:bg-amber-950/30 px-5 py-3 flex items-start gap-2.5" data-testid={`banner-abn-warning-${invoice.id}`}>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-bold">ABN verification required.</span>{" "}
              {unverifiedCount} of {items.length} line item{items.length !== 1 ? "s" : ""} {unverifiedCount === 1 ? "has" : "have"} a worker/provider with an unverified ABN.
              Payment is blocked until each worker/provider completes ABR ABN verification.
            </div>
          </div>
        )}

        {expanded && items.length > 0 && (
          <div className="border-t">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2 px-5 text-xs font-bold">Date</th>
                  <th className="text-left py-2 px-5 text-xs font-bold">NDIS Code</th>
                  <th className="text-left py-2 px-5 text-xs font-bold">Description</th>
                  <th className="text-left py-2 px-5 text-xs font-bold">ABN Status</th>
                  <th className="text-right py-2 px-5 text-xs font-bold">Qty</th>
                  <th className="text-right py-2 px-5 text-xs font-bold">Rate</th>
                  <th className="text-right py-2 px-5 text-xs font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0" data-testid={`row-line-item-${i}`}>
                    <td className="py-2 px-5 text-muted-foreground">{item.date}</td>
                    <td className="py-2 px-5 font-mono text-xs">{item.ndisItemCode}</td>
                    <td className="py-2 px-5">{item.description}</td>
                    <td className="py-2 px-5">
                      {item.abnVerified ? (
                        <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 gap-1 text-[10px]" data-testid={`badge-abn-verified-${i}`}>
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 gap-1 text-[10px]" data-testid={`badge-abn-unverified-${i}`}>
                          <AlertTriangle className="w-3 h-3" />
                          Unverified
                        </Badge>
                      )}
                      {item.workerAbn && (
                        <div className="text-[10px] text-muted-foreground font-mono mt-1">{item.workerAbn}</div>
                      )}
                    </td>
                    <td className="py-2 px-5 text-right">{item.quantity.toFixed(item.type === "transport" ? 1 : 2)}</td>
                    <td className="py-2 px-5 text-right">${item.unitRate.toFixed(2)}</td>
                    <td className="py-2 px-5 text-right font-bold">${item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showPayment && (
        <StripePaymentModal
          invoice={invoice}
          onClose={() => setShowPayment(false)}
          onSuccess={onPaySuccess}
        />
      )}
    </>
  );
}

interface OrbUsageData {
  subscriptionId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usage: Array<{
    billable_metric: { name: string };
    usage: Array<{ quantity: number }>;
  }>;
}

function UsageMeteringSummary({ userId }: { userId: string }) {
  const { data: orbData } = useQuery<{ usage: OrbUsageData | null; orbEnabled: boolean }>({
    queryKey: ["/api/billing/usage"],
  });

  const { data: budgetData } = useQuery<{
    budgets: Array<{ category: string; allocated: number; used: number; remaining: number }>;
    currentCareTier: { tier: string; rate: number; hoursUsed: number };
    currentTransportTier: { tier: string; rate: number; kmUsed: number };
  }>({
    queryKey: ["/api/budget", userId],
    queryFn: async () => {
      const res = await fetch(`/api/budget?participantId=${userId}`);
      if (!res.ok) throw new Error("Failed to fetch budget");
      return res.json();
    },
    enabled: !!userId,
  });

  if (!budgetData) return null;

  const orbUsage = orbData?.usage;
  let careHours = budgetData.currentCareTier.hoursUsed;
  let transportKm = budgetData.currentTransportTier.kmUsed;

  if (orbUsage?.usage) {
    for (const metric of orbUsage.usage) {
      const name = metric.billable_metric?.name?.toLowerCase() || "";
      const qty = metric.usage?.[0]?.quantity || 0;
      if (name.includes("care") || name.includes("hour")) {
        careHours = qty;
      } else if (name.includes("transport") || name.includes("km")) {
        transportKm = qty;
      }
    }
  }

  const periodLabel = orbUsage
    ? `${orbUsage.currentPeriodStart} to ${orbUsage.currentPeriodEnd}`
    : "Current month";

  return (
    <Card className="overflow-hidden" data-testid="card-usage-metering">
      <div className="bg-gradient-to-r from-[#14578F] via-[#1B6EB5] to-[#2384C9] px-6 py-4">
        <h2 className="text-lg font-black text-white flex items-center gap-2">
          <Zap className="w-5 h-5" /> Current Billing Period Usage
        </h2>
        <p className="text-sm text-white/70 mt-0.5">
          {orbData?.orbEnabled ? "Orb-metered usage" : "Local usage tracking"} — {periodLabel}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#E6A817]" />
            <h3 className="font-bold text-sm">Care Hours</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black" data-testid="text-care-hours">{careHours.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">hours this period</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">{budgetData.currentCareTier.tier}</Badge>
            <span className="text-sm text-muted-foreground">@ ${budgetData.currentCareTier.rate.toFixed(2)}/hr</span>
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-[#E6A817]" />
            <h3 className="font-bold text-sm">Transport Distance</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black" data-testid="text-transport-km">{transportKm.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">km this period</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">{budgetData.currentTransportTier.tier}</Badge>
            <span className="text-sm text-muted-foreground">@ ${budgetData.currentTransportTier.rate.toFixed(2)}/km</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function InvoicesPage() {
  usePageTitle("Invoices");
  const { toast } = useToast();
  const { data: me } = useQuery<User>({ queryKey: ["/api/me"] });
  const { data: qbStatus } = useQuery<{ connected: boolean; enabled: boolean }>({
    queryKey: ["/api/quickbooks/status"],
  });
  const qbConnected = qbStatus?.connected || false;
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const [periodStart, setPeriodStart] = useState(formatDate(firstOfMonth));
  const [periodEnd, setPeriodEnd] = useState(formatDate(lastOfMonth));

  const { data: invoiceList, isLoading, isError, refetch } = useQuery<InvoiceWithQb[]>({
    queryKey: ["/api/invoices", me?.id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?participantId=${me?.id}`);
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
    enabled: !!me?.id,
  });

  const generateInvoice = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/invoices/generate", {
        participantId: me?.id,
        periodStart,
        periodEnd,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Invoice generated", description: "Your NDIS invoice has been created." });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", me?.id] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate invoice.", variant: "destructive" });
    },
  });

  const handlePaySuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/invoices", me?.id] });
  };

  if (isError) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-1">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">We couldn't load the data. Please try again.</p>
          <Button onClick={() => refetch()} data-testid="button-retry">Try Again</Button>
        </Card>
      </div>
    );
  }

  if (isLoading || !me) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="p-6"><Skeleton className="h-32 w-full" /></Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" data-testid="text-page-title">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View, generate, and pay NDIS-ready invoices with support item codes
        </p>
      </div>

      <UsageMeteringSummary userId={me.id} />

      <Card className="p-5">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Generate Invoice
        </h2>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Label htmlFor="period-start" className="text-xs font-semibold">Period Start</Label>
            <Input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="mt-1"
              data-testid="input-period-start"
            />
          </div>
          <div className="flex-1 w-full">
            <Label htmlFor="period-end" className="text-xs font-semibold">Period End</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="mt-1"
              data-testid="input-period-end"
            />
          </div>
          <Button
            onClick={() => generateInvoice.mutate()}
            disabled={generateInvoice.isPending || !periodStart || !periodEnd}
            className="gap-2 w-full sm:w-auto"
            data-testid="button-generate-invoice"
          >
            <DollarSign className="w-4 h-4" />
            {generateInvoice.isPending ? "Generating..." : "Generate Invoice"}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        {invoiceList && invoiceList.length > 0 ? (
          invoiceList.map((inv) => (
            <InvoiceRow key={inv.id} invoice={inv} onPaySuccess={handlePaySuccess} qbConnected={qbConnected} />
          ))
        ) : (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No invoices yet. Generate one for a billing period above.
          </Card>
        )}
      </div>
    </div>
  );
}
