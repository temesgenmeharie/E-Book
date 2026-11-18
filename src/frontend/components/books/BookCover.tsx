"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

interface BookCoverProps {
  coverUrl?: string | null;
  title: string;
  authorName?: string;
  aspectRatio?: string;
  className?: string;
}

export function BookCover({
  coverUrl,
  title,
  authorName,
  aspectRatio = "aspect-[1/1.45]",
  className = "",
}: BookCoverProps) {
  const [imageError, setImageError] = useState(false);

  const hasValidImage = Boolean(coverUrl && !imageError && (coverUrl.startsWith("http") || coverUrl.startsWith("/")));

  if (hasValidImage) {
    return (
      <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-md bg-slate-100 shadow-sm transition-transform duration-300 ${className}`}>
        <img
          src={coverUrl!}
          alt={title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center"
          loading="lazy"
        />
        {/* Subtle inner page-crease shadow for realistic book feel */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Elegant Editorial Fallback Cover
  // Choose consistent palette based on title length
  const palettes = [
    { bg: "bg-gradient-to-br from-navy-900 to-navy-950", accent: "border-gold-400/40 text-gold-400" },
    { bg: "bg-gradient-to-br from-emerald-950 to-navy-950", accent: "border-emerald-400/40 text-emerald-400" },
    { bg: "bg-gradient-to-br from-[#2D1B36] to-navy-950", accent: "border-purple-300/40 text-purple-200" },
    { bg: "bg-gradient-to-br from-[#3b2716] to-[#1a110a]", accent: "border-amber-400/40 text-amber-300" },
  ];
  const palette = palettes[title.length % palettes.length];

  return (
    <div
      className={`relative ${aspectRatio} w-full rounded-md ${palette.bg} p-4 flex flex-col justify-between text-white shadow-sm overflow-hidden select-none border border-slate-700/30 ${className}`}
    >
      {/* Decorative Book Spine Shadow */}
      <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none" />
      
      {/* Editorial Frame */}
      <div className={`absolute inset-2 border ${palette.accent} rounded-sm pointer-events-none opacity-40`} />

      {/* Top Header / Emblem */}
      <div className="relative z-10 flex items-center justify-between">
        <BookOpen className={`w-4 h-4 ${palette.accent}`} />
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Edition</span>
      </div>

      {/* Title in Serif */}
      <div className="relative z-10 my-auto text-center px-2">
        <h3 className="font-serif text-sm sm:text-base font-bold leading-snug line-clamp-3 text-slate-100">
          {title}
        </h3>
        {authorName && (
          <p className="mt-2 text-[11px] font-sans text-slate-300 tracking-wide line-clamp-1">
            {authorName}
          </p>
        )}
      </div>

      {/* Bottom Emblem */}
      <div className="relative z-10 text-center">
        <div className="inline-block w-6 h-0.5 bg-gold-400/50 rounded-full" />
      </div>
    </div>
  );
}
