"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  DollarSign,
  Clock,
  CheckCircle,
  PlusCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface DashboardData {
  metrics: {
    sellerId: string;
    sellerType: string;
    businessName: string;
    verificationStatus: "UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
    financials: {
      availableBalance: string;
      pendingBalance: string;
      lifetimeEarnings: string;
    };
    catalog: {
      totalBooks: number;
      publishedBooks: number;
      inReviewBooks: number;
      draftBooks: number;
    };
  };
}

export default function SellerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await fetch("/api/sellers/dashboard");
        if (!res.ok) {
          if (res.status === 404) {
            window.location.href = "/seller/onboarding";
            return;
          }
          throw new Error("Failed to load seller dashboard metrics");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load metrics");
        }
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 max-w-md text-center">
          <p className="text-red-700 font-semibold">{error || "Could not load dashboard"}</p>
          <Link
            href="/seller/onboarding"
            className="mt-4 inline-block bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Go to Onboarding
          </Link>
        </div>
      </div>
    );
  }

  const { metrics } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-7 w-7 text-emerald-600" />
            <span className="font-bold text-lg text-slate-900">Seller Studio</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
              {metrics.sellerType === "PUBLISHER" ? "Publisher" : "Author"}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/seller/books/new"
              className="inline-flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-500 transition-all shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Publish New Book</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Alert */}
        {metrics.verificationStatus === "UNVERIFIED" && (
          <div className="mb-8 rounded-xl bg-amber-50 p-4 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <span className="font-semibold">Account Unverified:</span> Upload your national ID or trade license to unlock payout withdrawals.
              </div>
            </div>
            <Link
              href="/seller/verification"
              className="text-sm font-semibold text-amber-900 underline hover:text-amber-700"
            >
              Verify Now &rarr;
            </Link>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{metrics.businessName}</h1>
          <p className="text-sm text-slate-500">Track your book sales, commissions, and publishing status in real-time.</p>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
              <span>Available for Payout</span>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.financials.availableBalance} <span className="text-sm font-normal text-slate-500">ETB</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Cleared funds eligible for immediate withdrawal</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
              <span>Pending Clearance</span>
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.financials.pendingBalance} <span className="text-sm font-normal text-slate-500">ETB</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">7-day chargeback holding window</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
              <span>Lifetime Net Earnings</span>
              <TrendingUp className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {metrics.financials.lifetimeEarnings} <span className="text-sm font-normal text-slate-500">ETB</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Total net revenue after 15% platform commission</p>
          </div>
        </div>

        {/* Catalog Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Catalog Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 text-center">
              <span className="block text-2xl font-bold text-slate-900">{metrics.catalog.totalBooks}</span>
              <span className="text-xs text-slate-500 font-medium">Total Listings</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 text-center">
              <span className="block text-2xl font-bold text-emerald-700">{metrics.catalog.publishedBooks}</span>
              <span className="text-xs text-emerald-600 font-medium">Published & Live</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 text-center">
              <span className="block text-2xl font-bold text-amber-700">{metrics.catalog.inReviewBooks}</span>
              <span className="text-xs text-amber-600 font-medium">In Moderation</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 text-center">
              <span className="block text-2xl font-bold text-slate-700">{metrics.catalog.draftBooks}</span>
              <span className="text-xs text-slate-500 font-medium">Drafts</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
