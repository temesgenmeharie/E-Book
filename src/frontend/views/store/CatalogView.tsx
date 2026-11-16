"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Star,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";

interface BookItem {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  coverImageKey: string;
  averageRating: string;
  reviewCount: number;
  seller: { businessName: string };
  categories: { category: { name: string; slug: string } }[];
  prices: { currency: string; amount: string }[];
  files: { format: string }[];
}

export function CatalogView() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currency, setCurrency] = useState<"ETB" | "USD">("ETB");
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const catRes = await fetch("/api/catalog/categories");
        const catData = await catRes.json();
        setCategories(catData.categories || []);
      } catch {
        // ignore
      }
    }
    fetchInitialData();
  }, []);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("currency", currency);

      const res = await fetch(`/api/catalog/search?${params.toString()}`);
      const data = await res.json();
      setBooks(data.books || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, currency]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadBooks();
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar active="catalog" />

      {/* Subheader & Search Controls */}
      <div className="bg-white border-b py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md w-full relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or keywords..."
              className="w-full rounded-full border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
          </form>

          {/* Currency Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => setCurrency("ETB")}
              className={`px-3 py-1 rounded ${
                currency === "ETB" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
              }`}
            >
              ETB (ብር)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-3 py-1 rounded ${
                currency === "USD" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600"
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="bg-white border-b py-2.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === ""
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Genres
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.slug
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">
            {selectedCategory ? `Genre: ${selectedCategory}` : "Discover Digital Books"}
          </h1>
          <span className="text-xs text-slate-500 font-medium">
            {books.length} {books.length === 1 ? "book" : "books"} available
          </span>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : books.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 text-lg">No books found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try adjusting your search terms, currency, or category filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {books.map((book) => {
              const matchedPrice =
                book.prices.find((p) => p.currency === currency) || book.prices[0];

              return (
                <div
                  key={book.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <Link href={`/books/${book.slug}`} className="block">
                    <div className="aspect-[3/4] bg-slate-100 relative flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors">
                      <BookOpen className="h-10 w-10 text-slate-300" />
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {book.files.map((f, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 text-slate-800 shadow-xs backdrop-blur-xs"
                          >
                            {f.format}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3">
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{book.authorName}</p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-extrabold text-sm text-indigo-700">
                          {matchedPrice?.amount} {matchedPrice?.currency}
                        </span>
                        <div className="flex items-center text-xs text-amber-500 font-semibold space-x-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{book.averageRating !== "0" ? book.averageRating : "New"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="p-3 pt-0">
                    <button
                      onClick={async () => {
                        await fetch("/api/cart/items", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ bookId: book.id }),
                        });
                        alert("Added to cart!");
                      }}
                      className="w-full py-1.5 rounded-lg border border-indigo-600 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 transition-all flex items-center justify-center space-x-1"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
