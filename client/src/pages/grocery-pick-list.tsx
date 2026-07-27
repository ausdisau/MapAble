import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Printer, MapPin, Clock, AlertCircle } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GroceryOrder, GroceryOrderItem, GroceryProduct } from "@shared/schema";

type PickListOrder = GroceryOrder & {
  items: (GroceryOrderItem & { product?: GroceryProduct })[];
};

const NEXT_STATUS: Record<string, { label: string; next: string } | undefined> = {
  placed: { label: "Confirm", next: "confirmed" },
  confirmed: { label: "Start shopping", next: "shopping" },
  shopping: { label: "Out for delivery", next: "out_for_delivery" },
  out_for_delivery: { label: "Mark delivered", next: "delivered" },
};

export default function GroceryPickListPage() {
  usePageTitle("Grocery pick list");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: orders, isLoading, isError, error } = useQuery<PickListOrder[]>({
    queryKey: ["/api/grocery/worker/pick-list"],
    enabled: !!user && (user.role === "carer" || user.role === "admin"),
  });

  const advanceMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/grocery/orders/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery/worker/pick-list"] });
      toast({ title: "Order updated" });
    },
    onError: (e: unknown) => {
      toast({ title: "Update failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    },
  });

  if (!user) return null;
  if (user.role !== "carer" && user.role !== "admin") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Alert variant="destructive" data-testid="alert-not-worker">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>The grocery pick list is only available to support workers and admins.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2" data-testid="text-page-title">
            <ClipboardList className="w-6 h-6 text-[#2EAA6E]" /> Grocery pick list
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orders assigned to you. Update the status as you shop, deliver, and complete the run.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-list">
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
      </header>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      )}

      {isError && (
        <Alert variant="destructive" data-testid="alert-pick-list-error">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error instanceof Error ? error.message : "Failed to load the pick list"}</AlertDescription>
        </Alert>
      )}

      {!isLoading && orders && orders.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-empty-pick-list">
            No active grocery orders are assigned to you right now.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {orders?.map((o) => {
          const next = NEXT_STATUS[o.status];
          const itemCount = o.items.reduce((sum, it) => sum + it.quantity, 0);
          return (
            <Card key={o.id} data-testid={`card-pick-order-${o.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    Order #{o.id.slice(0, 8)}
                    <Badge variant="outline" data-testid={`badge-status-${o.id}`}>{o.status.replace(/_/g, " ")}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {o.deliveryAddress}
                  </p>
                  {o.deliveryTimePreference && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {o.deliveryTimePreference}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-black text-[#2EAA6E]" data-testid={`text-total-${o.id}`}>
                    ${Number(o.totalAmount).toFixed(2)}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {o.accessNeeds && (
                  <Alert className="border-[#E6A817]/40 bg-[#E6A817]/5">
                    <AlertCircle className="w-4 h-4 text-[#E6A817]" />
                    <AlertDescription className="text-xs">
                      <span className="font-semibold">Access needs:</span> {o.accessNeeds}
                    </AlertDescription>
                  </Alert>
                )}
                {o.shoppingList && (
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1">Shopping list</p>
                    <pre className="text-xs whitespace-pre-wrap font-sans" data-testid={`text-shopping-list-${o.id}`}>
                      {o.shoppingList}
                    </pre>
                  </div>
                )}
                {o.items.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide">Items ({itemCount})</p>
                    <ul className="text-sm divide-y">
                      {o.items.map((it) => (
                        <li key={it.id} className="py-1.5 flex items-center justify-between gap-2" data-testid={`row-item-${it.id}`}>
                          <div className="flex-1">
                            <span className="font-medium">{it.quantity}× {it.product?.name ?? "Unknown item"}</span>
                            {it.product?.brand && <span className="text-xs text-muted-foreground ml-2">{it.product.brand}</span>}
                            {it.product?.unit && <span className="text-xs text-muted-foreground ml-2">({it.product.unit})</span>}
                          </div>
                          <span className="text-sm tabular-nums text-muted-foreground">${(Number(it.unitPrice) * it.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No catalogue items — pick from the shopping list above.</p>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/groceries/orders/${o.id}`}>
                    <Button variant="ghost" size="sm" data-testid={`link-order-detail-${o.id}`}>View full order</Button>
                  </Link>
                  {next && (
                    <Button
                      size="sm"
                      onClick={() => advanceMut.mutate({ id: o.id, status: next.next })}
                      disabled={advanceMut.isPending}
                      data-testid={`button-advance-${o.id}`}
                    >
                      {next.label}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
