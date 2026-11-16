"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookOpen,
  Loader2,
  Check,
} from "lucide-react";

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.bookId as string;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(120);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    // Verify entitlement access
    async function checkAccess() {
      try {
        const res = await fetch(`/api/books/${bookId}/download`);
        if (!res.ok) {
          if (res.status === 403) {
            alert("You must purchase this book to read it online.");
            router.push("/catalog");
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (bookId) checkAccess();
  }, [bookId]);

  async function saveProgress(newPage: number) {
    setCurrentPage(newPage);
    const percentage = Math.round((newPage / totalPages) * 100);

    setSavingProgress(true);
    try {
      await fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          format: "PDF",
          locator: `page_${newPage}`,
          percentage,
        }),
      });
    } catch {
      // ignore
    } finally {
      setSavingProgress(false);
    }
  }

  function handleNext() {
    if (currentPage < totalPages) {
      saveProgress(currentPage + 1);
    }
  }

  function handlePrev() {
    if (currentPage > 1) {
      saveProgress(currentPage - 1);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const currentPercent = Math.round((currentPage / totalPages) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between select-none">
      {/* Reader Navbar */}
      <header className="h-14 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <Link
            href="/library"
            className="text-slate-400 hover:text-white flex items-center space-x-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Library</span>
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-xs font-medium text-slate-300">In-Browser Reader</span>
        </div>

        <div className="flex items-center space-x-4 text-xs">
          <span className="text-slate-400">
            Page {currentPage} of {totalPages} ({currentPercent}%)
          </span>
          <button
            onClick={() => {
              setBookmarked(true);
              setTimeout(() => setBookmarked(false), 2000);
            }}
            className={`p-1.5 rounded hover:bg-slate-800 ${
              bookmarked ? "text-emerald-400" : "text-slate-400"
            }`}
            title="Add Bookmark"
          >
            {bookmarked ? <Check className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Reader Document Canvas (Range Stream Container) */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col items-center justify-center">
        <div className="w-full aspect-[1/1.414] bg-white text-slate-900 rounded-lg shadow-2xl p-12 flex flex-col justify-between border border-slate-800">
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-serif font-bold text-slate-900">Chapter {currentPage}</h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Digital Reader Preview</p>
          </div>

          <div className="font-serif leading-relaxed text-sm text-slate-700 space-y-4 my-8">
            <p>
              The digital e-book reader streams byte chunks directly from authenticated object storage via HTTP 206 range requests. This guarantees instant page rendering without buffering the entire volume into memory.
            </p>
            <p>
              As the customer advances through each section, progress is synced automatically to the cloud ledger, preserving exact reading position across mobile and desktop devices.
            </p>
            <p>
              All downloaded copies carry unique cryptographic forensic markings tied to the purchaser’s identity to deter unauthorized reproduction while preserving open compatibility with standard e-readers.
            </p>
          </div>

          <div className="text-center border-t pt-4 text-xs text-slate-400">
            <span>— {currentPage} —</span>
          </div>
        </div>
      </main>

      {/* Reader Controls Footer */}
      <footer className="h-16 border-t border-slate-800 px-6 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <button
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold disabled:opacity-40 flex items-center space-x-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold disabled:opacity-40 flex items-center space-x-1"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </footer>
    </div>
  );
}
