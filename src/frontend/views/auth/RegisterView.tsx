"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, AlertCircle, Loader2 } from "lucide-react";

export function RegisterView() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please check your details.");
      }

      router.push("/catalog");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <div className="w-full max-w-[460px] mx-auto bg-white p-8 sm:p-10 rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200">
        <div className="text-center">
          <Link href="/catalog" className="inline-flex items-center gap-2 text-indigo-600 font-bold text-xl hover:opacity-90 transition">
            <BookOpen className="h-7 w-7" />
            <span className="text-slate-900">E-Book Marketplace</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Already registered?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-indigo-600 hover:text-indigo-500 underline"
            >
              Sign in to your account
            </Link>
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 border border-red-200 flex items-start space-x-3 text-red-700 text-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
              placeholder="Abebe Bikila"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-700 mb-1"
            >
              Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 text-sm transition"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl shadow-xs text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
          <Link href="/catalog" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
            &larr; Back to Public Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
