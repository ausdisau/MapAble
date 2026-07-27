import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { GroceryProduct } from "@shared/schema";

const STORAGE_KEY = "mapable-grocery-cart-v1";

export interface CartItem {
  productId: string;
  name: string;
  unit: string;
  price: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: GroceryProduct, qty?: number) => void;
  updateQuantity: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  replaceItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function GroceryCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (product: GroceryProduct, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((it) => it.productId === product.id);
      if (found) {
        return prev.map((it) =>
          it.productId === product.id ? { ...it, quantity: it.quantity + qty } : it
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          price: product.price,
          quantity: qty,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((it) => it.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, quantity: qty } : it))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const clear = () => setItems([]);

  const replaceItems = (next: CartItem[]) => setItems(next);

  const totalItems = items.reduce((acc, it) => acc + it.quantity, 0);
  const totalPrice = items.reduce(
    (acc, it) => acc + Number(it.price) * it.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalPrice, addItem, updateQuantity, removeItem, clear, replaceItems }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useGroceryCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useGroceryCart must be used within GroceryCartProvider");
  }
  return ctx;
}
