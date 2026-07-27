import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft, MapPin, Clock, Truck, Package, CreditCard, Loader2, X } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { loadStripe, type Stripe as StripeType, type StripeElements } from "@stripe/stripe-js";
import { useEffect } from "react";
import type { GroceryOrder, GroceryOrderItem, GroceryProduct } from "@shared/schema";

type OrderWithItems = GroceryOrder & { items: (GroceryOrderItem & { product?: GroceryProduct })[] };

const STATUS_STEPS = ["placed", "confirmed", "shopping", "out_for_delivery", "delivered"] as const;

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  shopping: "Shopping",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

let stripePromise: Promise<StripeType | null> | null = null;
function getStripe(publishableKey: string) {
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

function PayModal({ orderId, amount, onClose, onSuccess }: { orderId: string; amount: number; onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stripeInstance, setStripeInstance] = useState<StripeType | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const configRes = await fetch("/api/stripe/config", { credentials: "include" });
        const config = await configRes.json();
        if (!config.enabled || !config.publishableKey) {
          setError("Payment processing is not configured.");
          setLoading(false);
          return;
        }
        const stripe = await getStripe(config.publishableKey);
        if (cancelled || !stripe) {
          if (!cancelled) setError("Failed to load payment processor.");
          setLoading(false);
          return;
        }
        setStripeInstance(stripe);
        const res = await apiRequest("POST", `/api/grocery/orders/${orderId}/pay`, {});
        const data = await res.json();
        if (cancelled) return;
        const el = stripe.elements({
          clientSecret: data.clientSecret,
          appearance: { theme: "stripe", variables: { colorPrimary: "#1B6EB5" } },
        });
        const pe = el.create("payment", { layout: "tabs" });
        pe.mount("#grocery-pay-element");
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
  }, [orderId]);

  const handleSubmit = async () => {
    if (!stripeInstance || !elements) return;
    setSubmitting(true);
    const { error: err } = await stripeInstance.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (err) {
      setError(err.message || "Payment failed");
      setSubmitting(false);
    } else {
      toast({ title: "Payment successful" });
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()} data-testid="modal-pay-order">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5" /> Pay Order</h3>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-pay-order"><X className="w-4 h-4" /></Button>
        </div>
        <div className="mb-4 text-sm text-muted-foreground">
          Amount: <span className="font-bold text-foreground">${amount.toFixed(2)} AUD</span>
        </div>
        {loading && !error && (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md p-3 mb-4 text-sm text-red-700 dark:text-red-300">{error}</div>
        )}
        <div id="grocery-pay-element" className="mb-4" />
        {!loading && !error && (
          <Button className="w-full gap-2" disabled={submitting} onClick={handleSubmit} data-testid="button-confirm-pay-order">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {submitting ? "Processing..." : `Pay $${amount.toFixed(2)}`}
          </Button>
        )}
      </Card>
    </div>
  );
}

export default function GroceryOrderDetailPage() {
  usePageTitle("Grocery Order");
  const params = useParams<{ id: string }>();
  const orderId = params.id!;
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showPay, setShowPay] = useState(false);

  const { data: order, isLoading } = useQuery<OrderWithItems>({
    queryKey: ["/api/grocery/orders", orderId],
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/grocery/orders/${orderId}/status`, { status: "cancelled" });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Order cancelled" });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery/orders", orderId] });
    },
    onError: (err) => {
      toast({ title: "Could not cancel", description: err instanceof Error ? err.message : "", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-3">
        <Skeleton className="h-10" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card className="p-10 text-center"><p className="text-sm text-muted-foreground">Order not found.</p></Card>
      </div>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status as typeof STATUS_STEPS[number]);
  const isCancelled = order.status === "cancelled";
  const canCancel = order.status === "placed" || order.status === "confirmed";

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
      <Link href="/groceries/orders">
        <Button variant="ghost" size="sm" data-testid="button-back-orders"><ArrowLeft className="w-4 h-4 mr-1" /> All orders</Button>
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2" data-testid="text-page-title">
          <ShoppingCart className="w-6 h-6 text-[#2EAA6E]" /> Order #{order.id.slice(0, 8)}
        </h1>
        <Badge data-testid="badge-status">{STATUS_LABELS[order.status] || order.status}</Badge>
      </div>

      <Card className="p-4">
        <h2 className="font-bold mb-4">Tracking</h2>
        {isCancelled ? (
          <p className="text-sm text-muted-foreground">This order has been cancelled.</p>
        ) : (
          <ol className="flex items-center justify-between gap-2 overflow-x-auto" aria-label="Order progress">
            {STATUS_STEPS.map((step, idx) => {
              const completed = idx <= currentStep;
              const Icon = step === "placed" ? Package : step === "confirmed" ? CreditCard : step === "shopping" ? ShoppingCart : step === "out_for_delivery" ? Truck : Package;
              return (
                <li key={step} className="flex flex-col items-center text-center gap-1 flex-1 min-w-[70px]" data-testid={`step-${step}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${completed ? "bg-[#2EAA6E] text-white" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-semibold ${completed ? "" : "text-muted-foreground"}`}>{STATUS_LABELS[step]}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 p-4">
          <h2 className="font-bold mb-3">Items</h2>
          {order.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items recorded for this order. The worker will pick them up based on your shopping list.</p>
          ) : (
            <ul className="divide-y">
              {order.items.map((it) => (
                <li key={it.id} className="py-2 flex items-center justify-between text-sm" data-testid={`item-${it.id}`}>
                  <div>
                    <div className="font-semibold">{it.product?.name || "Product"}</div>
                    <div className="text-xs text-muted-foreground">{it.product?.unit} · {it.quantity} × ${Number(it.unitPrice).toFixed(2)}</div>
                  </div>
                  <span className="font-semibold">${(Number(it.unitPrice) * it.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t mt-2 pt-3 flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="text-lg font-black text-[#2EAA6E]" data-testid="text-order-total">${Number(order.totalAmount).toFixed(2)}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-bold">Delivery</h2>
          <div className="text-sm flex gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" /><span data-testid="text-address">{order.deliveryAddress}</span></div>
          {order.deliveryTimePreference && (
            <div className="text-sm flex gap-2"><Clock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" /><span data-testid="text-time">{order.deliveryTimePreference}</span></div>
          )}
          {order.accessNeeds && (
            <div className="text-xs">
              <div className="font-semibold mb-0.5">Access needs</div>
              <p className="text-muted-foreground" data-testid="text-access">{order.accessNeeds}</p>
            </div>
          )}
          {order.deliveryNotes && (
            <div className="text-xs">
              <div className="font-semibold mb-0.5">Notes</div>
              <p className="text-muted-foreground" data-testid="text-notes">{order.deliveryNotes}</p>
            </div>
          )}
          {order.workerId && (
            <Badge variant="outline">Worker assisted</Badge>
          )}
          <div className="text-xs">
            <div className="font-semibold mb-0.5">Payment</div>
            <p className="text-muted-foreground" data-testid="text-payment-status">Status: {order.paymentStatus || "unpaid"}</p>
          </div>
          {order.paymentStatus !== "succeeded" && !isCancelled && Number(order.totalAmount) > 0 && (
            <Button size="sm" className="w-full" onClick={() => setShowPay(true)} data-testid="button-pay-now">
              <CreditCard className="w-4 h-4 mr-1" /> Pay now
            </Button>
          )}
          {Number(order.totalAmount) <= 0 && order.workerId && !isCancelled && (
            <p className="text-xs text-muted-foreground" data-testid="text-pay-pending">
              Your worker will add purchased items here. You'll be able to pay once a total is set.
            </p>
          )}
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              data-testid="button-cancel-order"
            >
              {cancelMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Cancel order
            </Button>
          )}
        </Card>
      </div>

      {showPay && (
        <PayModal
          orderId={order.id}
          amount={Number(order.totalAmount)}
          onClose={() => setShowPay(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/grocery/orders", orderId] })}
        />
      )}
    </div>
  );
}
