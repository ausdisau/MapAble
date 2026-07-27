import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingCart, CreditCard, HeartHandshake, Trash2, ArrowLeft, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useGroceryCart } from "@/lib/grocery-cart";
import { usePageTitle } from "@/hooks/use-page-title";
import { loadStripe, type Stripe as StripeType, type StripeElements } from "@stripe/stripe-js";
import type { Worker, User, GroceryOrder } from "@shared/schema";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

let stripePromise: Promise<StripeType | null> | null = null;
function getStripe(publishableKey: string) {
  if (!stripePromise) stripePromise = loadStripe(publishableKey);
  return stripePromise;
}

function StripePaymentModal({
  orderId,
  amount,
  onClose,
  onSuccess,
}: {
  orderId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
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
          setError("Payment processing is not configured. Please contact support.");
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
        const paymentElement = el.create("payment", { layout: "tabs" });
        paymentElement.mount("#grocery-stripe-element");
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
    setError(null);
    const { error: submitError } = await stripeInstance.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setSubmitting(false);
    } else {
      toast({ title: "Payment successful", description: "Your grocery order is confirmed." });
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()} data-testid="modal-grocery-payment">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Pay for Groceries
          </h3>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-grocery-payment">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="mb-4 text-sm text-muted-foreground">
          Amount: <span className="font-bold text-foreground">${amount.toFixed(2)} AUD</span>
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
        <div id="grocery-stripe-element" className="mb-4" />
        {!loading && !error && (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full gap-2"
            data-testid="button-confirm-grocery-payment"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            {submitting ? "Processing..." : `Pay $${amount.toFixed(2)}`}
          </Button>
        )}
      </Card>
    </div>
  );
}

export default function GroceryCheckoutPage() {
  usePageTitle("Grocery Checkout");
  const cart = useGroceryCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [mode, setMode] = useState<"delivery" | "worker">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryTimePreference, setDeliveryTimePreference] = useState("");
  const [accessNeeds, setAccessNeeds] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [shoppingList, setShoppingList] = useState("");
  const [workerId, setWorkerId] = useState<string>("");
  const [shiftDate, setShiftDate] = useState("");
  const [shiftStart, setShiftStart] = useState("10:00");
  const [shiftEnd, setShiftEnd] = useState("12:00");

  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const { data: workers } = useQuery<(Worker & { user?: User })[]>({
    queryKey: ["/api/workers"],
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/grocery/orders", {
        deliveryAddress,
        deliveryTimePreference: deliveryTimePreference || undefined,
        accessNeeds: accessNeeds || undefined,
        deliveryNotes: deliveryNotes || undefined,
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      return (await res.json()) as GroceryOrder;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
      setPaymentOrderId(order.id);
      setPaymentAmount(Number(order.totalAmount));
    },
    onError: (err) => {
      toast({
        title: "Order failed",
        description: err instanceof Error ? err.message : "Could not place order",
        variant: "destructive",
      });
    },
  });

  const bookWorker = useMutation({
    mutationFn: async () => {
      if (!workerId) throw new Error("Please choose a worker");
      if (!shiftDate) throw new Error("Please choose a date");
      if (!shoppingList.trim()) throw new Error("Please write a shopping list");

      if (!user?.id) throw new Error("You must be signed in");
      const shiftRes = await apiRequest("POST", "/api/shifts", {
        participantId: user.id,
        workerId,
        date: shiftDate,
        startTime: shiftStart,
        endTime: shiftEnd,
        ndisCategory: "daily_living",
        ndisGoal: "Independent living - grocery shopping",
        notes: `Grocery shopping. List: ${shoppingList}`,
        status: "scheduled",
      });
      const shift = await shiftRes.json();

      const orderRes = await apiRequest("POST", "/api/grocery/orders", {
        deliveryAddress,
        deliveryTimePreference: `${shiftDate} ${shiftStart}-${shiftEnd}`,
        accessNeeds: accessNeeds || undefined,
        deliveryNotes: deliveryNotes || undefined,
        workerId,
        shoppingList,
        items: cart.items.length > 0
          ? cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
          : [],
      });

      return { shift, order: await orderRes.json() };
    },
    onSuccess: () => {
      toast({
        title: "Worker booked",
        description: "Your support worker shift is scheduled. The shopping cost will be paid out-of-pocket; the worker's time is claimed under your daily living budget.",
      });
      cart.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
      setLocation("/groceries/orders");
    },
    onError: (err) => {
      toast({
        title: "Booking failed",
        description: err instanceof Error ? err.message : "Could not book worker",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = () => {
    cart.clear();
    queryClient.invalidateQueries({ queryKey: ["/api/grocery/orders"] });
    setLocation(`/groceries/orders/${paymentOrderId}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <Link href="/groceries">
        <Button variant="ghost" size="sm" data-testid="button-back-shop">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to shop
        </Button>
      </Link>
      <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2" data-testid="text-page-title">
        <ShoppingCart className="w-6 h-6 text-[#2EAA6E]" /> Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <h2 className="font-bold mb-3">How would you like to shop?</h2>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "delivery" | "worker")}>
              <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover-elevate" data-testid="radio-mode-delivery">
                <RadioGroupItem value="delivery" id="mode-delivery" className="mt-1" />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    <ShoppingCart className="w-4 h-4" /> Online order with delivery
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Groceries delivered to your door. Paid out-of-pocket via card (not NDIS-claimable).
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-md border cursor-pointer hover-elevate" data-testid="radio-mode-worker">
                <RadioGroupItem value="worker" id="mode-worker" className="mt-1" />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1">
                    <HeartHandshake className="w-4 h-4" /> Book a support worker to shop
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A verified worker will shop with or for you. Worker's time is claimed under your NDIS daily living budget; groceries are paid out-of-pocket.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="font-bold">Delivery & access details</h2>
            <div>
              <Label htmlFor="addr">Delivery address *</Label>
              <Input
                id="addr"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. 12 Smith St, Melbourne VIC 3000"
                data-testid="input-delivery-address"
              />
            </div>
            {mode === "delivery" && (
              <div>
                <Label htmlFor="time">Preferred delivery time</Label>
                <Input
                  id="time"
                  value={deliveryTimePreference}
                  onChange={(e) => setDeliveryTimePreference(e.target.value)}
                  placeholder="e.g. Tomorrow morning, 9–12"
                  data-testid="input-delivery-time"
                />
              </div>
            )}
            <div>
              <Label htmlFor="access">Access needs</Label>
              <Textarea
                id="access"
                value={accessNeeds}
                onChange={(e) => setAccessNeeds(e.target.value)}
                placeholder="e.g. Lift to level 3, please knock loudly, no stairs"
                rows={2}
                data-testid="input-access-needs"
              />
            </div>
            <div>
              <Label htmlFor="notes">Delivery notes</Label>
              <Textarea
                id="notes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Anything else the driver should know"
                rows={2}
                data-testid="input-delivery-notes"
              />
            </div>
          </Card>

          {mode === "worker" && (
            <Card className="p-4 space-y-3">
              <h2 className="font-bold flex items-center gap-2">
                <HeartHandshake className="w-4 h-4" /> Worker booking
              </h2>
              <div>
                <Label>Choose a support worker *</Label>
                <Select value={workerId} onValueChange={setWorkerId}>
                  <SelectTrigger data-testid="select-worker">
                    <SelectValue placeholder="Select a worker" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workers || []).map((w) => (
                      <SelectItem key={w.id} value={w.id} data-testid={`option-worker-${w.id}`}>
                        {w.user?.fullName || "Worker"} — ${Number(w.hourlyRate).toFixed(2)}/hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    data-testid="input-shift-date"
                  />
                </div>
                <div>
                  <Label htmlFor="start">Start</Label>
                  <Input
                    id="start"
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    data-testid="input-shift-start"
                  />
                </div>
                <div>
                  <Label htmlFor="end">End</Label>
                  <Input
                    id="end"
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    data-testid="input-shift-end"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="list">Shopping list *</Label>
                <Textarea
                  id="list"
                  value={shoppingList}
                  onChange={(e) => setShoppingList(e.target.value)}
                  placeholder="e.g. 2 loaves bread, milk, fruit, chicken breast..."
                  rows={4}
                  data-testid="input-shopping-list"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Pre-selected items in your cart will also be sent to the worker.
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-3 text-xs text-blue-800 dark:text-blue-300">
                Worker time will be billed under your <b>daily_living</b> NDIS category. Groceries themselves are not NDIS-claimable.
              </div>
            </Card>
          )}
        </div>

        <Card className="p-4 h-fit lg:sticky lg:top-4 space-y-3" data-testid="card-cart-summary">
          <h2 className="font-bold">Your cart</h2>
          {cart.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-auto">
              {cart.items.map((it) => (
                <li key={it.productId} className="flex items-start justify-between gap-2 text-sm" data-testid={`cart-item-${it.productId}`}>
                  <div className="flex-1">
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {it.unit} · {it.quantity} × ${Number(it.price).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${(Number(it.price) * it.quantity).toFixed(2)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => cart.removeItem(it.productId)}
                      aria-label={`Remove ${it.name}`}
                      data-testid={`button-remove-${it.productId}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="font-bold">Total</span>
            <span className="text-lg font-black text-[#2EAA6E]" data-testid="text-cart-total">
              ${cart.totalPrice.toFixed(2)}
            </span>
          </div>

          {mode === "delivery" ? (
            <Button
              className="w-full"
              onClick={() => createOrder.mutate()}
              disabled={createOrder.isPending || !deliveryAddress || cart.items.length === 0}
              data-testid="button-place-order"
            >
              {createOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              Place order & pay
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() => bookWorker.mutate()}
              disabled={bookWorker.isPending || !deliveryAddress || !workerId || !shiftDate || !shoppingList.trim()}
              data-testid="button-book-worker"
            >
              {bookWorker.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <HeartHandshake className="w-4 h-4 mr-2" />}
              Book worker shift
            </Button>
          )}
        </Card>
      </div>

      {paymentOrderId && (
        <StripePaymentModal
          orderId={paymentOrderId}
          amount={paymentAmount}
          onClose={() => setPaymentOrderId(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
