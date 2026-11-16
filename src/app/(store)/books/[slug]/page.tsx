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
} from "lucide-react";

interface BookDetail {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  authorName: string;
  coverImageKey?: string | null;
  language: string;
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

  async function handleAddToCart() {
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
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // ignore
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-800">Book Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">This book may have been unlisted or is awaiting moderation.</p>
        <Link
          href="/catalog"
          className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const price = book.prices.find((p) => p.currency === currency) || book.prices[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/catalog"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Catalog</span>
          </Link>

          <div className="flex items-center bg-white border rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setCurrency("ETB")}
              className={`px-2 py-1 rounded ${
                currency === "ETB" ? "bg-emerald-600 text-white" : "text-slate-600"
              }`}
            >
              ETB
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2 py-1 rounded ${
                currency === "USD" ? "bg-emerald-600 text-white" : "text-slate-600"
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cover Column */}
          <div className="md:col-span-1">
            <div className="aspect-[3/4] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 relative overflow-hidden shadow-inner">
              {book.coverImageKey && (book.coverImageKey.startsWith("http") || book.coverImageKey.startsWith("/")) ? (
                <img
                  src={book.coverImageKey}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="h-16 w-16 text-slate-300" />
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Available Formats:</span>
                <span className="font-semibold text-slate-700">
                  {book.files.map((f) => f.format).join(", ")}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Language:</span>
                <span className="font-semibold text-slate-700 uppercase">{book.language}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Seller:</span>
                <span className="font-semibold text-slate-700">{book.seller.businessName}</span>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {book.categories.map((c, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700"
                  >
                    {c.category.name}
                  </span>
                ))}
              </div>

              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{book.title}</h1>
              {book.subtitle && <p className="text-lg text-slate-500 mt-1">{book.subtitle}</p>}
              <p className="text-sm font-semibold text-slate-700 mt-2">
                By <span className="text-emerald-700">{book.authorName}</span>
              </p>

              {/* Price Banner */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Digital Edition</span>
                  <span className="text-3xl font-extrabold text-slate-900">
                    {price?.amount} <span className="text-sm font-normal text-slate-500">{price?.currency}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-all shadow-sm flex items-center space-x-2"
                  >
                    {added ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Synopsis */}
              <div className="mt-6">
                <h3 className="font-bold text-slate-900 text-md mb-2">About this Book</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Platform Guarantees */}
            <div className="mt-8 pt-6 border-t flex flex-wrap gap-6 text-xs text-slate-500">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-emerald-600" />
                <span>Instant In-Browser Reading</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="h-4 w-4 text-emerald-600" />
                <span>Offline DRM-Free Download</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Verified Independent Author</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

