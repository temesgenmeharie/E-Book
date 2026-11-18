"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Download,
  Loader2,
  Search,
  Sparkles,
  CheckCircle2,
  Bookmark,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { Footer } from "../../components/navigation/Footer";
import { BookCover } from "../../components/books/BookCover";

interface LibraryItem {
  entitlementId: string;
  bookId: string;
  title: string;
  authorName: string;
  sellerName: string;
  purchasedAt: string;
  formats: { format: string; sizeBytes: string }[];
  readingProgress: { format: string; locator: string; percentage: string }[];
}

export function LibraryView() {
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  useEffect(() => {
    async function loadLibrary() {
      try {
        const res = await fetch("/api/library");
        if (!res.ok) throw new Error("Failed to load library");
        const data = await res.json();
        setLibrary(data.library || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  async function handleDownload(bookId: string, format: string) {
    setDownloadingId(bookId);
    try {
      const res = await fetch(`/api/books/${bookId}/download?format=${format}`);
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch {
      alert("Could not start download");
    } finally {
      setDownloadingId(null);
    }
  }

  const filteredItems = library.filter((item) =>
    item.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    item.authorName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar active="library" />

      {/* Header Banner */}
      <section className="bg-navy-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 uppercase tracking-widest mb-1.5">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Personal Reading Vault</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-white">
              My Digital Library
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Access your permanently licensed e-books. Read on the web reader or download offline copies anytime.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/catalog"
              className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs uppercase tracking-wider shadow-xs transition"
            >
              Browse Bookstore &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Main Library Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex-1 w-full space-y-6">
        {/* Search within Library */}
        {library.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter my books..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-borderBase bg-white text-xs text-primaryText focus:outline-hidden focus:border-navy-900 shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>

            <span className="text-xs text-secondaryText font-medium">
              {filteredItems.length} of {library.length} {library.length === 1 ? "book" : "books"}
            </span>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
            <p className="text-secondaryText text-xs mt-3">Loading your library shelf...</p>
          </div>
        ) : library.length === 0 ? (
          <div className="bg-white rounded-2xl border border-borderBase p-16 text-center max-w-lg mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-ivory-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-navy-900">Your Library is Empty</h2>
            <p className="text-sm text-secondaryText mt-1.5 leading-relaxed">
              Purchased digital titles will appear in your library automatically after checkout. Explore our collection of Ethiopian classics, software manuals, and global bestsellers.
            </p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition"
            >
              <span>Explore Digital Books</span>
              <ArrowRight className="w-4 h-4 text-gold-400" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const progress = item.readingProgress[0];
              const pct = progress ? parseFloat(progress.percentage) : 0;

              return (
                <div
                  key={item.entitlementId}
                  className="bg-white rounded-2xl border border-borderBase p-5 shadow-xs flex flex-col justify-between hover:border-gold-400/50 transition-all"
                >
                  <div>
                    <div className="flex gap-4">
                      <div className="w-20 shrink-0 shadow-sm rounded-md overflow-hidden">
                        <BookCover
                          title={item.title}
                          authorName={item.authorName}
                          aspectRatio="aspect-[1/1.4]"
                        />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-serif font-bold text-sm text-navy-900 leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-xs text-secondaryText mt-1 font-medium line-clamp-1">
                          {item.authorName}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Publisher: {item.sellerName}
                        </p>

                        <div className="mt-2 flex gap-1">
                          {item.formats.map((f, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-ivory-100 text-navy-900 border border-slate-200"
                            >
                              {f.format}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] text-secondaryText mb-1">
                        <span>Reading Progress</span>
                        <span className="font-bold text-navy-900">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-ivory-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-4 border-t border-borderBase flex items-center gap-2">
                    <Link
                      href={`/read/${item.bookId}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <span>Read Online</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
                    </Link>

                    <button
                      onClick={() => handleDownload(item.bookId, "PDF")}
                      disabled={downloadingId === item.bookId}
                      className="py-2.5 px-3 rounded-xl border border-borderBase text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1 transition"
                      title="Download PDF"
                    >
                      {downloadingId === item.bookId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-navy-900" />
                      ) : (
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
