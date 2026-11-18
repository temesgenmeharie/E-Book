"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trash2,
  ArrowLeft,
  CreditCard,
  ShoppingBag,
  Loader2,
  ShieldCheck,
  Lock,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { Footer } from "../../components/navigation/Footer";
import { BookCover } from "../../components/books/BookCover";

interface CartItem {
  id: string;
  bookId: string;
  title: string;
  authorName: string;
  sellerName: string;
  currency: string;
  priceAmount: string;
}

export function CartView() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState("0.00");
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
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
  }, [currency, router]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

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
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        active="cart"
        activeCurrency={currency}
        onCurrencyChange={(newCur) => setCurrency(newCur)}
      />

      <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondaryText hover:text-navy-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&larr; Continue Exploring Books</span>
          </Link>

          {/* Currency Switcher */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-borderBase text-xs font-bold shadow-xs">
            <button
              onClick={() => setCurrency("ETB")}
              className={`px-2.5 py-1 rounded transition-all ${
                currency === "ETB" ? "bg-navy-900 text-white" : "text-slate-600 hover:text-navy-900"
              }`}
            >
              ETB (ብር)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2.5 py-1 rounded transition-all ${
                currency === "USD" ? "bg-navy-900 text-white" : "text-slate-600 hover:text-navy-900"
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            <p className="text-secondaryText text-xs mt-3">Retrieving your reading cart...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-borderBase p-16 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-ivory-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-navy-900">Your Cart is Empty</h2>
            <p className="text-sm text-secondaryText mt-1.5 leading-relaxed">
              You haven&apos;t added any digital books to your reading cart yet. Discover acclaimed Ethiopian literature, software engineering manuals, and international bestsellers.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
            >
              <span>Explore Bookstore</span>
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-borderBase p-6 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-borderBase">
                  <h2 className="font-serif text-xl font-bold text-navy-900">
                    Shopping Cart ({items.length} {items.length === 1 ? "Book" : "Books"})
                  </h2>
                  <span className="text-xs font-semibold text-secondaryText">Digital Deliveries</span>
                </div>

                <div className="divide-y divide-borderBase">
                  {items.map((item) => (
                    <div key={item.id} className="py-5 flex items-start gap-4 sm:gap-6">
                      <div className="w-20 sm:w-24 shrink-0 shadow-sm rounded-md overflow-hidden">
                        <BookCover
                          title={item.title}
                          authorName={item.authorName}
                          aspectRatio="aspect-[1/1.4]"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between self-stretch">
                        <div>
                          <h3 className="font-serif font-bold text-base text-navy-900 leading-snug">
                            {item.title}
                          </h3>
                          <p className="text-xs text-secondaryText mt-0.5 font-medium">
                            {item.authorName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Publisher: {item.sellerName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                          <button
                            onClick={() => removeItem(item.bookId)}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>

                          <div className="font-serif font-bold text-base text-navy-900">
                            {item.priceAmount} <span className="text-xs font-sans text-slate-500">{item.currency}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl border border-borderBase p-6 shadow-xs space-y-5">
                <h3 className="font-serif text-lg font-bold text-navy-900 border-b border-borderBase pb-3">
                  Order Summary
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-secondaryText">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-primaryText">
                      {total} {currency}
                    </span>
                  </div>
                  <div className="flex justify-between text-secondaryText">
                    <span>Digital Delivery</span>
                    <span className="font-semibold text-emerald-600 uppercase text-xs">Free / Instant</span>
                  </div>
                  <div className="pt-3 border-t border-borderBase flex justify-between items-baseline">
                    <span className="font-serif font-bold text-base text-navy-900">Total Due</span>
                    <span className="font-serif font-black text-2xl text-navy-900">
                      {total} <span className="text-xs font-sans font-bold text-slate-500">{currency}</span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full py-3.5 px-6 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4 text-gold-400" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit SSL Encrypted Payment</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Supported: Telebirr, CBE Birr, Chapa, Stripe. Digital entitlement granted immediately after payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
