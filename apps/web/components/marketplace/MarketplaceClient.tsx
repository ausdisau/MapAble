"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatMarketplacePrice } from "@/lib/marketplace/format";
import type { MarketplaceCartItem, MarketplaceProduct } from "@/lib/marketplace/types";

const CART_KEY = "mapable-marketplace-cart";

export function readMarketplaceCart(): MarketplaceCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MarketplaceCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMarketplaceCart(items: MarketplaceCartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("mapable-marketplace-cart"));
}

export function addToMarketplaceCart(productId: string, quantity = 1) {
  const cart = readMarketplaceCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ productId, quantity });
  }
  writeMarketplaceCart(cart);
}

export function updateMarketplaceCartQuantity(productId: string, quantity: number) {
  const cart = readMarketplaceCart().filter((i) => i.productId !== productId);
  if (quantity > 0) cart.push({ productId, quantity });
  writeMarketplaceCart(cart);
}

export function clearMarketplaceCart() {
  writeMarketplaceCart([]);
}

export function useMarketplaceCartCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      const total = readMarketplaceCart().reduce((sum, i) => sum + i.quantity, 0);
      setCount(total);
    }
    sync();
    window.addEventListener("mapable-marketplace-cart", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mapable-marketplace-cart", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return count;
}

export function MarketplaceAddToCartButton({
  product,
  className,
}: {
  product: MarketplaceProduct;
  className?: string;
}) {
  const [added, setAdded] = useState(false);

  if (!product.inStock) {
    return (
      <span className="text-sm text-muted-foreground" role="status">
        Out of stock
      </span>
    );
  }

  return (
    <button
      type="button"
      className={
        className ??
        "inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring"
      }
      onClick={() => {
        addToMarketplaceCart(product.id);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
      }}
    >
      {added ? "Added to cart" : "Add to cart"}
    </button>
  );
}

export function MarketplaceProductCard({ product }: { product: MarketplaceProduct }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-card p-4">
      <div
        className="mb-3 flex h-28 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground"
        aria-hidden
      >
        {product.category.replace("-", " ")}
      </div>
      <h3 className="font-semibold">
        <Link
          prefetch={false}
          href={`/marketplace/products/${product.slug}`}
          className="hover:text-primary focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
      <p className="mt-3 text-sm text-muted-foreground">Sold by {product.sellerName}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <span className="font-semibold">{formatMarketplacePrice(product.priceCents)}</span>
        <MarketplaceAddToCartButton
          product={product}
          className="inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </article>
  );
}

export function MarketplaceCartClient({
  products,
}: {
  products: MarketplaceProduct[];
}) {
  const [cart, setCart] = useState<MarketplaceCartItem[]>([]);
  useEffect(() => {
    setCart(readMarketplaceCart());
    function sync() {
      setCart(readMarketplaceCart());
    }
    window.addEventListener("mapable-marketplace-cart", sync);
    return () => window.removeEventListener("mapable-marketplace-cart", sync);
  }, []);

  const lines = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { item, product };
    })
    .filter(Boolean) as { item: MarketplaceCartItem; product: MarketplaceProduct }[];

  const totalCents = lines.reduce(
    (sum, { item, product }) => sum + item.quantity * product.priceCents,
    0,
  );


  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-muted-foreground">Your example cart is empty. Checkout is disabled.</p>
        <Link prefetch={false} href="/marketplace/browse" className="mt-3 inline-block text-primary underline">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y rounded-xl border">
        {lines.map(({ item, product }) => (
          <li key={product.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">{product.sellerName}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${product.id}`}>
                Quantity for {product.name}
              </label>
              <input
                id={`qty-${product.id}`}
                type="number"
                min={1}
                max={99}
                value={item.quantity}
                onChange={(e) => {
                  const qty = Number(e.target.value);
                  updateMarketplaceCartQuantity(product.id, qty);
                  setCart(readMarketplaceCart());
                }}
                className="w-16 rounded border px-2 py-1 text-sm"
              />
              <span className="font-medium">
                {formatMarketplacePrice(item.quantity * product.priceCents)}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-lg font-semibold">Total {formatMarketplacePrice(totalCents)}</p>
        <span className="rounded-xl border px-4 py-3 font-semibold" role="status">
          Checkout disabled during the synthetic pilot
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Amounts shown in this legacy demonstration are not payable and exclude verified GST,
        delivery and seller evidence. Use the inclusive pilot to request an illustrative
        server-calculated amount; it does not create an order or invoice.
      </p>
    </div>
  );
}
