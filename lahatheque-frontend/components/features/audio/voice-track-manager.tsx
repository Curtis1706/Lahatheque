"use client";

import React from "react";
import { Upload, Trash2, Plus, Music, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { VoiceTrackGroup, AudioChapterItem } from "@/lib/types/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

interface VoiceTrackManagerProps {
  gender: "male" | "female";
  title: string;
  tracks: VoiceTrackGroup;
  onChange: (updatedTracks: VoiceTrackGroup) => void;
}

export function VoiceTrackManager({ gender, title, tracks, onChange }: VoiceTrackManagerProps) {
  const hasFullTrack = Boolean(tracks.full_track.file || tracks.full_track.file_url);
  const chaptersWithFiles = tracks.chapters.filter((c) => Boolean(c.file || c.file_url)).length;
  const totalChapters = tracks.chapters.length;

  // Calcul du statut de complétude
  let statusText = "Non commencé";
  let statusColor = "text-foreground-muted bg-background-secondary border-border";

  if (hasFullTrack && chaptersWithFiles > 0) {
    statusText = "Complet";
    statusColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
  } else if (hasFullTrack || chaptersWithFiles > 0) {
    statusText = "Partiel";
    statusColor = "text-gold bg-gold/10 border-gold/30";
  }

  // Gestion du Livre Complet
  const handleFullFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Détection de la durée audio via élément Audio HTML5
    const audioObj = new Audio();
    audioObj.src = URL.createObjectURL(file);
    audioObj.onloadedmetadata = () => {
      onChange({
        ...tracks,
        full_track: {
          ...tracks.full_track,
          file,
          duration_seconds: Math.round(audioObj.duration) || 0,
          status: "ready",
        },
      });
    };
  };

  const removeFullFile = () => {
    onChange({
      ...tracks,
      full_track: {
        file: null,
        file_url: undefined,
        duration_seconds: 0,
        status: "idle",
        progress: 0,
      },
    });
  };

  // Gestion des Chapitres Dynamiques
  const addChapter = () => {
    const newChapter: AudioChapterItem = {
      id: `chap_${Date.now()}`,
      title: `Chapitre ${tracks.chapters.length + 1}`,
      file: null,
      duration_seconds: 0,
      order_index: tracks.chapters.length + 1,
      status: "idle",
      progress: 0,
    };
    onChange({
      ...tracks,
      chapters: [...tracks.chapters, newChapter],
    });
  };

  const updateChapterTitle = (index: number, newTitle: string) => {
    const updated = [...tracks.chapters];
    updated[index].title = newTitle;
    onChange({ ...tracks, chapters: updated });
  };

  const handleChapterFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    const audioObj = new Audio();
    audioObj.src = URL.createObjectURL(file);
    audioObj.onloadedmetadata = () => {
      const updated = [...tracks.chapters];
      updated[index] = {
        ...updated[index],
        file,
        duration_seconds: Math.round(audioObj.duration) || 0,
        status: "ready",
      };
      onChange({ ...tracks, chapters: updated });
    };
  };

  const removeChapter = (index: number) => {
    const updated = tracks.chapters.filter((_, i) => i !== index);
    onChange({ ...tracks, chapters: updated });
  };

  return (
    <div className="rounded-2xl border border-border bg-background-secondary p-5 sm:p-6 space-y-6 shadow-xs">
      {/* En-tête de la section Voix */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-navy text-gold flex items-center justify-center font-bold text-xs">
            {gender === "male" ? "VH" : "VF"}
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-navy">{title}</h3>
            <span className="text-[11px] text-foreground-muted">
              Livre complet &amp; découpage par chapitres
            </span>
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
          {statusText}
        </span>
      </div>

      {/* 1. Bloc Livre Complet */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-gold" />
          Livre complet – {gender === "male" ? "Voix Homme" : "Voix Femme"}
        </label>

        {tracks.full_track.file || tracks.full_track.file_url ? (
          <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-navy/5 text-navy flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-navy truncate">
                  {tracks.full_track.file?.name || "Fichier audio existant"}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-foreground-muted font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gold" />
                    {formatAudioDuration(tracks.full_track.duration_seconds)}
                  </span>
                  {tracks.full_track.file && (
                    <span>• {(tracks.full_track.file.size / (1024 * 1024)).toFixed(1)} Mo</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={removeFullFile}
              className="p-2 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Supprimer ce fichier"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="border-2 border-dashed border-border hover:border-gold/60 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer bg-background hover:bg-background-secondary transition-all">
            <Upload className="w-6 h-6 text-foreground-muted mb-2" />
            <span className="text-xs font-semibold text-navy">
              Téléverser le fichier audio complet (MP3, M4A)
            </span>
            <span className="text-[10px] text-foreground-muted mt-1">
              Fichier unique jusqu'à 500 Mo
            </span>
            <input
              type="file"
              accept=".mp3,.m4a,.aac,.wav"
              onChange={handleFullFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* 2. Bloc Chapitres Dynamiques */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-gold" />
            Chapitres – {gender === "male" ? "Voix Homme" : "Voix Femme"} ({tracks.chapters.length})
          </label>
          <button
            type="button"
            onClick={addChapter}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-gold" />
            Ajouter un chapitre
          </button>
        </div>

        {tracks.chapters.length === 0 ? (
          <div className="p-4 rounded-xl bg-background border border-dashed border-border text-center text-xs text-foreground-muted">
            Aucun chapitre découpé. Cliquez sur "Ajouter un chapitre" si l'ouvrage propose une écoute chapitrée.
          </div>
        ) : (
          <div className="space-y-2.5">
            {tracks.chapters.map((chap, idx) => (
              <div
                key={chap.id}
                className="p-3 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-gold shrink-0 w-6 text-center">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={chap.title}
                    onChange={(e) => updateChapterTitle(idx, e.target.value)}
                    placeholder={`Titre du chapitre ${idx + 1}`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border text-xs bg-background-secondary focus:outline-none focus:ring-1 focus:ring-navy text-navy font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
                  {chap.file ? (
                    <div className="flex items-center gap-2 text-xs font-mono text-foreground-muted">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-bold">
                        {formatAudioDuration(chap.duration_seconds)}
                      </span>
                      <span className="truncate max-w-[120px] text-[11px]">{chap.file.name}</span>
                    </div>
                  ) : (
                    <label className="px-3 py-1.5 rounded-lg border border-border bg-background-secondary hover:bg-navy/5 text-navy text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                      <Upload className="w-3 h-3 text-gold" />
                      <span>Fichier audio</span>
                      <input
                        type="file"
                        accept=".mp3,.m4a,.aac,.wav"
                        onChange={(e) => handleChapterFileChange(idx, e)}
                        className="hidden"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => removeChapter(idx)}
                    className="p-1.5 rounded-lg text-foreground-muted hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Supprimer ce chapitre"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
