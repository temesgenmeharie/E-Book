import Link from "next/link";
import { BookOpen, ShieldCheck, CreditCard, Sparkles, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-900 text-slate-300 mt-auto border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white font-bold text-xl tracking-tight">
              <div className="w-9 h-9 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-serif tracking-normal text-2xl text-white">E-Book<span className="text-gold-400 font-sans text-xl ml-1 font-semibold">Marketplace</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The premier digital bookstore connecting readers worldwide with Ethiopian literature, academic publications, and international bestsellers. Read anywhere on any device.
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Publishing
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-gold-400" />
                Multi-Currency
              </span>
            </div>
          </div>

          {/* Explore Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/catalog" className="hover:text-white transition-colors">All Books</Link>
              </li>
              <li>
                <Link href="/catalog?sort=best_selling" className="hover:text-white transition-colors">Best Sellers</Link>
              </li>
              <li>
                <Link href="/catalog?sort=newest" className="hover:text-white transition-colors">New Arrivals</Link>
              </li>
              <li>
                <Link href="/catalog?category=ethiopian-literature" className="hover:text-white transition-colors">Ethiopian Collection</Link>
              </li>
              <li>
                <Link href="/catalog?category=technology-software" className="hover:text-white transition-colors">Technology & Software</Link>
              </li>
            </ul>
          </div>

          {/* For Authors Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Publishing</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/seller/onboarding" className="hover:text-white transition-colors">Become a Seller</Link>
              </li>
              <li>
                <Link href="/seller/dashboard" className="hover:text-white transition-colors">Author Studio</Link>
              </li>
              <li>
                <Link href="/seller/books/new" className="hover:text-white transition-colors">Upload New Book</Link>
              </li>
              <li>
                <span className="text-slate-400">85% Author Revenue Share</span>
              </li>
              <li>
                <span className="text-slate-400">Instant Telebirr & CBE Payouts</span>
              </li>
            </ul>
          </div>

          {/* Account & Support Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gold-400">Customer Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/library" className="hover:text-white transition-colors">My Library</Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-white transition-colors">Shopping Cart</Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">Customer Sign In</Link>
              </li>
              <li>
                <a href="mailto:support@ebookmarketplace.com" className="hover:text-white transition-colors">Contact Helpdesk</a>
              </li>
              <li>
                <span className="text-slate-500 text-xs">Mon-Sat • 8am - 8pm EAT</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} E-Book Marketplace Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Ethiopian Birr (ETB) & US Dollar (USD)</span>
            <span>•</span>
            <span>Chapa, Telebirr & Stripe Supported</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
