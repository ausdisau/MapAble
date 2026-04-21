import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, Plus, Minus, ClipboardList } from "lucide-react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useGroceryCart } from "@/lib/grocery-cart";
import { useToast } from "@/hooks/use-toast";
import type { GroceryProduct } from "@shared/schema";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "fresh_produce", label: "Fresh Produce" },
  { value: "pantry", label: "Pantry" },
  { value: "dairy", label: "Dairy" },
  { value: "frozen", label: "Frozen" },
  { value: "bakery", label: "Bakery" },
  { value: "meat_seafood", label: "Meat & Seafood" },
  { value: "beverages", label: "Beverages" },
  { value: "household", label: "Household" },
  { value: "personal_care", label: "Personal Care" },
];

export default function GroceriesPage() {
  usePageTitle("Groceries");
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const cart = useGroceryCart();
  const { toast } = useToast();

  const params = new URLSearchParams();
  if (category !== "all") params.set("category", category);
  if (search.trim()) params.set("search", search.trim());

  const { data: products, isLoading } = useQuery<GroceryProduct[]>({
    queryKey: ["/api/grocery/products", category, search],
    queryFn: async () => {
      const res = await fetch(`/api/grocery/products${params.toString() ? "?" + params.toString() : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });

  const handleAdd = (p: GroceryProduct) => {
    cart.addItem(p, 1);
    toast({ title: "Added to cart", description: `${p.name} (${p.unit})` });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2" data-testid="text-page-title">
            <ShoppingCart className="w-6 h-6 text-[#2EAA6E]" /> Grocery Delivery
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Order groceries delivered to your door, or book a support worker to shop for you under your NDIS daily living budget.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/groceries/orders">
            <Button variant="outline" size="sm" data-testid="link-grocery-orders">
              <ClipboardList className="w-4 h-4 mr-1" /> My Orders
            </Button>
          </Link>
          <Link href="/groceries/checkout">
            <Button size="sm" data-testid="link-grocery-checkout">
              <ShoppingCart className="w-4 h-4 mr-1" /> Cart ({cart.totalItems})
            </Button>
          </Link>
        </div>
      </header>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search grocery products"
            data-testid="input-grocery-search"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger aria-label="Filter by category" data-testid="select-grocery-category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} data-testid={`option-category-${c.value}`}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => {
            const inCart = cart.items.find((i) => i.productId === p.id);
            return (
              <Card key={p.id} className="p-4 flex flex-col gap-2 hover-elevate" data-testid={`card-product-${p.id}`}>
                <div
                  className="aspect-[4/3] -mx-4 -mt-4 mb-1 rounded-t-md bg-muted overflow-hidden flex items-center justify-center"
                  aria-hidden={!p.image}
                >
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      data-testid={`img-product-${p.id}`}
                    />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm leading-tight" data-testid={`text-product-name-${p.id}`}>
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">{p.unit}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]" data-testid={`badge-category-${p.id}`}>
                    {p.category.replace(/_/g, " ")}
                  </Badge>
                </div>
                {p.description && (
                  <p className="text-xs text-muted-foreground flex-1">{p.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-base font-black text-[#2EAA6E]" data-testid={`text-price-${p.id}`}>
                    ${Number(p.price).toFixed(2)}
                  </span>
                  {inCart ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => cart.updateQuantity(p.id, inCart.quantity - 1)}
                        aria-label={`Decrease ${p.name} quantity`}
                        data-testid={`button-decrease-${p.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold" data-testid={`text-quantity-${p.id}`}>
                        {inCart.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => cart.updateQuantity(p.id, inCart.quantity + 1)}
                        aria-label={`Increase ${p.name} quantity`}
                        data-testid={`button-increase-${p.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleAdd(p)}
                      disabled={p.inStock === false}
                      data-testid={`button-add-${p.id}`}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-no-products">
            No products found. Try a different search or category.
          </p>
        </Card>
      )}
    </div>
  );
}
