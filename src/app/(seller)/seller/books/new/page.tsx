"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Globe,
  Sparkles,
  Info,
} from "lucide-react";
import { Navbar } from "@/frontend/components/navigation/Navbar";
import { Footer } from "@/frontend/components/navigation/Footer";

interface Category {
  id: string;
  name: string;
}

export default function NewBookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("am");
  const [priceEtb, setPriceEtb] = useState("350.00");
  const [priceUsd, setPriceUsd] = useState("10.00");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<"PDF" | "EPUB">("PDF");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/catalog/categories");
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          setSelectedCategory(data.categories[0].id);
        }
      } catch {
        setError("Could not load categories. Please refresh or try again.");
      }
    }
    fetchCategories();
  }, []);

  async function uploadToS3(file: File, fileType: "cover" | "book_binary") {
    // 1. Authorize upload with backend to generate secure storage key
    const urlRes = await fetch("/api/catalog/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileType,
        contentType: file.type || (fileType === "cover" ? "image/jpeg" : "application/pdf"),
        originalName: file.name,
      }),
    });

    const urlData = await urlRes.json();
    if (!urlRes.ok) throw new Error(urlData.detail || "Failed to get upload authorization");

    // 2. Stream upload via server API proxy to avoid browser DNS resolution errors (net::ERR_NAME_NOT_RESOLVED)
    // and bypass container MinIO CORS limitations cleanly
    const formData = new FormData();
    formData.append("file", file);
    formData.append("storageKey", urlData.storageKey);
    formData.append("bucket", urlData.bucket);

    const proxyRes = await fetch("/api/catalog/upload-proxy", {
      method: "POST",
      body: formData,
    });

    if (!proxyRes.ok) {
      const proxyData = await proxyRes.json().catch(() => ({}));
      throw new Error(proxyData.detail || "Failed to upload file to storage.");
    }

    return urlData.storageKey as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Please enter a book title");
      if (!authorName.trim()) throw new Error("Please enter an author display name");
      if (!selectedCategory) throw new Error("Please select a primary category");
      if (!coverFile) throw new Error("Please select a cover image");
      if (!bookFile) throw new Error("Please select a PDF or EPUB book file");

      setStatusMessage("Uploading book cover...");
      const coverImageKey = await uploadToS3(coverFile, "cover");

      setStatusMessage("Uploading manuscript binary...");
      const bookStorageKey = await uploadToS3(bookFile, "book_binary");

      setStatusMessage("Creating book listing draft...");
      const draftRes = await fetch("/api/catalog/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          authorName: authorName.trim(),
          description: description.trim(),
          language,
          coverImageKey,
          categoryIds: [selectedCategory],
          prices: [
            { currency: "ETB", amount: parseFloat(priceEtb) || 0 },
            { currency: "USD", amount: parseFloat(priceUsd) || 0 },
          ],
        }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.detail || "Failed to create book draft");

      const bookId = draftData.book.id;

      setStatusMessage("Attaching digital edition assets...");
      const attachRes = await fetch(`/api/catalog/books/${bookId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: fileFormat,
          storageKey: bookStorageKey,
          originalName: bookFile.name,
          mimeType: bookFile.type || (fileFormat === "PDF" ? "application/pdf" : "application/epub+zip"),
          sizeBytes: bookFile.size,
          checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000",
          isSample: false,
        }),
      });

      if (!attachRes.ok) {
        const attachData = await attachRes.json().catch(() => ({}));
        throw new Error(attachData.detail || "Failed to link file to book");
      }

      setStatusMessage("Submitting for content moderation...");
      const submitRes = await fetch(`/api/catalog/books/${bookId}/submit`, {
        method: "POST",
      });

      if (!submitRes.ok) {
        const submitData = await submitRes.json().catch(() => ({}));
        throw new Error(submitData.detail || "Failed to submit for moderation");
      }

      router.push("/seller/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during book submission");
      }
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Navbar active="seller" />

      {/* Main Content Container with Constrained, Professional Width */}
      <main className="w-full max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8 flex-1" style={{ maxWidth: "896px" }}>
        {/* Header Breadcrumb & Actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-borderBase pb-6">
          <div>
            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondaryText hover:text-navy-900 transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gold-600" />
              <span>Back to Author Studio</span>
            </Link>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-navy-900">
              Publish New Digital Book
            </h1>
            <p className="mt-1 text-sm text-secondaryText">
              Submit your manuscript and metadata for catalog moderation and distribution.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Digital Bookstore Listing</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 rounded-xl bg-red-50 p-4 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Submission Blocked</p>
              <p className="mt-0.5 text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-borderBase shadow-sm p-6 sm:p-10 space-y-8">
          {/* Section 1: Bibliographic Metadata */}
          <div>
            <div className="border-b border-borderBase pb-3 mb-6">
              <h2 className="font-serif text-xl font-bold text-navy-900">
                1. Bibliographic Metadata
              </h2>
              <p className="text-xs text-secondaryText mt-0.5">
                Provide accurate details to ensure readers can discover your book in the catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Book Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                  placeholder="e.g. Oromay (ኦሮማይ)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subtitle <span className="text-xs font-normal text-secondaryText lowercase">(optional)</span>
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                  placeholder="e.g. A gripping historical novel of love and sacrifice"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Author Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                  placeholder="e.g. Baalu Girma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Language <span className="text-red-500">*</span>
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                >
                  <option value="am">Amharic (አማርኛ)</option>
                  <option value="en">English</option>
                  <option value="om">Afaan Oromoo</option>
                  <option value="ti">Tigrinya (ትግርኛ)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Primary Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Synopsis / Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-3 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                  placeholder="Describe the premise, topics covered, target readership, and table of contents..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dual Currency Pricing */}
          <div className="border-t border-borderBase pt-6">
            <div className="border-b border-borderBase pb-3 mb-6">
              <h2 className="font-serif text-xl font-bold text-navy-900">
                2. Dual Currency Pricing
              </h2>
              <p className="text-xs text-secondaryText mt-0.5">
                Set competitive prices in Ethiopian Birr (ETB) and US Dollar (USD) for global readers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl border border-borderBase bg-ivory-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                    Ethiopian Birr
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-gold-500/20 text-gold-800">
                    ETB
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-secondaryText">
                    ETB
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceEtb}
                    onChange={(e) => setPriceEtb(e.target.value)}
                    className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-borderBase bg-white text-sm font-semibold text-primaryText shadow-xs focus:border-navy-900 focus:outline-hidden transition"
                    placeholder="350.00"
                  />
                </div>
                <p className="text-[11px] text-secondaryText mt-2">
                  Local payment gateways (Telebirr, CBE, Chapa).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-borderBase bg-ivory-50/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-navy-900">
                    US Dollar
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-navy-100 text-navy-900">
                    USD
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-secondaryText">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-borderBase bg-white text-sm font-semibold text-primaryText shadow-xs focus:border-navy-900 focus:outline-hidden transition"
                    placeholder="10.00"
                  />
                </div>
                <p className="text-[11px] text-secondaryText mt-2">
                  International cards and diaspora checkouts.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Digital Files & Cover Upload */}
          <div className="border-t border-borderBase pt-6">
            <div className="border-b border-borderBase pb-3 mb-6">
              <h2 className="font-serif text-xl font-bold text-navy-900">
                3. Book Files & Cover Artwork
              </h2>
              <p className="text-xs text-secondaryText mt-0.5">
                Upload your high-resolution cover image and DRM-ready manuscript (PDF or EPUB).
              </p>
            </div>

            <div className="space-y-6">
              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Cover Image (JPEG / PNG / WebP) <span className="text-red-500">*</span>
                </label>
                <div className="p-4 rounded-xl border border-dashed border-borderBase bg-ivory-50/50 hover:bg-white hover:border-navy-700 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-secondaryText file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-borderBase file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-navy-900 file:text-white hover:file:bg-navy-800 transition cursor-pointer"
                    />
                  </div>
                  {coverFile && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-medium text-navy-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{coverFile.name}</span>
                      <span className="text-secondaryText text-[11px]">
                        ({(coverFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Format & Manuscript File */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Digital Format <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value as "PDF" | "EPUB")}
                    className="w-full rounded-xl border border-borderBase bg-ivory-50 px-4 py-2.5 text-sm text-primaryText shadow-xs focus:border-navy-900 focus:bg-white focus:outline-hidden transition"
                  >
                    <option value="PDF">PDF Document (Fixed Layout)</option>
                    <option value="EPUB">EPUB E-Book (Reflowable Text)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Upload {fileFormat} File <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept={fileFormat === "PDF" ? ".pdf,application/pdf" : ".epub,application/epub+zip"}
                    required
                    onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-secondaryText file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-borderBase file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-navy-900 file:text-white hover:file:bg-navy-800 transition cursor-pointer"
                  />
                  {bookFile && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-navy-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{bookFile.name}</span>
                      <span className="text-secondaryText text-[11px]">
                        ({(bookFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Moderation Notice */}
          <div className="rounded-xl bg-ivory-100 p-4 border border-borderBase flex items-start gap-3 text-xs text-secondaryText">
            <Info className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <p>
              Once submitted, your book enters the editorial moderation queue. Our team verifies formatting,
              metadata, and rights before the listing is activated on the public catalog. You can track status
              in your Author Studio dashboard.
            </p>
          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl shadow-md text-xs font-bold uppercase tracking-wider text-white bg-navy-900 hover:bg-navy-800 active:scale-[0.99] focus:outline-hidden transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-gold-400" />
                  <span>{statusMessage || "Processing Submission..."}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-gold-400" />
                  <span>Upload &amp; Submit for Moderation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
