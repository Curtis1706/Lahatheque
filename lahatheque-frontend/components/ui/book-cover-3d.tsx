"use client";

import React from "react";
import { GraduationCap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookCover3DProps {
  title: string;
  authors?: string[] | string;
  discipline?: string;
  coverUrl?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
}

const SIZES = {
  xs: {
    width: "w-10 h-14",
    spine: "w-1.5",
    text: "text-[7px]",
    title: "text-[8px] line-clamp-1",
  },
  sm: {
    width: "w-16 h-22",
    spine: "w-2",
    text: "text-[8px]",
    title: "text-[9px] line-clamp-2",
  },
  md: {
    width: "w-24 h-32 sm:w-28 sm:h-38",
    spine: "w-2.5",
    text: "text-[9px]",
    title: "text-xs line-clamp-3",
  },
  lg: {
    width: "w-32 h-44 sm:w-40 sm:h-56",
    spine: "w-3.5",
    text: "text-[10px]",
    title: "text-sm line-clamp-4",
  },
  xl: {
    width: "w-44 h-60 sm:w-52 sm:h-72",
    spine: "w-4",
    text: "text-xs",
    title: "text-base line-clamp-4",
  },
};

export function BookCover3D({
  title,
  authors,
  discipline,
  coverUrl,
  className,
  size = "md",
  interactive = true,
}: BookCover3DProps) {
  const sz = SIZES[size] || SIZES.md;
  const authorList = Array.isArray(authors)
    ? authors.join(", ")
    : authors || "LAHA Éditions";

  return (
    <div
      className={cn(
        "relative rounded-r-lg rounded-l-xs overflow-hidden select-none shrink-0",
        "border border-navy/20 bg-navy-dark text-white",
        "shadow-[2px_4px_12px_rgba(0,0,0,0.25)]",
        interactive &&
          "transition-all duration-300 hover:shadow-[4px_8px_20px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:scale-[1.02]",
        sz.width,
        className
      )}
      style={{
        perspective: "800px",
      }}
    >
      {/* 3D Spine overlay effect on left */}
      <div
        className={cn(
          "absolute top-0 bottom-0 left-0 bg-black/40 border-r border-white/15 z-20 pointer-events-none",
          sz.spine
        )}
      />

      {/* 3D Page depth shadow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/15 pointer-events-none z-20" />

      {/* Realistic book lighting sheen on top-right */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 pointer-events-none z-20" />

      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover absolute inset-0 z-10"
        />
      ) : (
        <div className="flex flex-col justify-between h-full p-2 sm:p-2.5 relative z-10">
          {/* Top Discipline Tag */}
          <div className="pl-1.5 space-y-0.5 relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span
                className={cn(
                  "font-mono uppercase tracking-widest text-gold font-bold truncate max-w-[80%]",
                  sz.text
                )}
              >
                {discipline?.split(" ")[0] || "ACADÉMIQUE"}
              </span>
              <GraduationCap className="w-2.5 h-2.5 text-gold/80 shrink-0" />
            </div>
            <div className="h-0.5 w-4 bg-gold/40 rounded" />
          </div>

          {/* Center Title & Authors */}
          <div className="pl-1.5 my-auto relative z-10">
            <h4 className={cn("font-serif font-bold text-white leading-tight", sz.title)}>
              {title}
            </h4>
            <p className={cn("text-white/70 truncate mt-0.5 font-medium", sz.text)}>
              {authorList}
            </p>
          </div>

          {/* Bottom Branding */}
          <div className="pl-1.5 flex items-center justify-between border-t border-white/10 pt-1 relative z-10">
            <span className={cn("font-serif tracking-wider font-semibold text-gold/90 uppercase", sz.text)}>
              LAHA
            </span>
            <BookOpen className="w-2.5 h-2.5 text-gold/70 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}

export default BookCover3D;
