"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  BookOpen,
  RotateCcw,
  Sparkles,
  Filter,
  Check,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { Footer } from "../../components/navigation/Footer";
import { BookCard, BookCardData } from "../../components/books/BookCard";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function CatalogView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search & Filters State
  const [books, setBooks] = useState<BookCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [currency, setCurrency] = useState<"ETB" | "USD">(
    (searchParams.get("currency") as "ETB" | "USD") || "ETB"
  );
  const [selectedFormat, setSelectedFormat] = useState<string>(searchParams.get("format") || "");
  const [selectedLanguage, setSelectedLanguage] = useState<string>(searchParams.get("lang") || "");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sort") || "newest");
  const [priceTier, setPriceTier] = useState<string>("");

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load Categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/catalog/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch {
        // ignore
      }
    }
    fetchCategories();
  }, []);

  // Fetch Books with active filters
  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (selectedCategory) params.set("category", selectedCategory);
      if (currency) params.set("currency", currency);
      if (selectedFormat) params.set("format", selectedFormat);
      if (selectedLanguage) params.set("lang", selectedLanguage);
      if (sortBy) params.set("sortBy", sortBy);

      if (priceTier === "under_100") {
        params.set("maxPrice", currency === "ETB" ? "100" : "5");
      } else if (priceTier === "100_300") {
        params.set("minPrice", currency === "ETB" ? "100" : "5");
        params.set("maxPrice", currency === "ETB" ? "300" : "15");
      } else if (priceTier === "over_300") {
        params.set("minPrice", currency === "ETB" ? "300" : "15");
      }

      const res = await fetch(`/api/catalog/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory, currency, selectedFormat, selectedLanguage, sortBy, priceTier]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadBooks();
  }

  function handleResetFilters() {
    setQuery("");
    setSelectedCategory("");
    setSelectedFormat("");
    setSelectedLanguage("");
    setSortBy("newest");
    setPriceTier("");
  }

  const hasActiveFilters = Boolean(
    query || selectedCategory || selectedFormat || selectedLanguage || priceTier || sortBy !== "newest"
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar
        active="catalog"
        activeCurrency={currency}
        onCurrencyChange={(newCur) => setCurrency(newCur)}
      />

      {/* PAGE HEADER: Editorial Bookstore Banner */}
      <section className="bg-navy-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-navy-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D6A85F_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 uppercase tracking-widest mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Digital Catalog & Publications</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Explore Our Collection
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Find your next favorite book from our growing digital library of Ethiopian literature, global bestsellers, and academic publications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-navy-950/80 px-4 py-2.5 rounded-xl border border-navy-700 text-xs font-medium text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-white text-sm">{books.length}</span>
              <span>{books.length === 1 ? "Book Available" : "Books Available"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH & CONTROLS TOOLBAR */}
      <div className="bg-white border-b border-borderBase sticky top-18 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, or keyword..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-borderBase bg-ivory-50 text-sm text-primaryText placeholder:text-slate-400 focus:outline-hidden focus:border-navy-900 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Quick Controls: Mobile Filter Toggle + Sort By */}
          <div className="flex items-center justify-between w-full md:w-auto gap-3">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="md:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl border border-borderBase text-xs font-semibold text-primaryText hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-navy-900" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-gold-500"></span>
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-secondaryText hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-borderBase rounded-xl px-3 py-2 text-xs font-semibold text-primaryText focus:outline-hidden focus:border-navy-900"
              >
                <option value="newest">Newest First</option>
                <option value="best_selling">Best Selling</option>
                <option value="rating">Highest Rated</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div id="categories" className="border-t border-slate-100 py-2.5 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === ""
                ? "bg-navy-900 text-white shadow-xs"
                : "bg-ivory-100 text-slate-700 hover:bg-slate-200"
              }`}
          >
            All Genres
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat.slug
                  ? "bg-navy-900 text-white shadow-xs"
                  : "bg-ivory-100 text-slate-700 hover:bg-slate-200"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CATALOG WORKSPACE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* DESKTOP SIDEBAR FILTERS (Left Column) */}
          <aside className="hidden md:block col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-borderBase p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-borderBase">
                <div className="flex items-center gap-2 font-serif font-bold text-navy-900 text-sm">
                  <Filter className="w-4 h-4 text-gold-600" />
                  <span>Refine Catalog</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-semibold text-secondaryText hover:text-navy-900 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Format Filter */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Digital Format
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedFormat("")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedFormat === "" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>All Formats</span>
                    {selectedFormat === "" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setSelectedFormat("PDF")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedFormat === "PDF" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>PDF Document</span>
                    {selectedFormat === "PDF" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setSelectedFormat("EPUB")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedFormat === "EPUB" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>EPUB E-Book</span>
                    {selectedFormat === "EPUB" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                </div>
              </div>

              {/* Language Filter */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Language
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setSelectedLanguage("")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedLanguage === "" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>All Languages</span>
                    {selectedLanguage === "" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setSelectedLanguage("am")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedLanguage === "am" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>Amharic (አማርኛ)</span>
                    {selectedLanguage === "am" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setSelectedLanguage("en")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedLanguage === "en" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>English</span>
                    {selectedLanguage === "en" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setSelectedLanguage("om")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedLanguage === "om" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>Afaan Oromoo</span>
                    {selectedLanguage === "om" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setSelectedLanguage("ti")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${selectedLanguage === "ti" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>Tigrinya</span>
                    {selectedLanguage === "ti" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                </div>
              </div>

              {/* Price Tier Filter */}
              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Price ({currency})
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setPriceTier("")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${priceTier === "" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>All Prices</span>
                    {priceTier === "" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setPriceTier("under_100")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${priceTier === "under_100" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>Under {currency === "ETB" ? "100 ETB" : "$5"}</span>
                    {priceTier === "under_100" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setPriceTier("100_300")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${priceTier === "100_300" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>{currency === "ETB" ? "100 - 300 ETB" : "$5 - $15"}</span>
                    {priceTier === "100_300" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                  <button
                    onClick={() => setPriceTier("over_300")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${priceTier === "over_300" ? "bg-navy-50 text-navy-900 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    <span>{currency === "ETB" ? "300+ ETB" : "$15+"}</span>
                    {priceTier === "over_300" && <Check className="w-3.5 h-3.5 text-navy-900" />}
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN BOOK GRID (Right Columns) */}
          <main className="col-span-1 md:col-span-3 lg:col-span-4">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-xl h-80 border border-borderBase" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="bg-white rounded-2xl border border-borderBase p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-full bg-ivory-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="font-serif font-bold text-navy-900 text-lg">No books found</h3>
                <p className="text-secondaryText text-xs mt-1 leading-relaxed">
                  We couldn&apos;t find any digital books matching your current search criteria. Try modifying your search keywords or clearing active filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs shadow-xs transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    activeCurrency={currency}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
