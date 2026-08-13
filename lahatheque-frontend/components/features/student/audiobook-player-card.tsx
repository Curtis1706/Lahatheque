"use client";

import React, { useState } from "react";
import { Play, Pause, Headphones, RotateCcw, FastForward, Volume2, ShieldCheck } from "lucide-react";
import type { ClientBookAccess } from "@/lib/types/student";

interface AudiobookPlayerCardProps {
  book: ClientBookAccess;
  className?: string;
}

export function AudiobookPlayerCard({ book, className }: AudiobookPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs ${className}`}>
      <div className="flex items-center gap-4">
        {/* Cover image */}
        <div className="w-16 h-20 rounded-2xl bg-navy overflow-hidden shrink-0 shadow-sm relative border border-border">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Headphones className="w-6 h-6 text-gold" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gold/15 text-gold text-[10px] font-mono font-bold uppercase mb-1">
            <Headphones className="w-3 h-3" />
            Livre Audio Streaming
          </div>
          <h3 className="font-serif font-bold text-navy text-sm truncate">{book.title}</h3>
          <p className="text-xs text-foreground-muted truncate">Par {book.author}</p>
          {book.last_read_chapter && (
            <p className="text-[11px] text-navy font-semibold mt-1 truncate">{book.last_read_chapter}</p>
          )}
        </div>
      </div>

      {/* Barre de progression d'écoute 21st.dev AudiobookCard id: 7903 */}
      <div className="space-y-1.5 pt-2 border-t border-border">
        <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted">
          <span>01:42:15</span>
          <span className="font-bold text-navy">{book.progress_percent}% écoutes</span>
          <span>{book.audio_duration_minutes ? `${book.audio_duration_minutes} min` : "05:40:00"}</span>
        </div>

        <div className="w-full h-2 rounded-full bg-background-secondary border border-border overflow-hidden">
          <div
            className="h-full bg-gold transition-all duration-300 rounded-full"
            style={{ width: `${book.progress_percent}%` }}
          />
        </div>
      </div>

      {/* Player Controls 21st.dev Podcast Card Player id: 7979 */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-2.5 py-1 rounded-xl bg-background-secondary border border-border text-[11px] font-mono font-bold text-navy hover:border-gold transition-colors"
          title="Vitesse de lecture"
        >
          {playbackSpeed}x
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-2 rounded-xl text-foreground-muted hover:text-navy transition-colors"
            title="Reculer de 15s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="p-3.5 rounded-2xl bg-navy text-white hover:bg-navy-hover transition-colors shadow-xs"
          >
            {isPlaying ? <Pause className="w-5 h-5 text-gold" /> : <Play className="w-5 h-5 text-gold ml-0.5" />}
          </button>

          <button
            type="button"
            className="p-2 rounded-xl text-foreground-muted hover:text-navy transition-colors"
            title="Avancer de 15s"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        <span className="text-[10px] text-foreground-muted font-mono flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-gold" /> DRM Audio
        </span>
      </div>
    </div>
  );
}
