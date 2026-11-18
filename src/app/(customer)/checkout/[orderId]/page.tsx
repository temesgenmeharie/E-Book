"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Smartphone,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "@/frontend/components/navigation/Navbar";
import { Footer } from "@/frontend/components/navigation/Footer";

interface OrderDetail {
  id: string;
  orderNumber: string;
  totalAmount: string;
  currency: string;
  status: string;
  items: {
    id: string;
    bookTitleSnapshot: string;
    authorNameSnapshot: string;
    priceSnapshot: string;
  }[];
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<"CHAPA" | "TELEBIRR" | "STRIPE" | "MANUAL_TEST">("CHAPA");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) throw new Error("Order not found or access denied");
        const data = await res.json();
        setOrder(data.order);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (orderId) loadOrder();
  }, [orderId]);

  async function handlePay() {
    if (!order) return;
    setPaying(true);
    setError(null);

    try {
      if (selectedProvider === "MANUAL_TEST") {
        // Trigger simulated test webhook directly
        const res = await fetch("/api/webhooks/payment/manual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            amount: order.totalAmount,
            currency: order.currency,
            providerReference: `MANUAL_${Date.now()}`,
          }),
        });
        if (!res.ok) throw new Error("Sandbox payment execution failed");

        router.push("/library");
        router.refresh();
        return;
      }

      // Live / Sandbox gateway initialization
      const initRes = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          provider: selectedProvider,
        }),
      });

      const initData = await initRes.json();
      if (!initRes.ok) throw new Error(initData.detail || "Payment initialization failed");

      // Redirect user to gateway
      window.location.href = initData.redirectUrl;
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          <p className="text-secondaryText text-xs mt-3">Preparing secure checkout session...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h2 className="font-serif text-2xl font-bold text-navy-900">Order Not Found</h2>
          <p className="text-sm text-secondaryText mt-1.5 leading-relaxed">
            {error || "We were unable to locate your active checkout order."}
          </p>
          <Link
            href="/cart"
            className="mt-6 px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-xs shadow-xs hover:bg-navy-800 transition"
          >
            &larr; Return to Shopping Cart
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondaryText hover:text-navy-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>&larr; Return to Shopping Basket</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-white px-3 py-1 rounded-lg border border-borderBase">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit Encrypted Checkout</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-borderBase p-6 sm:p-8 shadow-xs space-y-8">
          {/* Order Header */}
          <div className="border-b border-borderBase pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold-600">
                Order Review
              </span>
              <h1 className="font-serif text-2xl font-bold text-navy-900 mt-0.5">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-secondaryText mt-0.5">
                {order.items.length} {order.items.length === 1 ? "digital edition" : "digital editions"} ready for settlement
              </p>
            </div>

            <div className="text-left sm:text-right bg-ivory-50 sm:bg-transparent p-4 sm:p-0 rounded-xl border sm:border-0 border-borderBase">
              <span className="text-xs font-semibold text-secondaryText block">Total Amount</span>
              <span className="font-serif text-3xl font-black text-navy-900">
                {order.totalAmount} <span className="text-xs font-sans font-bold text-slate-500">{order.currency}</span>
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-bold text-navy-900">
              Select Payment Gateway
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedProvider("CHAPA")}
                className={`p-5 rounded-xl border text-left flex items-start gap-4 transition-all ${
                  selectedProvider === "CHAPA"
                    ? "border-navy-900 bg-ivory-50 ring-2 ring-navy-900/10 shadow-xs"
                    : "border-borderBase hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-navy-900">Chapa (Ethiopia)</h4>
                  <p className="text-xs text-secondaryText mt-0.5 leading-snug">
                    Telebirr, CBE Birr, Awash Bank & Local Debit Cards.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded">
                    Instant Birr Settlement
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("MANUAL_TEST")}
                className={`p-5 rounded-xl border text-left flex items-start gap-4 transition-all ${
                  selectedProvider === "MANUAL_TEST"
                    ? "border-navy-900 bg-ivory-50 ring-2 ring-navy-900/10 shadow-xs"
                    : "border-borderBase hover:border-slate-300 bg-white"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-navy-900">Instant Sandbox Test</h4>
                  <p className="text-xs text-secondaryText mt-0.5 leading-snug">
                    Simulate instant test settlement without real bank charges.
                  </p>
                  <span className="inline-block mt-2 text-[10px] font-bold text-navy-800 uppercase tracking-wider bg-navy-100/60 px-2 py-0.5 rounded">
                    Demo Mode
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Items Review */}
          <div className="border-t border-borderBase pt-6 space-y-3">
            <h4 className="font-serif text-base font-bold text-navy-900">
              Purchased Books ({order.items.length})
            </h4>
            <div className="divide-y divide-borderBase rounded-xl border border-borderBase bg-ivory-50/50 overflow-hidden">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-serif font-bold text-sm text-navy-900">{item.bookTitleSnapshot}</h5>
                    <p className="text-secondaryText font-medium mt-0.5">Author: {item.authorNameSnapshot}</p>
                  </div>
                  <span className="font-serif font-bold text-sm text-navy-900">
                    {item.priceSnapshot} {order.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-4 px-6 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gold-400" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 text-gold-400" />
                <span>
                  Confirm & Pay {order.totalAmount} {order.currency}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
