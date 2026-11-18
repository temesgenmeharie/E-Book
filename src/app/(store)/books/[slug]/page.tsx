"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Star,
  ShoppingCart,
  ShieldCheck,
  Download,
  Eye,
  Loader2,
  Check,
  Heart,
  Share2,
  CheckCircle2,
  Lock,
  Globe,
  FileText,
  UserCheck,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/frontend/components/navigation/Navbar";
import { Footer } from "@/frontend/components/navigation/Footer";
import { BookCover } from "@/frontend/components/books/BookCover";

interface BookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  authorName: string;
  coverImageKey?: string | null;
  language: string;
  createdAt?: string;
  seller: {
    id: string;
    businessName: string;
    bio: string | null;
    sellerType: string;
  };
  categories: { category: { name: string; slug: string } }[];
  prices: { currency: string; amount: string }[];
  files: { format: string; sizeBytes: string }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { fullName: string };
  }[];
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`/api/catalog/books/slug/${slug}`);
        if (!res.ok) throw new Error("Book not found");
        const data = await res.json();
        setBook(data.book);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchBook();
  }, [slug]);

  async function handleAddToCart(shouldRedirectToCart = false) {
    if (!book) return;
    setAddingToCart(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
      }

      setAdded(true);
      if (shouldRedirectToCart) {
        router.push("/cart");
      } else {
        setTimeout(() => setAdded(false), 2500);
      }
    } catch {
      // ignore
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar activeCurrency={currency} onCurrencyChange={setCurrency} />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-gold-500" />
          <p className="text-secondaryText text-xs mt-3">Loading book edition...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar activeCurrency={currency} onCurrencyChange={setCurrency} />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-ivory-200 flex items-center justify-center mb-4 text-slate-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-navy-900">Book Not Found</h2>
          <p className="text-sm text-secondaryText mt-1.5 leading-relaxed">
            This digital edition might have been moved, unlisted, or is currently undergoing catalog moderation.
          </p>
          <Link
            href="/catalog"
            className="mt-6 px-6 py-2.5 rounded-xl bg-navy-900 text-white font-semibold text-xs shadow-xs hover:bg-navy-800 transition"
          >
            &larr; Return to Bookstore Catalog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const activePrice =
    book.prices.find((p) => p.currency === currency) ||
    book.prices[0] || { currency, amount: "0.00" };

  const averageRating =
    book.reviews.length > 0
      ? (book.reviews.reduce((acc, r) => acc + r.rating, 0) / book.reviews.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar activeCurrency={currency} onCurrencyChange={setCurrency} />

      {/* BREADCRUMB NAVIGATION */}
      <div className="bg-white border-b border-borderBase py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium text-secondaryText">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <Link href="/" className="hover:text-navy-900 transition">Home</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-navy-900 transition">Catalog</Link>
            <span>/</span>
            {book.categories[0] && (
              <>
                <Link
                  href={`/catalog?category=${book.categories[0].category.slug}`}
                  className="hover:text-navy-900 transition"
                >
                  {book.categories[0].category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-navy-900 font-bold truncate max-w-[200px] sm:max-w-none">{book.title}</span>
          </div>

          <Link
            href="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 text-navy-900 hover:text-gold-600 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Books</span>
          </Link>
        </div>
      </div>

      {/* MAIN PRODUCT SHOWCASE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* LEFT COLUMN: Cover & Reading Actions */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-borderBase p-6 sm:p-8 shadow-xs flex flex-col items-center">
              <div className="w-full max-w-[320px] shadow-2xl rounded-md transition-transform duration-300 hover:scale-[1.02]">
                <BookCover
                  coverUrl={book.coverImageKey}
                  title={book.title}
                  authorName={book.authorName}
                />
              </div>

              {/* Sample Reading & Actions */}
              <div className="w-full mt-6 space-y-3">
                <Link
                  href={`/read/${book.id}`}
                  className="w-full py-3 px-4 rounded-xl bg-ivory-100 hover:bg-ivory-200 border border-borderBase text-navy-900 font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition"
                >
                  <Eye className="w-4 h-4 text-gold-600" />
                  <span>Preview & Sample Reader</span>
                </Link>

                <div className="flex gap-2">
                  <button
                    onClick={() => setWishlisted(!wishlisted)}
                    className="flex-1 py-2 px-3 rounded-lg border border-borderBase text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                  >
                    <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                    <span>{wishlisted ? "Saved" : "Wishlist"}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: book.title, url: window.location.href });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Link copied to clipboard!");
                      }
                    }}
                    className="py-2 px-3 rounded-lg border border-borderBase text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition"
                  >
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Verified Seller / Publisher Profile Card */}
            <div className="bg-white rounded-xl border border-borderBase p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900/10 text-navy-900 flex items-center justify-center font-bold text-sm">
                  {book.seller.businessName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs text-navy-900">{book.seller.businessName}</h4>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Verified {book.seller.sellerType.replace("_", " ")}
                  </span>
                </div>
              </div>
              {book.seller.bio && (
                <p className="mt-3 text-xs text-secondaryText leading-relaxed">
                  {book.seller.bio}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Bibliographic Details & Purchasing */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              {/* Category Badges */}
              <div className="flex flex-wrap gap-2 mb-3">
                {book.categories.map((c, i) => (
                  <Link
                    key={i}
                    href={`/catalog?category=${c.category.slug}`}
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gold-500/15 text-gold-700 hover:bg-gold-500/25 transition border border-gold-400/30"
                  >
                    {c.category.name}
                  </Link>
                ))}
              </div>

              {/* Title & Subtitle */}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy-900 tracking-tight leading-tight">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-base sm:text-lg font-serif italic text-slate-500 mt-1">
                  {book.subtitle}
                </p>
              )}

              {/* Author */}
              <p className="mt-3 text-sm text-slate-600">
                Authored by{" "}
                <span className="font-bold text-navy-900 underline decoration-gold-400/60 underline-offset-4">
                  {book.authorName}
                </span>
              </p>

              {/* Ratings */}
              <div className="mt-4 flex items-center gap-3 pb-6 border-b border-borderBase">
                <div className="flex items-center gap-1 text-gold-500">
                  <Star className="w-4 h-4 fill-gold-500" />
                  <span className="font-bold text-sm text-navy-900">
                    {averageRating ? averageRating : "Unrated"}
                  </span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-secondaryText">
                  {book.reviews.length} {book.reviews.length === 1 ? "Customer Review" : "Customer Reviews"}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Verified Edition
                </span>
              </div>
            </div>

            {/* PRICING & PURCHASE BOX */}
            <div className="bg-ivory-50 rounded-2xl border border-borderBase p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Digital Edition License
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-3xl sm:text-4xl font-black text-navy-900">
                      {activePrice.amount}
                    </span>
                    <span className="text-sm font-bold text-slate-600">{activePrice.currency}</span>
                  </div>
                </div>

                {/* Currency Switcher */}
                <div className="flex items-center bg-white rounded-xl p-1 border border-borderBase text-xs font-bold shadow-xs">
                  <button
                    onClick={() => setCurrency("ETB")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      currency === "ETB" ? "bg-navy-900 text-white shadow-xs" : "text-slate-600 hover:text-navy-900"
                    }`}
                  >
                    ETB (ብር)
                  </button>
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      currency === "USD" ? "bg-navy-900 text-white shadow-xs" : "text-slate-600 hover:text-navy-900"
                    }`}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              {/* Format Availability */}
              <div className="pt-3 border-t border-slate-200/60 flex flex-wrap gap-2 text-xs">
                <span className="text-secondaryText font-medium">Included Formats:</span>
                {book.files.map((f, i) => (
                  <span
                    key={i}
                    className="font-bold px-2 py-0.5 rounded bg-white text-navy-900 border border-slate-200 shadow-xs"
                  >
                    {f.format} ({Math.round(parseInt(f.sizeBytes || "0") / 1024)} KB)
                  </span>
                ))}
              </div>

              {/* Purchase Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleAddToCart(false)}
                  disabled={addingToCart}
                  className={`py-3.5 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition ${
                    added
                      ? "bg-emerald-600 text-white"
                      : "bg-navy-900 hover:bg-navy-800 text-white"
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 text-gold-400" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleAddToCart(true)}
                  disabled={addingToCart}
                  className="py-3.5 px-6 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Payment Security Assurance */}
              <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Checkout</span>
                </div>
                <span>•</span>
                <span>Telebirr, CBE & Stripe</span>
                <span>•</span>
                <span>Instant Library Access</span>
              </div>
            </div>

            {/* SYNOPSIS & DESCRIPTION */}
            <div className="space-y-3 pt-4">
              <h3 className="font-serif text-xl font-bold text-navy-900">About this Book</h3>
              <div className="text-sm text-primaryText leading-relaxed whitespace-pre-line bg-white p-6 rounded-xl border border-borderBase">
                {book.description}
              </div>
            </div>

            {/* SPECIFICATIONS TABLE */}
            <div className="space-y-3 pt-4">
              <h3 className="font-serif text-xl font-bold text-navy-900">Book Details & Specifications</h3>
              <div className="bg-white rounded-xl border border-borderBase overflow-hidden shadow-xs">
                <div className="divide-y divide-borderBase text-xs">
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="font-bold text-slate-500">Primary Language</span>
                    <span className="col-span-2 text-navy-900 font-semibold uppercase">{book.language}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 bg-ivory-50/50">
                    <span className="font-bold text-slate-500">Digital Formats</span>
                    <span className="col-span-2 text-navy-900 font-semibold">
                      {book.files.map((f) => f.format).join(" & ")}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="font-bold text-slate-500">Publisher</span>
                    <span className="col-span-2 text-navy-900 font-semibold">{book.seller.businessName}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5 bg-ivory-50/50">
                    <span className="font-bold text-slate-500">Delivery Method</span>
                    <span className="col-span-2 text-emerald-700 font-semibold">
                      Instant Download & In-Browser Range Reader
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOMER REVIEWS */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between pb-2 border-b border-borderBase">
                <h3 className="font-serif text-xl font-bold text-navy-900">
                  Customer Reviews ({book.reviews.length})
                </h3>
              </div>

              {book.reviews.length === 0 ? (
                <div className="bg-white rounded-xl border border-borderBase p-8 text-center">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-xs text-navy-900">No reviews yet</p>
                  <p className="text-secondaryText text-[11px] mt-0.5">
                    Be the first reader to purchase and review this digital edition.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {book.reviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-xl border border-borderBase p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-navy-900">{rev.user.fullName}</span>
                        <div className="flex items-center text-gold-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? "fill-gold-500 text-gold-500" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment && (
                        <p className="text-xs text-secondaryText leading-relaxed">
                          {rev.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
