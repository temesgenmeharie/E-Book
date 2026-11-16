"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, User, Building, AlertCircle, Loader2 } from "lucide-react";

export default function SellerOnboardingPage() {
  const router = useRouter();
  const [sellerType, setSellerType] = useState<"INDIVIDUAL_AUTHOR" | "PUBLISHER">("INDIVIDUAL_AUTHOR");
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [taxId, setTaxId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/sellers/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerType,
          businessName,
          bio,
          websiteUrl: websiteUrl || undefined,
          taxId: taxId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Onboarding failed. Please review your details.");
      }

      router.push("/seller/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during onboarding.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <BookOpen className="h-7 w-7 text-emerald-600" />
            <span className="font-bold text-lg text-slate-900">E-Book Marketplace</span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Start Selling Digital Books</h2>
          <p className="mt-2 text-sm text-slate-600">
            Publish your books to readers worldwide and in Ethiopia with transparent earnings and automated payouts.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Seller Category
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSellerType("INDIVIDUAL_AUTHOR")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  sellerType === "INDIVIDUAL_AUTHOR"
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <User className="h-6 w-6 text-emerald-600 mb-2" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">Individual Author</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Publish your own original books</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSellerType("PUBLISHER")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  sellerType === "PUBLISHER"
                    ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <Building className="h-6 w-6 text-emerald-600 mb-2" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">Publishing House</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Manage multiple authors & catalog</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              {sellerType === "INDIVIDUAL_AUTHOR" ? "Author Pen Name / Full Name" : "Company / Press Name"}
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder={sellerType === "INDIVIDUAL_AUTHOR" ? "e.g. Haddis Alemayehu" : "e.g. Kuraz Publishing Agency"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Biography / Description</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              placeholder="Tell readers about your background, genre, and published works..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Website / Portfolio URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Tax Identification / TIN (Optional)</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="TIN number"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Seller Registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

