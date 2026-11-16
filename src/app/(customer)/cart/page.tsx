"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Trash2,
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  Loader2,
  ShieldCheck,
} from "lucide-react";

interface CartItem {
  id: string;
  bookId: string;
  title: string;
  authorName: string;
  sellerName: string;
  currency: string;
  priceAmount: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState("0.00");
  const [currency, setCurrency] = useState("ETB");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCart() {
    try {
      setLoading(true);
      const res = await fetch(`/api/cart?currency=${currency}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        throw new Error("Failed to load cart");
      }
      const data = await res.json();
      setItems(data.cart.items || []);
      setTotal(data.cart.totalAmount || "0.00");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, [currency]);

  async function removeItem(bookId: string) {
    try {
      await fetch(`/api/cart/items/${bookId}`, { method: "DELETE" });
      loadCart();
    } catch {
      // ignore
    }
  }

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);

    try {
      const res = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Checkout failed");
      }

      router.push(`/checkout/${data.order.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/catalog"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-slate-900">Your Shopping Basket</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
            <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Your basket is empty</h3>
            <p className="text-sm text-slate-500 mt-1">Discover bestselling digital books from our catalog.</p>
            <Link
              href="/catalog"
              className="mt-6 inline-block bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-500 shadow-xs"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Items Column */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs">
                {items.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">By {item.authorName}</p>
                      <span className="text-[10px] text-slate-400 font-medium">Published by {item.sellerName}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="font-bold text-sm text-slate-900">
                        {item.priceAmount} {item.currency}
                      </span>
                      <button
                        onClick={() => removeItem(item.bookId)}
                        className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Column */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-md">Order Summary</h3>

                <div className="space-y-2 text-sm text-slate-600 border-b pb-4">
                  <div className="flex justify-between">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="font-semibold text-slate-900">
                      {total} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Digital Instant Delivery</span>
                    <span>Free</span>
                  </div>
                </div>

                <div className="flex justify-between text-base font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>
                    {total} {currency}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-all shadow-xs flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {checkingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Proceed to Checkout</span>
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500 text-center">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Secure 256-bit encrypted checkout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
