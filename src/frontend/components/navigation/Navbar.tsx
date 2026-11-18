"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  ShoppingCart,
  User,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Library,
  Feather,
} from "lucide-react";

interface NavbarProps {
  active?: "home" | "catalog" | "categories" | "bestsellers" | "new" | "cart" | "library" | "seller" | "admin";
  activeCurrency?: "ETB" | "USD";
  onCurrencyChange?: (currency: "ETB" | "USD") => void;
}

interface UserSession {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  sellerProfileId?: string | null;
}

export function Navbar({
  active,
  activeCurrency = "ETB",
  onCurrencyChange,
}: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currency, setCurrency] = useState<"ETB" | "USD">(activeCurrency);

  // Sync internal currency if controlled prop changes
  useEffect(() => {
    if (activeCurrency) setCurrency(activeCurrency);
  }, [activeCurrency]);

  function handleCurrencySelect(cur: "ETB" | "USD") {
    setCurrency(cur);
    if (onCurrencyChange) {
      onCurrencyChange(cur);
    } else {
      // If no callback, save to localStorage or refresh
      if (typeof window !== "undefined") {
        localStorage.setItem("preferred_currency", cur);
      }
    }
  }

  // Fetch Session & Cart on Mount
  useEffect(() => {
    async function loadSessionAndCart() {
      try {
        const authRes = await fetch("/api/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.user || null);
        }
      } catch {
        // ignore
      }

      try {
        const cartRes = await fetch("/api/cart");
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCartCount(cartData.cart?.items?.length || 0);
        }
      } catch {
        // ignore
      }
    }

    loadSessionAndCart();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/auth/login");
      router.refresh();
    } catch {
      // ignore
    }
  }

  const isSeller = user && (
    user.roles.includes("AUTHOR") ||
    user.roles.includes("PUBLISHER") ||
    user.roles.includes("ADMINISTRATOR") ||
    Boolean(user.sellerProfileId)
  );

  const isAdmin = user && user.roles.includes("ADMINISTRATOR");

  return (
    <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 text-white shadow-md">
      {/* Top Banner (Editorial Notice) */}
      <div className="hidden sm:block bg-navy-950 py-1 px-4 text-xs text-slate-300 border-b border-navy-900">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-gold-400"></span>
            <span>Ethiopian Digital Bookstore: Baalu Girma, Haddis Alemayehu, Academic & Tech Books</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Read on Web, PDF & EPUB</span>
            <span>•</span>
            <Link href="/seller/onboarding" className="text-gold-400 hover:text-gold-300 transition-colors font-medium">
              Publish Your Book &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-xl tracking-tight text-white leading-none">
              E-Book<span className="text-gold-400 font-sans font-semibold text-lg ml-1">Marketplace</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-sans">
              Digital Editions
            </span>
          </div>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link
            href="/"
            className={`hover:text-white transition-colors pb-1 border-b-2 ${
              active === "home" ? "border-gold-400 text-white font-semibold" : "border-transparent"
            }`}
          >
            Home
          </Link>
          <Link
            href="/catalog"
            className={`hover:text-white transition-colors pb-1 border-b-2 ${
              active === "catalog" ? "border-gold-400 text-white font-semibold" : "border-transparent"
            }`}
          >
            Explore Books
          </Link>
          <Link
            href="/catalog#categories"
            className={`hover:text-white transition-colors pb-1 border-b-2 ${
              active === "categories" ? "border-gold-400 text-white font-semibold" : "border-transparent"
            }`}
          >
            Categories
          </Link>
          <Link
            href="/catalog?sort=best_selling"
            className={`hover:text-white transition-colors pb-1 border-b-2 ${
              active === "bestsellers" ? "border-gold-400 text-white font-semibold" : "border-transparent"
            }`}
          >
            Best Sellers
          </Link>
          <Link
            href="/catalog?sort=newest"
            className={`hover:text-white transition-colors pb-1 border-b-2 ${
              active === "new" ? "border-gold-400 text-white font-semibold" : "border-transparent"
            }`}
          >
            New Arrivals
          </Link>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Quick Search Button */}
          <Link
            href="/catalog"
            aria-label="Search Books"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition"
          >
            <Search className="w-5 h-5" />
          </Link>

          {/* Currency Selector */}
          <div className="flex items-center bg-navy-950/80 rounded-lg p-0.5 border border-navy-700 text-xs font-semibold">
            <button
              onClick={() => handleCurrencySelect("ETB")}
              className={`px-2.5 py-1 rounded transition-all ${
                currency === "ETB"
                  ? "bg-gold-500 text-navy-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ETB (ብር)
            </button>
            <button
              onClick={() => handleCurrencySelect("USD")}
              className={`px-2.5 py-1 rounded transition-all ${
                currency === "USD"
                  ? "bg-gold-500 text-navy-950 font-bold shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              USD ($)
            </button>
          </div>

          {/* Shopping Cart Icon with Badge */}
          <Link
            href="/cart"
            aria-label="Shopping Cart"
            className={`relative p-2 rounded-lg border transition ${
              active === "cart"
                ? "bg-gold-500/20 border-gold-400 text-gold-400"
                : "border-navy-700 bg-navy-800/60 text-slate-200 hover:text-white hover:border-slate-500"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-navy-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          {/* My Library Shortcut (Desktop) */}
          <Link
            href="/library"
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              active === "library"
                ? "bg-gold-500/20 border-gold-400 text-gold-400"
                : "border-navy-700 hover:border-slate-500 text-slate-200 hover:text-white"
            }`}
          >
            <Library className="w-4 h-4 text-gold-400" />
            <span>My Library</span>
          </Link>

          {/* Author Studio Shortcut (If Seller or Admin) */}
          {isSeller && (
            <Link
              href="/seller/dashboard"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                active === "seller"
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                  : "border-navy-700 hover:border-emerald-600 text-slate-200 hover:text-emerald-300"
              }`}
            >
              <Feather className="w-3.5 h-3.5 text-emerald-400" />
              <span>Author Studio</span>
            </Link>
          )}

          {/* Admin Shortcut (If Admin) */}
          {isAdmin && (
            <Link
              href="/admin/users"
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                active === "admin"
                  ? "bg-red-500/20 border-red-400 text-red-300"
                  : "border-navy-700 hover:border-red-500 text-slate-200 hover:text-red-300"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Admin</span>
            </Link>
          )}

          {/* User Account / Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-navy-800 text-slate-200 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/40 text-gold-400 flex items-center justify-center font-bold text-xs uppercase">
                  {user.fullName ? user.fullName[0] : "U"}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-borderBase text-primaryText py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-navy-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {user.roles.map((r) => (
                        <span key={r} className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/library"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Library className="w-4 h-4 text-slate-500" />
                    <span>My Library</span>
                  </Link>

                  {isSeller && (
                    <Link
                      href="/seller/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Feather className="w-4 h-4 text-emerald-600" />
                      <span>Author Studio</span>
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin/users"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-red-600" />
                      <span>Admin Console</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-navy-800 transition"
              >
                <User className="w-3.5 h-3.5 text-gold-400" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/auth/register"
                className="hidden sm:inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-navy-950 font-bold text-xs shadow-xs transition"
              >
                Join
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-950 border-t border-navy-800 px-4 py-6 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Home
            </Link>
            <Link
              href="/catalog"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Explore Books
            </Link>
            <Link
              href="/catalog#categories"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Categories
            </Link>
            <Link
              href="/catalog?sort=best_selling"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              Best Sellers
            </Link>
            <Link
              href="/catalog?sort=newest"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-white"
            >
              New Arrivals
            </Link>
            <Link
              href="/library"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-gold-400 flex items-center gap-2"
            >
              <Library className="w-4 h-4" />
              <span>My Library</span>
            </Link>
            {isSeller && (
              <Link
                href="/seller/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-emerald-400 flex items-center gap-2"
              >
                <Feather className="w-4 h-4" />
                <span>Author Studio</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-red-400 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Currency</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleCurrencySelect("ETB")}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  currency === "ETB" ? "bg-gold-500 text-navy-950" : "bg-navy-800 text-slate-300"
                }`}
              >
                ETB (ብር)
              </button>
              <button
                onClick={() => handleCurrencySelect("USD")}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  currency === "USD" ? "bg-gold-500 text-navy-950" : "bg-navy-800 text-slate-300"
                }`}
              >
                USD ($)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
