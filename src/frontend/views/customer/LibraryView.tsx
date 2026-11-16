"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Download,
  Loader2,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar active="library" />

      <main className="max-w-6xl mx-auto py-10 px-4 flex-1 w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Digital Library</h1>
            <p className="text-sm text-slate-500">Access and read all your purchased digital titles.</p>
          </div>
          <Link
            href="/catalog"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Browse More Books &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : library.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
            <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-slate-900">Your library is currently empty</h3>
            <p className="text-sm text-slate-500 mt-1">Purchased books will appear here immediately after payment.</p>
            <Link
              href="/catalog"
              className="mt-6 inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-500"
            >
              Explore Books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {library.map((item) => {
              const progress = item.readingProgress[0];
              const pct = progress ? parseFloat(progress.percentage) : 0;

              return (
                <div
                  key={item.entitlementId}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[3/2] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 mb-4">
                      <BookOpen className="h-10 w-10 text-slate-300" />
                    </div>

                    <h3 className="font-bold text-base text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">By {item.authorName}</p>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Reading Progress</span>
                        <span className="font-semibold text-slate-700">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t flex items-center justify-between gap-3">
                    <Link
                      href={`/read/${item.bookId}`}
                      className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 flex items-center justify-center space-x-1"
                    >
                      <span>Read Online</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <button
                      onClick={() => handleDownload(item.bookId, "PDF")}
                      disabled={downloadingId === item.bookId}
                      className="py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center space-x-1"
                      title="Download PDF"
                    >
                      {downloadingId === item.bookId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>Download</span>
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
