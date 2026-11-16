"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface PayoutItem {
  id: string;
  payoutNumber: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  seller: {
    businessName: string;
    sellerType: string;
    user: { email: string };
  };
  payoutAccount: {
    provider: string;
    accountHolder: string;
    accountNumber: string;
    bankName: string | null;
  };
}

export default function AdminFinancePage() {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [proof, setProof] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadPayouts() {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/payouts");
      if (!res.ok) throw new Error("Failed to load payouts queue");
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayouts();
  }, []);

  async function handleApprove(payoutId: string) {
    if (!proof.trim()) {
      alert("Please provide a transaction reference or proof code.");
      return;
    }

    try {
      const res = await fetch(`/api/finance/payouts/${payoutId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionProof: proof }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Approval failed");
      }

      setApprovingId(null);
      setProof("");
      loadPayouts();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Banknote className="h-7 w-7 text-emerald-600" />
            <span className="font-bold text-lg text-slate-900">Finance & Settlement Desk</span>
          </div>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pending Seller Payouts</h1>
            <p className="text-sm text-slate-500">
              Verify bank accounts and disburse net author royalties.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {payouts.length} Withdrawal Requests
          </span>
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
        ) : payouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">All Payouts Disbursed!</h3>
            <p className="text-sm text-slate-500 mt-1">There are no pending seller withdrawal requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {payouts.map((p) => (
              <div
                key={p.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-500">{p.payoutNumber}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                      Pending Approval
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {p.amount} {p.currency}
                  </h3>

                  <p className="text-sm text-slate-600 mt-0.5">
                    Seller: <span className="font-semibold text-slate-800">{p.seller.businessName}</span> ({p.seller.user.email})
                  </p>

                  <div className="mt-2 text-xs text-slate-500 flex flex-wrap gap-4">
                    <span>
                      Method: <strong className="text-slate-700">{p.payoutAccount.provider}</strong>
                    </span>
                    <span>
                      Holder: <strong className="text-slate-700">{p.payoutAccount.accountHolder}</strong>
                    </span>
                    <span>
                      Account: <strong className="text-slate-700 font-mono">{p.payoutAccount.accountNumber}</strong>
                    </span>
                    {p.payoutAccount.bankName && (
                      <span>
                        Bank: <strong className="text-slate-700">{p.payoutAccount.bankName}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  {approvingId === p.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        placeholder="Bank ref / Proof code"
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-500"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setApprovingId(null)}
                        className="px-2 py-1.5 text-slate-500 text-xs hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setApprovingId(p.id)}
                      className="w-full md:w-auto px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 shadow-xs"
                    >
                      Process & Disburse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

