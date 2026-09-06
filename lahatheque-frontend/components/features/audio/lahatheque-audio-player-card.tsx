"use client";

/**
 * Composant de Carte Lecteur Audio Haute Fidélité (LahathequeAudioPlayerCard).
 * Adapté du modèle de lecteur immersif aux tokens sémantiques LAHAThèque :
 * Fond Navy/Navy-Dark, lueur et accents Or (Gold), typographie Playfair Display & Poppins,
 * ondes sonores animées, scrubbing interactif et zéro émoji.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  RotateCw,
  Headphones,
  BookOpen,
  Sparkles,
  Share2,
} from "lucide-react";
import { useAudioPlayer } from "./audio-player-context";
import { toast } from "sonner";

interface LahathequeAudioPlayerCardProps {
  onOpenReader?: () => void;
  className?: string;
}

export function LahathequeAudioPlayerCard({
  onOpenReader,
  className = "",
}: LahathequeAudioPlayerCardProps) {
  const {
    state,
    togglePlay,
    seek,
    seekRelative,
    setVolume,
    toggleMute,
    setPlaybackRate,
    nextTrack,
    previousTrack,
  } = useAudioPlayer();

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState<boolean>(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState<boolean>(false);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);

  const duration = state.duration || 1;
  const currentTime = state.currentTime;
  const progressPercent = Math.min(100, (currentTime / duration) * 100);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleProgressChange = (e: MouseEvent | React.MouseEvent) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingProgress(true);
    handleProgressChange(e);

    const handleMouseMoveDoc = (event: MouseEvent) => handleProgressChange(event);
    const handleMouseUpDoc = () => {
      setIsDraggingProgress(false);
      document.removeEventListener("mousemove", handleMouseMoveDoc);
      document.removeEventListener("mouseup", handleMouseUpDoc);
    };

    document.addEventListener("mousemove", handleMouseMoveDoc);
    document.addEventListener("mouseup", handleMouseUpDoc);
  };

  const handleVolumeChange = (e: MouseEvent | React.MouseEvent) => {
    if (!volumeBarRef.current) return;
    const rect = volumeBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(Math.round(ratio * 100));
  };

  const handleVolumeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDraggingVolume(true);
    handleVolumeChange(e);

    const handleMouseMoveDoc = (event: MouseEvent) => handleVolumeChange(event);
    const handleMouseUpDoc = () => {
      setIsDraggingVolume(false);
      document.removeEventListener("mousemove", handleMouseMoveDoc);
      document.removeEventListener("mouseup", handleMouseUpDoc);
    };

    document.addEventListener("mousemove", handleMouseMoveDoc);
    document.addEventListener("mouseup", handleMouseUpDoc);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien d'écoute copié dans le presse-papier !");
    }
  };

  const rates = [0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full max-w-sm sm:max-w-md rounded-2xl overflow-hidden relative group border border-gold/30 bg-navy-dark select-none shadow-2xl transition-all duration-500 ${className}`}
      style={{
        background:
          "radial-gradient(40% 50% at 50% 25%, rgba(176, 141, 66, 0.15), rgba(15, 26, 51, 0.98))",
        boxShadow:
          "0px 1px 0px 0px rgba(255, 255, 255, 0.08) inset, 0px 0px 30px 5px rgba(176, 141, 66, 0.08), 0 20px 40px -10px rgba(0, 0, 0, 0.6)",
      }}
    >
      {/* Lueur d'ambiance interactive dorée */}
      <div
        className="absolute w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(176, 141, 66, 0.18) 0%, transparent 60%)`,
          filter: "blur(25px)",
        }}
      />

      {/* En-tête de la carte */}
      <div className="p-5 sm:p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-navy border border-gold/40 relative shadow-md"
              style={{
                boxShadow: isHovered
                  ? "0 0 15px rgba(176, 141, 66, 0.3)"
                  : "none",
                transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <Headphones
                className="w-6 h-6 text-gold transition-transform duration-500"
                style={{
                  transform: isHovered ? "scale(1.1)" : "scale(1)",
                  filter: isHovered
                    ? "drop-shadow(0 0 4px rgba(176, 141, 66, 0.5))"
                    : "none",
                }}
              />
            </div>

            <div>
              <div className="text-white font-serif font-bold text-base sm:text-lg tracking-tight">
                LAHAThèque Audio
              </div>
              <div className="text-[11px] font-sans font-medium text-gold tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 inline" />
                <span>Écoute Haute Fidélité</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenReader && (
              <button
                type="button"
                onClick={onOpenReader}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy/80 border border-gold/30 text-gold text-xs font-medium hover:bg-gold/10 transition-colors cursor-pointer"
                title="Consulter également la version écrite (PDF)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Version Écrite</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-navy/60 border border-border flex items-center justify-center text-white/70 hover:text-gold hover:bg-navy transition-colors cursor-pointer"
              title="Partager"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Badge d'extrait si applicable */}
        {state.isPreview && (
          <div className="mb-3 px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-between text-xs text-gold font-medium">
            <span>Extrait gratuit autorisé (3:00 max)</span>
            <span className="text-[10px] uppercase font-bold tracking-wider underline cursor-pointer">
              Débloquer l&apos;intégrale
            </span>
          </div>
        )}
      </div>

      {/* Couverture de l'ouvrage */}
      <div
        className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto rounded-2xl overflow-hidden border border-border shadow-xl bg-navy"
        style={{
          boxShadow: isHovered
            ? "0 20px 35px -10px rgba(0, 0, 0, 0.6), 0 0 15px rgba(176, 141, 66, 0.25)"
            : "0 10px 20px -5px rgba(0, 0, 0, 0.4)",
          transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {state.currentCoverUrl ? (
          <img
            src={state.currentCoverUrl}
            alt={state.currentBookTitle}
            className="w-full h-full object-cover transition-transform duration-700"
            style={{
              transform: isHovered ? "scale(1.03)" : "scale(1)",
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gold/60 p-4 text-center">
            <BookOpen className="w-12 h-12 mb-2" />
            <span className="font-serif text-xs text-white">
              {state.currentBookTitle || "Ouvrage LAHAThèque"}
            </span>
          </div>
        )}

        {/* Bouton de lecture central flottant au survol */}
        <div
          className="absolute inset-0 bg-navy-dark/40 backdrop-blur-xs flex items-center justify-center transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <button
            type="button"
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-gold text-navy-dark flex items-center justify-center shadow-2xl hover:scale-110 hover:bg-gold-hover transition-all cursor-pointer"
            style={{
              boxShadow: "0 0 25px rgba(176, 141, 66, 0.6)",
            }}
          >
            {state.isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 ml-1 fill-current" />
            )}
          </button>
        </div>
      </div>

      {/* Ondes sonores animées dorées */}
      <div className="flex justify-center items-end gap-1.5 mt-4 mb-2 h-7 px-4">
        {state.isPlaying ? (
          [1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="w-1 bg-gold rounded-full transition-all"
              style={{
                height: `${Math.sin(Date.now() / 300 + i * 0.6) * 8 + 12}px`,
                opacity: 0.85,
                animation: `audioWave${i} 1.${i}s ease-in-out infinite alternate`,
                filter: "drop-shadow(0 0 2px rgba(176, 141, 66, 0.6))",
              }}
            />
          ))
        ) : (
          <div className="text-[11px] text-foreground-muted font-sans">
            Lecture en pause
          </div>
        )}
      </div>

      {/* Informations sur la piste */}
      <div className="px-6 text-center space-y-1 mb-4">
        <h3 className="font-serif font-bold text-white text-base sm:text-lg truncate">
          {state.currentBookTitle || "Sélectionnez un ouvrage"}
        </h3>
        <p className="text-xs text-foreground-muted font-sans truncate">
          {state.currentAuthors || "LAHA Éditions"}
        </p>
      </div>

      {/* Panneau de contrôle inférieur */}
      <div className="bg-navy/90 backdrop-blur-md p-4 sm:p-5 border-t border-border rounded-b-2xl space-y-4">
        {/* Barre de progression avec scrubber */}
        <div>
          <div
            ref={progressBarRef}
            onMouseDown={handleProgressMouseDown}
            className="w-full h-2 bg-navy-dark rounded-full cursor-pointer relative overflow-hidden group/bar transition-all"
            title="Naviguer dans la piste"
          >
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-hover rounded-full transition-all duration-100 relative"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-foreground-muted tabular-nums mt-1.5 font-sans">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Boutons principaux */}
        <div className="flex items-center justify-between">
          {/* Sélecteur de vitesse */}
          <div className="flex items-center gap-1">
            <select
              value={state.playbackRate}
              onChange={(e) => setPlaybackRate(Number(e.target.value))}
              className="bg-navy-dark text-gold text-[11px] font-bold rounded-lg px-2 py-1 border border-gold/30 focus:outline-hidden cursor-pointer"
              title="Vitesse de lecture"
            >
              {rates.map((r) => (
                <option key={r} value={r}>
                  {r}x
                </option>
              ))}
            </select>
          </div>

          {/* Contrôles de lecture */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={previousTrack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer"
              title="Piste précédente"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => seekRelative(-15)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer"
              title="Reculer de 15 secondes"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-gold text-navy-dark flex items-center justify-center shadow-lg hover:bg-gold-hover hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={state.isPlaying ? "Mettre en pause" : "Lancer la lecture"}
            >
              {state.isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 ml-0.5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekRelative(15)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer"
              title="Avancer de 15 secondes"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-gold hover:bg-white/5 transition-colors cursor-pointer"
              title="Piste suivante"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Contrôle du volume */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-gold transition-colors cursor-pointer"
              title={state.isMuted ? "Rétablir le son" : "Couper le son"}
            >
              {state.isMuted || state.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <div
              ref={volumeBarRef}
              onMouseDown={handleVolumeMouseDown}
              className="w-14 sm:w-16 h-1.5 bg-navy-dark rounded-full cursor-pointer relative overflow-hidden"
              title={`Volume : ${state.isMuted ? 0 : state.volume}%`}
            >
              <div
                className="h-full bg-gold rounded-full transition-all"
                style={{ width: `${state.isMuted ? 0 : state.volume}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes audioWave1 {
          0% { height: 6px; }
          100% { height: 20px; }
        }
        @keyframes audioWave2 {
          0% { height: 10px; }
          100% { height: 16px; }
        }
        @keyframes audioWave3 {
          0% { height: 8px; }
          100% { height: 24px; }
        }
        @keyframes audioWave4 {
          0% { height: 14px; }
          100% { height: 28px; }
        }
        @keyframes audioWave5 {
          0% { height: 10px; }
          100% { height: 22px; }
        }
        @keyframes audioWave6 {
          0% { height: 6px; }
          100% { height: 18px; }
        }
        @keyframes audioWave7 {
          0% { height: 4px; }
          100% { height: 14px; }
        }
      `}</style>
    </div>
  );
}
