"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowLeft, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";

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
  const [language, setLanguage] = useState("en");
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
        setError("Could not load categories");
      }
    }
    fetchCategories();
  }, []);

  async function uploadToS3(file: File, fileType: "cover" | "book_binary") {
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

    // Direct PUT to MinIO / S3
    const uploadRes = await fetch(urlData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || (fileType === "cover" ? "image/jpeg" : "application/pdf"),
      },
      body: file,
    });

    if (!uploadRes.ok) throw new Error("Failed to upload binary file to object storage");

    return urlData.storageKey as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!coverFile) throw new Error("Please select a cover image");
      if (!bookFile) throw new Error("Please select a PDF or EPUB book file");

      setStatusMessage("Uploading book cover...");
      const coverImageKey = await uploadToS3(coverFile, "cover");

      setStatusMessage("Uploading book binary file...");
      const bookStorageKey = await uploadToS3(bookFile, "book_binary");

      setStatusMessage("Creating book listing draft...");
      const draftRes = await fetch("/api/catalog/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || undefined,
          authorName,
          description,
          language,
          coverImageKey,
          categoryIds: [selectedCategory],
          prices: [
            { currency: "ETB", amount: parseFloat(priceEtb) },
            { currency: "USD", amount: parseFloat(priceUsd) },
          ],
        }),
      });

      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.detail || "Failed to create book draft");

      const bookId = draftData.book.id;

      setStatusMessage("Attaching book digital file...");
      const attachRes = await fetch(`/api/catalog/books/${bookId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: fileFormat,
          storageKey: bookStorageKey,
          originalName: bookFile.name,
          mimeType: bookFile.type || (fileFormat === "PDF" ? "application/pdf" : "application/epub+zip"),
          sizeBytes: bookFile.size,
          checksumSha256: "0000000000000000000000000000000000000000000000000000000000000000", // placeholder
          isSample: false,
        }),
      });

      if (!attachRes.ok) throw new Error("Failed to link file to book");

      setStatusMessage("Submitting for content moderation...");
      const submitRes = await fetch(`/api/catalog/books/${bookId}/submit`, {
        method: "POST",
      });

      if (!submitRes.ok) throw new Error("Failed to submit for moderation");

      router.push("/seller/dashboard");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred during submission");
      }
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="inline-flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-emerald-600" />
            <span className="font-bold text-slate-900">Publish New Book</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-slate-900">Book Metadata</h2>
            <p className="text-xs text-slate-500 mt-1">Provide clear bibliographic details for catalog discovery.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Book Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="e.g. Oromay"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Subtitle (Optional)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="A historical thriller"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Author Display Name</label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="e.g. Baalu Girma"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              >
                <option value="am">Amharic (አማርኛ)</option>
                <option value="en">English</option>
                <option value="om">Afaan Oromoo</option>
                <option value="ti">Tigrinya</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Primary Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Synopsis / Description</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                placeholder="Detailed description of the book..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="border-t pt-4">
            <h3 className="text-md font-bold text-slate-900 mb-3">Pricing per Currency</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">Price in Ethiopian Birr (ETB)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceEtb}
                  onChange={(e) => setPriceEtb(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600">Price in USD ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Uploads */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="text-md font-bold text-slate-900">Book Files</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image (JPEG/PNG)</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value as "PDF" | "EPUB")}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm sm:text-sm"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="EPUB">EPUB E-Book</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Upload {fileFormat} File
                </label>
                <input
                  type="file"
                  accept={fileFormat === "PDF" ? ".pdf,application/pdf" : ".epub,application/epub+zip"}
                  required
                  onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-semibold shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{statusMessage || "Processing..."}</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Upload & Submit for Moderation</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
