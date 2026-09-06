"use client";

/**
 * Mini-lecteur audio persistant flottant en bas d'écran (PersistentAudioPlayer).
 * Permet l'écoute continue pendant la navigation sur tous les écrans du tableau de bord.
 * Conforme à la charte LAHAThèque : tokens sémantiques (navy, gold), Playfair/Poppins, zéro émoji.
 */

import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  Headphones,
  RotateCcw,
  RotateCw,
} from "lucide-react";
import { useAudioPlayer } from "./audio-player-context";
import { useRouter } from "next/navigation";

export function PersistentAudioPlayer() {
  const router = useRouter();
  const {
    state,
    togglePlay,
    seek,
    seekRelative,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    toggleExpand,
    closePlayer,
  } = useAudioPlayer();

  if (!state.currentBookId) {
    return null;
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * state.duration);
  };

  const handleOpenImmersive = () => {
    toggleExpand();
    if (state.currentBookId) {
      router.push(`/student/audio/${state.currentBookId}`);
    }
  };

  return (
    <div
      className="fixed z-40 bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-8 md:w-[500px] lg:w-[560px] bg-navy-dark/95 backdrop-blur-xl border border-gold/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
      style={{
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(176, 141, 66, 0.15)",
      }}
    >
      {/* Barre de progression interactive supérieure */}
      <div
        onClick={handleProgressBarClick}
        className="w-full h-1.5 bg-navy/80 cursor-pointer relative group/progress transition-all hover:h-2"
        title="Cliquer pour naviguer dans l'audio"
      >
        <div
          className="h-full bg-gold rounded-r-full transition-all duration-150 relative"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 shadow-sm" />
        </div>
      </div>

      <div className="p-3 sm:p-4 flex items-center justify-between gap-3">
        {/* Couverture & Informations */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            onClick={handleOpenImmersive}
            className="w-12 h-12 rounded-xl bg-navy border border-border overflow-hidden shrink-0 cursor-pointer relative group"
            title="Agrandir le lecteur"
          >
            {state.currentCoverUrl ? (
              <img
                src={state.currentCoverUrl}
                alt={state.currentBookTitle}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold">
                <Headphones className="w-6 h-6" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                onClick={handleOpenImmersive}
                className="font-serif font-bold text-xs sm:text-sm text-white truncate cursor-pointer hover:text-gold transition-colors"
              >
                {state.currentBookTitle}
              </h4>
              {state.isPreview && (
                <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                  Extrait
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground-muted font-sans truncate">
              {state.currentAuthors}
            </p>
            <div className="text-[10px] text-foreground-muted tabular-nums mt-0.5">
              {formatTime(state.currentTime)} / {formatTime(state.duration)}
            </div>
          </div>
        </div>

        {/* Contrôles de lecture */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => seekRelative(-10)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer"
            title="Reculer de 10 secondes"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="absolute -bottom-1 text-[8px] font-bold text-gold/80">10</span>
          </button>

          <button
            type="button"
            onClick={togglePlay}
            disabled={state.isLoading}
            className="w-10 h-10 rounded-full bg-gold text-navy-dark flex items-center justify-center hover:bg-gold-hover hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-50"
            title={state.isPlaying ? "Mettre en pause" : "Écouter"}
          >
            {state.isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => seekRelative(10)}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer"
            title="Avancer de 10 secondes"
          >
            <RotateCw className="w-4 h-4" />
            <span className="absolute -bottom-1 text-[8px] font-bold text-gold/80">10</span>
          </button>

          {/* Volume (desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              title={state.isMuted ? "Rétablir le son" : "Couper le son"}
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={state.isMuted ? 0 : state.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-14 h-1 accent-gold cursor-pointer"
              title={`Volume : ${state.isMuted ? 0 : state.volume}%`}
            />
          </div>

          {/* Agrandir en vue immersive */}
          <button
            type="button"
            onClick={handleOpenImmersive}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer ml-1"
            title="Plein écran / Vue immersive"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Fermer */}
          <button
            type="button"
            onClick={closePlayer}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer le lecteur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
