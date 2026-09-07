"use client";

/**
 * Page publique d'écoute d'extrait audio — /preview/[id]
 * Accessible sans authentification. Lecteur <audio> HTML natif.
 * Limite 180 secondes enforced côté serveur ET côté client.
 * Charte LAHAThèque : tokens sémantiques, Playfair/Poppins, zéro emoji, icônes Lucide.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Pause,
  ArrowLeft,
  Headphones,
  ShoppingCart,
  BookOpen,
  Volume2,
  VolumeX,
  RotateCcw,
  LogIn,
} from "lucide-react";

const PREVIEW_HARD_LIMIT = 180; // secondes — miroir de la constante backend

interface PreviewData {
  ouvrage_id: string;
  title: string;
  cover_url: string | null;
  authors: string[];
  audio_url: string;
  preview_limit_seconds: number;
  track_title: string;
  track_duration_seconds: number | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PublicPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);
  const limit = data?.preview_limit_seconds ?? PREVIEW_HARD_LIMIT;

  // Chargement des données depuis le BFF → backend public
  useEffect(() => {
    if (!bookId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/bff/audio/ouvrages/${bookId}/public-preview/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // Pas de credentials: 'include' — route publique, aucun cookie requis
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "Extrait audio indisponible pour le moment.");
        }
      })
      .catch(() => setError("Impossible de charger l'extrait audio."))
      .finally(() => setLoading(false));
  }, [bookId]);

  // Enforcement côté client de la limite 180s
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    setCurrentTime(t);

    if (t >= limit && !previewEnded) {
      audio.pause();
      audio.currentTime = limit;
      setIsPlaying(false);
      setPreviewEnded(true);
    }
  }, [limit, previewEnded]);

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // On plafonne la durée affichée à la limite preview
    setDuration(Math.min(audio.duration || PREVIEW_HARD_LIMIT, limit));
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || previewEnded) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.warn);
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    setPreviewEnded(false);
    audio.play().catch(console.warn);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Math.min(Number(e.target.value), limit);
    audio.currentTime = val;
    setCurrentTime(val);
    if (val < limit) setPreviewEnded(false);
  };

  const progress = limit > 0 ? Math.min((currentTime / limit) * 100, 100) : 0;
  const authorLabel = data?.authors?.join(", ") || "Auteur LAHAThèque";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* En-tête minimal */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-background-secondary/60">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-gold transition-colors cursor-pointer"
          title="Retour au catalogue"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </button>

        <Link
          href="/catalog"
          className="font-serif font-bold text-navy text-sm tracking-tight"
        >
          LAHAThèque
        </Link>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors"
          title="Se connecter"
        >
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Se connecter</span>
        </Link>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg space-y-6">

          {loading && (
            <div className="text-center space-y-3 py-16">
              <Headphones className="w-10 h-10 text-gold mx-auto animate-pulse" />
              <p className="text-sm text-foreground-muted font-sans">
                Chargement de l&apos;extrait audio…
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center space-y-4 py-12 bg-background-secondary rounded-3xl border border-border p-8">
              <Headphones className="w-12 h-12 text-foreground-muted mx-auto" />
              <h2 className="font-serif font-bold text-navy text-lg">
                Extrait indisponible
              </h2>
              <p className="text-sm text-foreground-muted max-w-sm mx-auto">{error}</p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                Parcourir le catalogue
              </Link>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Carte livre + lecteur */}
              <div className="bg-background-secondary border border-border rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">

                {/* Identité de l'ouvrage */}
                <div className="flex items-start gap-4">
                  {data.cover_url ? (
                    <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0 border border-border shadow-md">
                      <img
                        src={data.cover_url}
                        alt={data.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-24 rounded-lg shrink-0 bg-navy flex items-center justify-center border border-gold/30 shadow-md">
                      <BookOpen className="w-7 h-7 text-gold" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-navy">
                      <Headphones className="w-3 h-3 text-gold" />
                      Extrait Audio Gratuit
                    </span>
                    <h1 className="font-serif font-bold text-navy text-base sm:text-lg leading-snug line-clamp-2">
                      {data.title}
                    </h1>
                    <p className="text-xs text-foreground-muted font-sans">
                      Par <span className="text-navy font-semibold">{authorLabel}</span>
                    </p>
                    {data.track_title && data.track_title !== data.title && (
                      <p className="text-[10px] text-foreground-muted font-mono">
                        {data.track_title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Badge limite */}
                <div className="flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-foreground-muted bg-background border border-border px-3 py-1 rounded-full">
                    Écoute limitée à {formatTime(limit)} — Extrait découverte
                  </span>
                </div>

                {/* Lecteur audio */}
                <div className="space-y-4">
                  {/* Barre de progression */}
                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min={0}
                      max={limit}
                      step={0.5}
                      value={Math.min(currentTime, limit)}
                      onChange={handleSeek}
                      disabled={previewEnded}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-navy bg-border"
                      aria-label="Position de lecture"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-foreground-muted">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(limit)}</span>
                    </div>
                  </div>

                  {/* Contrôles */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-2 rounded-full hover:bg-background text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                      title={isMuted ? "Réactiver le son" : "Couper le son"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>

                    {previewEnded ? (
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="w-14 h-14 rounded-full bg-navy hover:bg-navy-hover text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                        title="Réécouter l'extrait"
                      >
                        <RotateCcw className="w-6 h-6" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="w-14 h-14 rounded-full bg-navy hover:bg-navy-hover text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                        title={isPlaying ? "Pause" : "Écouter l'extrait"}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>
                    )}

                    {/* Placeholder pour alignement symétrique */}
                    <div className="w-9" aria-hidden="true" />
                  </div>
                </div>

                {/* Élément audio HTML natif */}
                <audio
                  ref={audioRef}
                  src={data.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => {
                    setIsPlaying(false);
                    setPreviewEnded(true);
                  }}
                  preload="metadata"
                  style={{ display: "none" }}
                  aria-hidden="true"
                />
              </div>

              {/* CTA fin d'extrait ou permanent */}
              <div className={`bg-navy rounded-3xl p-6 sm:p-8 space-y-4 text-center transition-all duration-500 ${previewEnded ? "ring-2 ring-gold/40" : ""}`}>
                {previewEnded && (
                  <p className="text-gold font-serif font-bold text-sm">
                    Vous avez atteint la fin de l&apos;extrait.
                  </p>
                )}
                <p className="text-white/80 text-xs sm:text-sm font-sans leading-relaxed">
                  Pour accéder à l&apos;intégralité de l&apos;œuvre, achetez-la ou connectez-vous si vous avez déjà un abonnement.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/catalog/${bookId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-colors shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Voir & acheter l&apos;ouvrage
                  </Link>
                  <Link
                    href={`/login?next=/catalog/${bookId}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors border border-white/20"
                  >
                    <LogIn className="w-4 h-4" />
                    Se connecter
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
