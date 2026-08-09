"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AudiobookCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The URL or path for the book cover image. */
  imageUrl?: string;
  /** The main title of the book. */
  title: string;
  /** The author's name. */
  author: string;
  /** The category or discipline of the book. */
  category: string;
  /** The publication year. */
  year?: number;
  /** The total number of pages or chapters. */
  totalPages: number;
  /** The number of pages or chapters already read. */
  pagesRead: number;
  /** A React node for the icon (e.g. Lucide icon). */
  icon?: React.ReactNode;
}

export const AudiobookCard = React.forwardRef<HTMLDivElement, AudiobookCardProps>(
  (
    {
      className,
      imageUrl,
      title,
      author,
      category,
      year,
      totalPages,
      pagesRead,
      icon,
      ...props
    },
    ref
  ) => {
    const progressPercentage = totalPages > 0 ? Math.min(100, (pagesRead / totalPages) * 100) : 0;
    const pagesLeft = Math.max(0, totalPages - pagesRead);

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full overflow-hidden rounded-2xl p-5 text-foreground shadow-xs",
          "bg-background-secondary border border-border hover:border-gold/50 transition-colors",
          className
        )}
        {...props}
      >
        {/* Main content layout */}
        <div className="flex flex-col gap-4">
          {/* Header with Icon and Image */}
          <div className="flex items-start justify-between gap-3">
            {icon && (
              <div className="rounded-xl bg-navy text-gold p-2.5 shadow-xs">
                {icon}
              </div>
            )}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                width={96}
                height={96}
                className="h-20 w-20 rounded-xl object-cover border border-border shadow-xs shrink-0"
              />
            ) : (
              <div className="h-20 w-16 rounded-xl bg-navy-dark text-gold border border-navy-hover flex items-center justify-center font-serif text-xs font-bold text-center px-1 shrink-0">
                {title.slice(0, 10)}...
              </div>
            )}
          </div>

          {/* Book Details */}
          <div className="flex flex-col items-start space-y-1">
            <h3 className="text-lg font-serif font-bold text-navy leading-snug line-clamp-2">{title}</h3>
            <p className="text-xs text-foreground-muted font-medium">
              {author} &bull; <span className="text-gold font-semibold">{category}</span> {year ? `&bull; ${year}` : ""}
            </p>
          </div>

          {/* Progress Bar Section */}
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-full rounded-full bg-background border border-border overflow-hidden p-0.5">
              <motion.div
                className="h-full rounded-full bg-navy"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${title} progression de lecture`}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-foreground-muted">
              <span>{Math.round(progressPercentage)}% complété</span>
              <span>{pagesLeft} pages/chapitres restants</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AudiobookCard.displayName = "AudiobookCard";
