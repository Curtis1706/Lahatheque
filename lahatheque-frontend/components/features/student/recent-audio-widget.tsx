"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Play, Clock, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { getRecentAudioListenings } from "@/lib/services/audio";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { formatDuration } from "@/lib/config/audio-constants";

export interface RecentAudioItem {
  id: string;
  book_id: string;
  book_title: string;
  book_cover?: string;
  author_name?: string;
  track_title?: string;
  chapter_number?: number;
  progress_percent: number;
  duration_listened_seconds: number;
  total_duration_seconds?: number;
  last_listened_at?: string;
}

export function RecentAudioWidget() {
  const [listenings, setListenings] = useState<RecentAudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { playBook } = useAudioPlayer();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getRecentAudioListenings();
        if (isMounted && Array.isArray(data)) {
          setListenings(data);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des écoutes audio:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-background rounded-3xl border border-border p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-navy/10 rounded animate-pulse" />
          <div className="h-4 w-20 bg-navy/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-28 rounded-2xl bg-background-secondary border border-border animate-pulse" />
          <div className="h-28 rounded-2xl bg-background-secondary border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (listenings.length === 0) {
    return (
      <div className="bg-background rounded-3xl border border-border p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-navy/5 border border-navy/10 flex items-center justify-center text-navy shrink-0">
            <Headphones className="w-6 h-6 text-gold" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base">
              Explorez nos Livres Audio
            </h3>
            <p className="text-xs text-foreground-muted max-w-md">
              Écoutez vos manuels et œuvres littéraires narrés en studio professionnel avec double voix masculine et féminine.
            </p>
          </div>
        </div>
        <Link
          href="/catalog?format=audio"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all shrink-0 shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          Découvrir le catalogue audio
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-3xl border border-border p-6 shadow-xs space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-navy/10 flex items-center justify-center text-navy">
            <Headphones className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-navy text-base leading-tight">
              Mes Écoutes Audio en Cours
            </h2>
            <p className="text-[11px] text-foreground-muted">
              Reprenez instantanément là où vous vous êtes arrêté
            </p>
          </div>
        </div>

        <Link
          href="/catalog?format=audio"
          className="text-xs font-semibold text-gold hover:text-gold-hover inline-flex items-center gap-1 transition-colors"
        >
          <span>Voir tout l'audio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cartes d'écoutes récentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listenings.slice(0, 4).map((item) => {
          const percent = Math.min(100, Math.max(0, item.progress_percent || 0));

          return (
            <div
              key={item.id}
              className="group p-4 rounded-2xl bg-background-secondary border border-border hover:border-gold/60 transition-all flex items-center gap-3.5 shadow-xs"
            >
              {/* Miniature Couverture */}
              <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-navy/10 border border-border shrink-0 flex items-center justify-center shadow-xs">
                {item.book_cover ? (
                  <img
                    src={item.book_cover}
                    alt={item.book_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Headphones className="w-5 h-5 text-gold" />
                )}
                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-4 h-4 text-white fill-white" />
                </div>
              </div>

              {/* Détails & Barre de progression */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div>
                  <h4 className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-1 group-hover:text-gold transition-colors">
                    {item.book_title}
                  </h4>
                  <p className="text-[11px] text-foreground-muted truncate">
                    {item.track_title || (item.chapter_number ? `Chapitre ${item.chapter_number}` : "Livre complet")}
                    {item.author_name ? ` • ${item.author_name}` : ""}
                  </p>
                </div>

                {/* Jauge de progression */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-foreground-muted font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(item.duration_listened_seconds)}
                      {item.total_duration_seconds ? ` / ${formatDuration(item.total_duration_seconds)}` : ""}
                    </span>
                    <span className="font-bold text-navy">{percent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-navy/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bouton Reprendre */}
              <div className="shrink-0 pl-1">
                <Link
                  href={`/listen/${item.book_id}`}
                  className="w-9 h-9 rounded-xl bg-navy text-white hover:bg-gold hover:text-navy transition-all flex items-center justify-center shadow-xs cursor-pointer group-hover:scale-105"
                  title={`Reprendre l'écoute de ${item.book_title}`}
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
