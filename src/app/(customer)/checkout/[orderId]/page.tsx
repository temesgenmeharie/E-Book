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
} from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-red-700 font-semibold">{error || "Order not found"}</p>
        <Link href="/cart" className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Back to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Basket</span>
          </Link>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-slate-900">Secure Checkout</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b pb-4 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Order: {order.orderNumber}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{order.items.length} digital books included</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Amount</span>
              <span className="text-2xl font-black text-slate-900">
                {order.totalAmount} {order.currency}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3">Select Payment Gateway</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedProvider("CHAPA")}
                className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  selectedProvider === "CHAPA"
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Smartphone className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Chapa (Ethiopia)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Telebirr, CBE Birr, Awash, Cards</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider("MANUAL_TEST")}
                className={`p-4 rounded-xl border text-left flex items-start space-x-3 transition-all ${
                  selectedProvider === "MANUAL_TEST"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <CheckCircle2 className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Instant Sandbox Test</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Simulate successful server settlement</p>
                </div>
              </button>
            </div>
          </div>

          {/* Items Review */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">
              Purchased Titles
            </h4>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between text-sm">
                  <div>
                    <span className="font-semibold text-slate-900">{item.bookTitleSnapshot}</span>
                    <span className="text-xs text-slate-500 block">By {item.authorNameSnapshot}</span>
                  </div>
                  <span className="font-bold text-slate-800">
                    {item.priceSnapshot} {order.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {paying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                <span>
                  Pay {order.totalAmount} {order.currency} & Get Access
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

