import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft, ChevronRight, RotateCcw, Loader2 } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useGroceryCart } from "@/lib/grocery-cart";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { GroceryOrder, GroceryOrderItem, GroceryProduct } from "@shared/schema";

interface OrderDetail extends GroceryOrder {
  items?: (GroceryOrderItem & { product?: GroceryProduct })[];
}

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  shopping: "Shopping",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  placed: "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300",
  confirmed: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300",
  shopping: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300",
  out_for_delivery: "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300",
  delivered: "bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300",
  cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
};

export default function GroceryOrdersPage() {
  usePageTitle("Grocery Orders");
  const { data: orders, isLoading } = useQuery<GroceryOrder[]>({
    queryKey: ["/api/grocery/orders"],
  });
  const cart = useGroceryCart();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  const handleReorder = async (orderId: string) => {
    setReorderingId(orderId);
    try {
      const res = await apiRequest("GET", `/api/grocery/orders/${orderId}`);
      const detail = (await res.json()) as OrderDetail;
      const items = (detail.items || []).filter((i) => i.product);
      if (items.length === 0) {
        toast({
          title: "Nothing to reorder",
          description: "This order has no products to add to your cart.",
          variant: "destructive",
        });
        return;
      }
      cart.replaceItems(
        items.map((i) => ({
          productId: i.productId,
          name: i.product!.name,
          unit: i.product!.unit,
          price: i.product!.price,
          quantity: i.quantity,
        })),
      );
      toast({
        title: "Items added to cart",
        description: `${items.length} item(s) ready for checkout.`,
      });
      setLocation("/groceries/checkout");
    } catch (e) {
      toast({
        title: "Reorder failed",
        description: e instanceof Error ? e.message : "Could not reorder this order",
        variant: "destructive",
      });
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <Link href="/groceries">
        <Button variant="ghost" size="sm" data-testid="button-back-shop">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to shop
        </Button>
      </Link>
      <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2" data-testid="text-page-title">
        <ShoppingCart className="w-6 h-6 text-[#2EAA6E]" /> My Grocery Orders
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Card className="p-4 hover-elevate" data-testid={`card-order-${o.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/groceries/orders/${o.id}`} className="flex-1 min-w-0">
                    <div className="space-y-1 cursor-pointer">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" data-testid={`text-order-id-${o.id}`}>
                          Order #{o.id.slice(0, 8)}
                        </span>
                        <Badge className={STATUS_COLORS[o.status] || ""} data-testid={`badge-status-${o.id}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </Badge>
                        {o.workerId && (
                          <Badge variant="outline" data-testid={`badge-worker-${o.id}`}>Worker assisted</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{o.deliveryAddress}</p>
                    </div>
                  </Link>
                  <div className="text-right flex items-center gap-2 shrink-0">
                    <span className="font-black text-[#2EAA6E]" data-testid={`text-amount-${o.id}`}>
                      ${Number(o.totalAmount).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReorder(o.id)}
                      disabled={reorderingId === o.id}
                      data-testid={`button-reorder-${o.id}`}
                      aria-label={`Reorder items from order ${o.id.slice(0, 8)}`}
                    >
                      {reorderingId === o.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                      <span className="hidden sm:inline ml-1">Reorder</span>
                    </Button>
                    <Link href={`/groceries/orders/${o.id}`}>
                      <Button size="icon" variant="ghost" aria-label="View order details" data-testid={`button-view-${o.id}`}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="p-10 text-center" data-testid="card-no-orders">
          <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You haven't placed any grocery orders yet.</p>
          <Link href="/groceries">
            <Button className="mt-4" data-testid="button-empty-go-shop">Browse groceries</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
