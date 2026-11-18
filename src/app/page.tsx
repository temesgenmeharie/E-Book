"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  BookOpen,
  Feather,
  ShieldCheck,
  CreditCard,
  Layers,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "@/frontend/components/navigation/Navbar";
import { Footer } from "@/frontend/components/navigation/Footer";
import { BookCard, BookCardData } from "@/frontend/components/books/BookCard";
import { BookCover } from "@/frontend/components/books/BookCover";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
  const [books, setBooks] = useState<BookCardData[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Load initial catalog data & categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [booksRes, catsRes] = await Promise.all([
          fetch(`/api/catalog/search?currency=${currency}`),
          fetch("/api/catalog/categories"),
        ]);

        if (booksRes.ok) {
          const booksData = await booksRes.json();
          setBooks(booksData.books || []);
        }

        if (catsRes.ok) {
          const catsData = await catsRes.json();
          setCategories(catsData.categories || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currency]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/catalog");
    }
  }

  // Filter specific curated sections from existing books
  const featuredBooks = books.slice(0, 4);
  const bestSellers = books.slice().reverse().slice(0, 4);
  const newArrivals = books.slice(0, 4);
  const ethiopianBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes("oromay") ||
      b.title.toLowerCase().includes("fikir") ||
      b.authorName.toLowerCase().includes("baalu") ||
      b.authorName.toLowerCase().includes("haddis") ||
      b.categories?.some((c) => c.category.slug.includes("ethiopian"))
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar active="home" activeCurrency={currency} onCurrencyChange={setCurrency} />

      {/* SECTION A: HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 text-white pt-12 pb-20 lg:pt-16 lg:pb-24 border-b border-navy-800">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D6A85F_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/15 border border-gold-400/30 text-gold-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>Premier Ethiopian & Global Digital Bookstore</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
                Discover Your Next <br />
                <span className="italic font-normal text-gold-400">Great Read</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Explore a curated world of knowledge, inspiration, and timeless stories. Instant access to PDF and EPUB editions across all your devices.
              </p>

              {/* Prominent Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-xl mx-auto lg:mx-0 flex items-center bg-white rounded-xl shadow-xl p-1.5 border border-slate-200"
              >
                <div className="pl-3 text-slate-400">
                  <Search className="w-5 h-5 text-navy-900" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, author, or keyword (e.g. Oromay, Habits)..."
                  className="w-full px-3 py-2 text-sm text-primaryText focus:outline-hidden placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs tracking-wide shadow-sm transition whitespace-nowrap"
                >
                  Search Books
                </button>
              </form>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/catalog"
                  className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-sm shadow-md transition flex items-center gap-2"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#categories"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition"
                >
                  Browse Categories
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Instant Delivery to Library</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-gold-400" />
                  <span>Pay with Telebirr, CBE & Stripe</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Book Display Showcase */}
            <div className="lg:col-span-5 hidden sm:flex justify-center items-center relative">
              <div className="relative w-[340px] h-[400px]">
                {/* Book 1 (Left Tilt) */}
                <div className="absolute left-0 top-12 w-48 -rotate-6 transform hover:rotate-0 hover:z-30 transition-all duration-300 shadow-2xl rounded-md">
                  <BookCover
                    coverUrl={books[0]?.coverImageKey || "/covers/oromay.svg"}
                    title={books[0]?.title || "Oromay"}
                    authorName={books[0]?.authorName || "Baalu Girma"}
                  />
                </div>

                {/* Book 2 (Center Hero Elevation) */}
                <div className="absolute left-20 top-0 w-52 z-20 hover:scale-105 transition-all duration-300 shadow-2xl rounded-md ring-2 ring-gold-400/40">
                  <BookCover
                    coverUrl={books[1]?.coverImageKey || "/covers/ddia.svg"}
                    title={books[1]?.title || "Designing Data-Intensive Applications"}
                    authorName={books[1]?.authorName || "Martin Kleppmann"}
                  />
                </div>

                {/* Book 3 (Right Tilt) */}
                <div className="absolute right-0 top-16 w-48 rotate-6 transform hover:rotate-0 hover:z-30 transition-all duration-300 shadow-2xl rounded-md">
                  <BookCover
                    coverUrl={books[2]?.coverImageKey || "/covers/atomic-habits.svg"}
                    title={books[2]?.title || "Atomic Habits"}
                    authorName={books[2]?.authorName || "James Clear"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: POPULAR CATEGORIES */}
      <section id="categories" className="py-16 bg-white border-b border-borderBase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold-600">Curated Genres</span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 mt-1">
                Explore by Category
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-navy-800 hover:text-gold-600 flex items-center gap-1 transition"
            >
              <span>View All Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/catalog?category=${cat.slug}`}
                className="group p-4 rounded-xl border border-borderBase bg-ivory-50 hover:bg-white hover:border-gold-400 hover:shadow-md transition-all duration-300 text-center flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-12 h-12 rounded-full bg-navy-900/5 group-hover:bg-gold-500/20 text-navy-900 group-hover:text-gold-600 flex items-center justify-center transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-primaryText group-hover:text-navy-900 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-secondaryText">Browse Titles</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION C: FEATURED BOOKS */}
      <section className="py-16 bg-surface border-b border-borderBase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold-600 mb-1">
                <Award className="w-4 h-4" />
                <span>Editor&apos;s Picks</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900">
                Featured Digital Books
              </h2>
            </div>
            <Link
              href="/catalog"
              className="text-sm font-semibold text-navy-900 hover:text-gold-600 flex items-center gap-1 transition"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl h-72 border border-borderBase" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} activeCurrency={currency} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION D & E: BEST SELLERS & NEW ARRIVALS DUAL SHOWCASE */}
      <section className="py-16 bg-white border-b border-borderBase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Best Sellers Column */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-gold-600" />
                  <h3 className="font-serif text-xl font-bold text-navy-900">Best Sellers</h3>
                </div>
                <Link href="/catalog?sort=best_selling" className="text-xs font-bold text-navy-800 hover:text-gold-600">
                  View More &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {bestSellers.slice(0, 2).map((book) => (
                  <BookCard key={book.id} book={book} activeCurrency={currency} />
                ))}
              </div>
            </div>

            {/* New Arrivals Column */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-serif text-xl font-bold text-navy-900">New Arrivals</h3>
                </div>
                <Link href="/catalog?sort=newest" className="text-xs font-bold text-navy-800 hover:text-gold-600">
                  View More &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {newArrivals.slice(0, 2).map((book) => (
                  <BookCard key={book.id} book={book} activeCurrency={currency} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F: ETHIOPIAN COLLECTION HIGHLIGHT */}
      <section className="py-16 bg-ivory-100/70 border-b border-borderBase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-navy-900 to-navy-950 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gold-500/10 rounded-l-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
                Heritage & Literature
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold mt-2 leading-tight">
                The Ethiopian Collection
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                Immerse yourself in celebrated Ethiopian classics, historical documentation, and contemporary voices published in Amharic, Afaan Oromoo, Tigrinya, and English.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/catalog?category=ethiopian-literature"
                  className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-sm shadow-md transition"
                >
                  Browse Ethiopian Literature
                </Link>
                <Link
                  href="/catalog"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition"
                >
                  Discover All Books
                </Link>
              </div>
            </div>

            {/* Embedded Grid of Ethiopian Books */}
            {ethiopianBooks.length > 0 && (
              <div className="mt-10 pt-10 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                {ethiopianBooks.map((b) => (
                  <Link
                    key={b.id}
                    href={`/books/${b.slug}`}
                    className="group bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-all flex flex-col justify-between"
                  >
                    <BookCover
                      coverUrl={b.coverImageKey}
                      title={b.title}
                      authorName={b.authorName}
                      aspectRatio="aspect-[1/1.4]"
                    />
                    <div className="mt-2.5">
                      <h4 className="font-serif font-bold text-xs text-white line-clamp-1 group-hover:text-gold-300 transition-colors">
                        {b.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {b.authorName}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION G: BECOME AN AUTHOR */}
      <section className="py-20 bg-white border-b border-borderBase">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Feather className="w-3.5 h-3.5 text-emerald-600" />
                <span>Author & Publisher Hub</span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900 leading-tight">
                Publish Once. Reach Readers Across Ethiopia & Globally.
              </h2>

              <p className="text-secondaryText text-sm sm:text-base leading-relaxed">
                Join our decentralized publishing ecosystem. Keep 85% of your sales revenue with transparent financial auditing, double-entry automated ledgers, and fast payouts via Telebirr or direct Ethiopian bank accounts.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-sm text-primaryText font-medium">
                    85% platform commission payout directly to Telebirr or CBE.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-sm text-primaryText font-medium">
                    Anti-piracy protected in-browser range streaming reader for EPUB and PDF.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    ✓
                  </div>
                  <span className="text-sm text-primaryText font-medium">
                    Automated real-time sales dashboard and customer reviews analytics.
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/seller/onboarding"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm shadow-md transition"
                >
                  <span>Start Selling Your Books</span>
                  <ArrowRight className="w-4 h-4 text-gold-400" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 bg-ivory-50 rounded-2xl border border-borderBase p-8 shadow-xs space-y-6">
              <h3 className="font-serif text-xl font-bold text-navy-900 border-b border-borderBase pb-3">
                Author Benefits & Transparent Terms
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-2xl font-serif font-black text-navy-900">85%</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Author Royalties</p>
                  <p className="text-[11px] text-slate-400 mt-1">Industry-leading payout on every digital copy.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-2xl font-serif font-black text-emerald-600">Instant</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Settlement</p>
                  <p className="text-[11px] text-slate-400 mt-1">Direct payout requests through your Author Studio.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-2xl font-serif font-black text-gold-600">2 Currencies</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">ETB & USD</p>
                  <p className="text-[11px] text-slate-400 mt-1">Set localized prices for domestic & diaspora buyers.</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <span className="text-2xl font-serif font-black text-navy-900">100% DRM</span>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Asset Security</p>
                  <p className="text-[11px] text-slate-400 mt-1">Private MinIO S3 object storage protection.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION H: NEWSLETTER */}
      <section className="py-14 bg-surface border-b border-borderBase">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-600">Stay Inspired</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900">
            Subscribe to Literary Updates & New Releases
          </h2>
          <p className="text-secondaryText text-sm max-w-lg mx-auto">
            Get curated recommendations, author interviews, and exclusive discounts delivered straight to your inbox.
          </p>

          {newsletterSubscribed ? (
            <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Thank you for subscribing! Check your inbox soon.</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newsletterEmail) setNewsletterSubscribed(true);
              }}
              className="max-w-md mx-auto flex gap-2 pt-2"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address..."
                className="w-full rounded-xl border border-borderBase bg-white px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs whitespace-nowrap shadow-xs transition"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
