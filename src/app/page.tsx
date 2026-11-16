import Link from "next/link";
import { BookOpen, ShieldCheck, CreditCard, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-7 w-7 text-emerald-600" />
            <span className="font-bold text-xl tracking-tight text-slate-900">
              E-Book Marketplace
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/catalog"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 mb-8">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Production-Ready Multi-Vendor Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl">
          Empowering Authors & Publishers to Sell Digital Books Worldwide
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl">
          A secure multi-vendor digital publishing platform with local & international payment gateways, in-browser EPUB/PDF readers, and automated financial ledgers.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            href="/catalog"
            className="rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-500 transition-all"
          >
            Explore Books
          </Link>
          <Link
            href="/seller/onboarding"
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
          >
            Become a Seller
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl text-left">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <CreditCard className="h-8 w-8 text-emerald-600 mb-4" />
            <h3 className="font-semibold text-slate-900 text-lg">Multi-Currency & Gateways</h3>
            <p className="mt-2 text-sm text-slate-600">
              Native integration with Telebirr, CBE Birr, and Chapa for Ethiopia, plus Stripe and PayPal for international readers.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <BookOpen className="h-8 w-8 text-emerald-600 mb-4" />
            <h3 className="font-semibold text-slate-900 text-lg">In-Browser Reader & Formats</h3>
            <p className="mt-2 text-sm text-slate-600">
              Read EPUB and PDF directly in the browser with range-streamed delivery, reading progress, and bookmarks.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-emerald-600 mb-4" />
            <h3 className="font-semibold text-slate-900 text-lg">Immutable Financial Ledger</h3>
            <p className="mt-2 text-sm text-slate-600">
              Automated commission splitting, verified payouts, and zero data leakage with double-entry accounting principles.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} E-Book Marketplace. Built with Next.js, PostgreSQL, MinIO, and Prisma.</p>
      </footer>
    </div>
  );
}

