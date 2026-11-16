"use client";

import Link from "next/link";
import { BookOpen, ShoppingCart, User, ShieldCheck } from "lucide-react";

interface NavbarProps {
  active?: "catalog" | "cart" | "library" | "seller" | "admin";
  cartCount?: number;
}

export function Navbar({ active, cartCount = 0 }: NavbarProps) {
  return (
    <header className="border-b bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/catalog" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <BookOpen className="w-6 h-6" />
          <span>E-Book Marketplace</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/catalog"
            className={active === "catalog" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            Catalog
          </Link>
          <Link
            href="/library"
            className={active === "library" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            My Library
          </Link>
          <Link
            href="/seller/dashboard"
            className={active === "seller" ? "text-indigo-600 font-semibold" : "text-slate-600 hover:text-slate-900"}
          >
            Author Studio
          </Link>
          <Link
            href="/admin/users"
            className={active === "admin" ? "text-indigo-600 font-semibold flex items-center gap-1" : "text-slate-600 hover:text-slate-900 flex items-center gap-1"}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Admin
          </Link>
          <Link
            href="/cart"
            className={`relative p-2 rounded-full border border-slate-200 hover:bg-slate-50 transition ${
              active === "cart" ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "text-slate-700"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

