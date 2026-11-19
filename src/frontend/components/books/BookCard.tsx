"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ShoppingCart, Check, Heart } from "lucide-react";
import { BookCover } from "./BookCover";

export interface BookCardData {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  coverImageKey?: string | null;
  averageRating?: string | number;
  reviewCount?: number;
  prices: { currency: string; amount: string | number }[];
  files?: { format: string }[];
  categories?: { category: { name: string; slug: string } }[];
}

interface BookCardProps {
  book: BookCardData;
  activeCurrency?: "ETB" | "USD";
  onAddedToCart?: () => void;
}

export function BookCard({ book, activeCurrency = "ETB", onAddedToCart }: BookCardProps) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  // Price match
  const matchedPrice =
    book.prices?.find((p) => p.currency === activeCurrency) ||
    book.prices?.[0] || { currency: activeCurrency, amount: "0.00" };

  const ratingNum = typeof book.averageRating === "string" ? parseFloat(book.averageRating) : (book.averageRating || 0);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;

    setAdding(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });

      if (res.ok) {
        setAdded(true);
        if (onAddedToCart) onAddedToCart();
        setTimeout(() => setAdded(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setAdding(false);
    }
  }

  function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(!wishlisted);
  }

  return (
    <div className="group bg-white rounded-xl border border-borderBase overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between hover:border-gold-400/50">
      <Link href={`/books/${book.slug}`} className="block relative">
        {/* Cover Container */}
        <div className="relative overflow-hidden bg-ivory-100 p-3 flex items-center justify-center">
          <div className="w-full transition-transform duration-300 group-hover:scale-[1.03]">
            <BookCover
              coverUrl={book.coverImageKey}
              title={book.title}
              authorName={book.authorName}
            />
          </div>

          {/* Format Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1 z-20">
            {book.files && book.files.map((f, i) => (
              <span
                key={i}
                className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-navy-900/90 text-white backdrop-blur-xs uppercase shadow-xs"
              >
                {f.format}
              </span>
            ))}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            aria-label="Save to Wishlist"
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 text-slate-600 hover:text-red-500 hover:bg-white shadow-xs backdrop-blur-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-sm text-primaryText leading-snug line-clamp-2 group-hover:text-navy-900 transition-colors">
              {book.title}
            </h3>
            <p className="text-xs text-secondaryText mt-1 line-clamp-1 font-medium">
              {book.authorName}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block -mb-0.5">Price</span>
              <span className="font-bold text-sm text-navy-900">
                {matchedPrice.amount} {matchedPrice.currency}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center text-xs text-slate-700 font-semibold gap-1">
              <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
              <span>{ratingNum > 0 ? ratingNum.toFixed(1) : "New"}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Action Footer */}
      <div className="px-4 pb-4 pt-0">
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            added
              ? "bg-emerald-600 text-white"
              : "bg-navy-900 hover:bg-navy-800 text-white shadow-xs"
          }`}
        >
          {added ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 text-gold-400" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

