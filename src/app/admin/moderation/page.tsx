"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Loader2,
  BookOpen,
} from "lucide-react";

interface QueueItem {
  id: string;
  title: string;
  authorName: string;
  status: string;
  language: string;
  seller: {
    businessName: string;
    sellerType: string;
    verificationStatus: string;
  };
  prices: { currency: string; amount: string }[];
  files: { format: string; sizeBytes: string }[];
}

export default function ModerationPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<QueueItem | null>(null);
  const [action, setAction] = useState<"APPROVE" | "REQUEST_CHANGES" | "REJECT">("APPROVE");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadQueue() {
    try {
      setLoading(true);
      const res = await fetch("/api/moderation/queue");
      if (!res.ok) throw new Error("Failed to load moderation queue");
      const data = await res.json();
      setQueue(data.queue || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
  }, []);

  async function handleDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBook) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/moderation/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: selectedBook.id,
          action,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Decision failed");
      }

      setSelectedBook(null);
      setNotes("");
      loadQueue();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-7 w-7 text-indigo-600" />
            <span className="font-bold text-lg text-slate-900">Content Moderation Desk</span>
          </div>
          <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Back to Marketplace
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Book Review Queue</h1>
            <p className="text-sm text-slate-500">
              Inspect submitted manuscripts, cover media, taxonomy, and pricing before publishing to readers.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            {queue.length} Pending Submissions
          </span>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">Queue is Clear!</h3>
            <p className="text-sm text-slate-500 mt-1">All submitted books have been reviewed and moderated.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {queue.map((book) => (
              <div
                key={book.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-4">
                  <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                    <BookOpen className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{book.title}</h3>
                    <p className="text-sm text-slate-600">
                      Author: <span className="font-semibold">{book.authorName}</span> &middot; Seller:{" "}
                      <span className="font-semibold">{book.seller.businessName}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium uppercase">
                        {book.language}
                      </span>
                      {book.files.map((f, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          {f.format}
                        </span>
                      ))}
                      {book.prices.map((p, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">
                          {p.amount} {p.currency}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setSelectedBook(book);
                      setAction("APPROVE");
                    }}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-all"
                  >
                    Review Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {selectedBook && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-lg text-slate-900">Moderate: {selectedBook.title}</h3>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleDecision} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Select Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAction("APPROVE")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        action === "APPROVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-500 ring-2 ring-emerald-500/20"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Approve & Live
                    </button>
                    <button
                      type="button"
                      onClick={() => setAction("REQUEST_CHANGES")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        action === "REQUEST_CHANGES"
                          ? "bg-amber-50 text-amber-700 border-amber-500 ring-2 ring-amber-500/20"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Request Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAction("REJECT")}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                        action === "REJECT"
                          ? "bg-red-50 text-red-700 border-red-500 ring-2 ring-red-500/20"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      Reject Book
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Moderator Review Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Feedback for author (formatting, copyright verification, etc.)..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 flex items-center space-x-2"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>Confirm Decision</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
