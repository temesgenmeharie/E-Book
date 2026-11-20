"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, User, Building, AlertCircle, Loader2, ArrowRight } from "lucide-react";

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
          businessName: businessName.trim(),
          bio: bio.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          taxId: taxId.trim() || undefined,
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
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-2xl mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-borderBase shadow-md" style={{ maxWidth: "680px" }}>
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-600 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-2xl text-navy-900">
              E-Book<span className="text-gold-600 font-sans font-semibold text-xl ml-1">Marketplace</span>
            </span>
          </Link>
          <h1 className="mt-5 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-navy-900">
            Author &amp; Publisher Studio
          </h1>
          <p className="mt-1.5 text-xs text-secondaryText max-w-md mx-auto">
            Distribute your digital books to readers worldwide and in Ethiopia with transparent royalties and automated payouts.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Publishing Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSellerType("INDIVIDUAL_AUTHOR")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition ${
                  sellerType === "INDIVIDUAL_AUTHOR"
                    ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-900/10 shadow-xs"
                    : "border-borderBase hover:border-slate-300 bg-white"
                }`}
              >
                <User className={`h-6 w-6 mb-3 ${sellerType === "INDIVIDUAL_AUTHOR" ? "text-navy-900" : "text-slate-400"}`} />
                <div>
                  <h4 className="font-serif font-bold text-sm text-navy-900">Individual Author</h4>
                  <p className="text-xs text-secondaryText mt-0.5">Publish your own manuscripts and retain 80%+ royalties.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSellerType("PUBLISHER")}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition ${
                  sellerType === "PUBLISHER"
                    ? "border-navy-900 bg-navy-50/50 ring-2 ring-navy-900/10 shadow-xs"
                    : "border-borderBase hover:border-slate-300 bg-white"
                }`}
              >
                <Building className={`h-6 w-6 mb-3 ${sellerType === "PUBLISHER" ? "text-navy-900" : "text-slate-400"}`} />
                <div>
                  <h4 className="font-serif font-bold text-sm text-navy-900">Publishing House</h4>
                  <p className="text-xs text-secondaryText mt-0.5">Manage multiple authors, catalog imprints, and distribution.</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {sellerType === "INDIVIDUAL_AUTHOR" ? "Author Pen Name / Full Name" : "Company / Press Name"} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
              placeholder={sellerType === "INDIVIDUAL_AUTHOR" ? "e.g. Haddis Alemayehu" : "e.g. Kuraz Publishing Agency"}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Biography / Editorial Mission
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
              placeholder="Tell readers about your literary background, genre specialties, and published titles..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Website / Portfolio <span className="text-xs font-normal text-secondaryText lowercase">(optional)</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tax ID / TIN <span className="text-xs font-normal text-secondaryText lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                placeholder="10-digit TIN number"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl shadow-xs text-xs font-bold uppercase tracking-wider text-white bg-navy-900 hover:bg-navy-800 focus:outline-hidden transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <span>Complete Author Studio Onboarding</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-borderBase text-center">
          <Link
            href="/catalog"
            className="text-xs text-secondaryText hover:text-navy-900 font-semibold"
          >
            &larr; Return to Public Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
