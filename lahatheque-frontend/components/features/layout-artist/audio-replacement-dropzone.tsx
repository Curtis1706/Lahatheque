"use client";

import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Headphones,
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  FileAudio,
} from "lucide-react";
import { toast } from "sonner";
import { uploadAudioTrack } from "@/lib/services/audio";
import { InlineLoader } from "@/components/ui/page-loader";

interface AudioReplacementDropzoneProps {
  bookId: string;
  bookTitle?: string;
  currentAudioUrl?: string;
  currentDurationSeconds?: number;
  onSuccess?: () => void;
  className?: string;
}

export function AudioReplacementDropzone({
  bookId,
  bookTitle,
  currentAudioUrl,
  currentDurationSeconds,
  onSuccess,
  className = "",
}: AudioReplacementDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState("Version Intégrale");
  const [trackNumber, setTrackNumber] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, "0")}m`;
    }
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const handleFile = (file: File) => {
    const validExts = [".mp3", ".m4a", ".aac", ".flac", ".wav", ".ogg"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExts.includes(ext) && !file.type.startsWith("audio/")) {
      setError("Format audio non supporté. Veuillez sélectionner un fichier MP3, M4A, AAC ou WAV.");
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale autorisée (500 Mo).");
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Extraction de la durée via HTMLAudioElement
    const tempUrl = URL.createObjectURL(file);
    const audio = new Audio(tempUrl);
    audio.onloadedmetadata = () => {
      setDetectedDuration(Math.round(audio.duration));
      URL.revokeObjectURL(tempUrl);
    };
    audio.onerror = () => {
      setDetectedDuration(null);
      URL.revokeObjectURL(tempUrl);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const startUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(15);
    setError(null);

    // Simuler la progression du téléversement HTTP avec montée fluide
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + 10;
      });
    }, 250);

    try {
      await uploadAudioTrack(
        bookId,
        selectedFile,
        trackTitle.trim() || selectedFile.name.replace(/\.[^/.]+$/, ""),
        detectedDuration ?? undefined,
        true
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      await new Promise((r) => setTimeout(r, 400));
      toast.success("Audio remplacé avec succès. Les flux de streaming ont été actualisés.");

      setSelectedFile(null);
      setDetectedDuration(null);
      setShowConfirmModal(false);
      onSuccess?.();
    } catch (err: unknown) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : "Erreur lors du remplacement du fichier audio.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gold/15 text-navy flex items-center justify-center border border-gold/30">
            <Headphones className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-navy text-base">
              Gestion de la Piste Audio
            </h3>
            <p className="text-xs text-foreground-muted">
              {currentDurationSeconds
                ? `Version audio active (${formatTime(currentDurationSeconds)}). Vous pouvez la remplacer.`
                : "Aucune piste audio n'est actuellement liée à cet ouvrage."}
            </p>
          </div>
        </div>

        {currentDurationSeconds && (
          <span className="px-3 py-1 rounded-full bg-gold/15 text-navy font-bold text-xs border border-gold/30 flex items-center gap-1.5 shrink-0">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span>{formatTime(currentDurationSeconds)}</span>
          </span>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Zone Drag & Drop */}
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? "border-gold bg-gold/10 scale-[1.01]"
              : "border-border hover:border-gold/60 bg-background-secondary"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.aac,.flac,.wav"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-gold" />
          </div>
          <div className="space-y-1">
            <p className="font-serif font-bold text-navy text-sm">
              {currentDurationSeconds
                ? "Glissez le nouvel enregistrement audio pour remplacer l'existant"
                : "Glissez le fichier audio du livre ici"}
            </p>
            <p className="text-xs text-foreground-muted">
              Formats acceptés : MP3, M4A, AAC, WAV, FLAC (Jusqu&apos;à 500 Mo)
            </p>
          </div>
          <button
            type="button"
            className="mt-1 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[38px] shadow-xs cursor-pointer"
          >
            Sélectionner un fichier
          </button>
        </div>
      ) : (
        /* Fichier sélectionné & préparation upload */
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gold/15 text-navy flex items-center justify-center shrink-0 border border-gold/30">
                <FileAudio className="w-5 h-5 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-navy truncate">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
                  <span>{(selectedFile.size / (1024 * 1024)).toFixed(1)} Mo</span>
                  {detectedDuration && (
                    <>
                      <span>•</span>
                      <span className="text-navy font-bold">{formatTime(detectedDuration)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!uploading && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setDetectedDuration(null);
                }}
                className="p-1.5 rounded-lg hover:bg-background text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                title="Retirer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
                Intitulé de la piste
              </label>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold"
                placeholder="Ex: Chapitres 1 à 12..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
                Piste N°
              </label>
              <input
                type="number"
                value={trackNumber}
                onChange={(e) => setTrackNumber(Number(e.target.value) || 1)}
                min={1}
                disabled={uploading}
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          {/* Barre de progression pendant l'upload */}
          {uploading && (
            <div className="space-y-2 pt-2">
              <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border">
                <div
                  className="bg-gold h-full rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-foreground-muted">
                <span className="flex items-center gap-1.5">
                  <InlineLoader size={12} />
                  <span>Traitement et encodage du flux HLS...</span>
                </span>
                <span className="font-bold text-navy">{uploadProgress}%</span>
              </div>
            </div>
          )}

          {!uploading && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setDetectedDuration(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-navy hover:bg-background transition-colors min-h-[40px] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentDurationSeconds) {
                    setShowConfirmModal(true);
                  } else {
                    startUpload();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 min-h-[40px] shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-gold" />
                <span>{currentDurationSeconds ? "Remplacer l'audio" : "Téléverser l'audio"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmation de remplacement */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/80 p-4">
          <div className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 text-navy flex items-center justify-center border border-gold/30">
              <AlertCircle className="w-6 h-6 text-gold" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-serif font-bold text-navy text-lg">
                Confirmer le remplacement de la piste audio ?
              </h4>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Vous vous apprêtez à remplacer l&apos;enregistrement audio existant pour
                « {bookTitle || "cet ouvrage"} ». Cette opération écrasera la piste sur Cloudflare Stream
                et recalculera la durée totale de lecture ({detectedDuration ? formatTime(detectedDuration) : "nouvelle durée"}).
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/20 text-[11px] text-navy">
              <strong>Notice Juridique :</strong> Le pôle juridique et la direction de maquette seront informés de cette mise à jour.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-navy hover:bg-background-secondary transition-colors min-h-[40px] cursor-pointer"
              >
                Conserver l&apos;existant
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  startUpload();
                }}
                className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 min-h-[40px] shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-gold" />
                <span>Confirmer et Remplacer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
