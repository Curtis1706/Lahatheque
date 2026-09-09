"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Book, 
  Upload, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Layers,
  Languages,
  ArrowRight,
  Headphones
} from "lucide-react";
import { BookAttachmentSelector } from "./book-attachment-selector";
import { VoiceTrackManager } from "./voice-track-manager";
import { AudioStudioFormState, VoiceTrackGroup } from "@/lib/types/audio";
import { submitAudioStudioForm, uploadFileDirectToR2 } from "@/lib/services/audio";
import { formatXofToEur } from "@/lib/config/audio-constants";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { CountryCombobox } from "@/components/features/catalog/country-combobox";
import { AuthorCombobox } from "@/components/features/catalog/author-combobox";

interface AudioStudioFormProps {
  role: "layout-artist" | "admin";
  onSuccessRedirectPath: string;
}

const initialVoiceTracks: VoiceTrackGroup = {
  full_track: {
    file: null,
    duration_seconds: 0,
    status: "idle",
    progress: 0,
  },
  chapters: [],
};

export function AudioStudioForm({ role, onSuccessRedirectPath }: AudioStudioFormProps) {
  const router = useRouter();

  const [formState, setFormState] = useState<AudioStudioFormState>({
    is_attached: false,
    attached_book_id: "",
    title: "",
    author: "",
    country: "Bénin",
    description: "",
    category: "Général",
    level: "Tous niveaux",
    price_xof: 2500,
    price_eur: 3.80,
    cover_image: null,
    cover_url: "",
    narration_language: "fr",
    available_languages: ["fr", "en"],
    male_tracks: initialVoiceTracks,
    female_tracks: initialVoiceTracks,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUploadLabel, setCurrentUploadLabel] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Gestion du rattachement
  const handleSelectBook = (book: any) => {
    if (book) {
      const availLangs: string[] = book.available_languages || (book.languages ? book.languages.map((l: any) => l.language_code) : ["fr", "en"]);
      const selectedLang = availLangs.includes("fr") ? "fr" : (availLangs[0] || "fr");
      const matchedVersion = book.languages?.find((l: any) => l.language_code === selectedLang);

      setFormState((prev) => ({
        ...prev,
        is_attached: true,
        attached_book_id: book.id,
        title: book.title,
        author: book.author || book.authors_display || "Auteur certifié",
        category: book.category || "Général",
        country: book.country || "Bénin",
        cover_url: book.cover_url || "",
        cover_image: null,
        available_languages: availLangs,
        narration_language: selectedLang,
        language_version_id: matchedVersion ? matchedVersion.id : undefined,
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        is_attached: false,
        attached_book_id: "",
        cover_url: "",
        available_languages: ["fr", "en"],
        narration_language: "fr",
        language_version_id: undefined,
      }));
    }
  };

  const handlePriceXofChange = (val: number) => {
    const xof = Math.max(0, val);
    const eur = parseFloat((xof / 655.957).toFixed(2));
    setFormState((prev) => ({ ...prev, price_xof: xof, price_eur: eur }));
  };

  // Soumission finale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation préalable : au moins 1 piste audio (livre complet ou chapitre, homme ou femme)
    const hasMaleFull = Boolean(formState.male_tracks.full_track.file);
    const hasMaleChapter = formState.male_tracks.chapters.some((c) => Boolean(c.file));
    const hasFemaleFull = Boolean(formState.female_tracks.full_track.file);
    const hasFemaleChapter = formState.female_tracks.chapters.some((c) => Boolean(c.file));

    const totalTracksAvailable = 
      (hasMaleFull ? 1 : 0) + 
      (hasFemaleFull ? 1 : 0) + 
      formState.male_tracks.chapters.filter((c) => Boolean(c.file)).length +
      formState.female_tracks.chapters.filter((c) => Boolean(c.file)).length;

    if (totalTracksAvailable === 0 && !formState.is_attached) {
      setErrorMessage("Veuillez téléverser au moins une piste audio (Livre complet ou Chapitre) pour créer le livre audio.");
      return;
    }

    if (!formState.is_attached && !formState.title.trim()) {
      setErrorMessage("Le titre de l'ouvrage est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress({});
    setCurrentUploadLabel(null);

    try {
      const uploadedKeys: Record<string, string> = {};

      const filesToUpload: Array<{ key: string; file: File; label: string; fileType: "audio" | "cover" }> = [];

      // Couverture si livre autonome avec image
      if (!formState.is_attached && formState.cover_image) {
        filesToUpload.push({
          key: "cover_r2_key",
          file: formState.cover_image,
          label: "Image de couverture",
          fileType: "cover",
        });
      }

      // Voix Homme — Livre complet
      if (formState.male_tracks.full_track.file) {
        filesToUpload.push({
          key: "male_full_r2_key",
          file: formState.male_tracks.full_track.file,
          label: "Voix Homme — Livre complet",
          fileType: "audio",
        });
      }

      // Voix Homme — Chapitres
      formState.male_tracks.chapters.forEach((chap, idx) => {
        if (chap.file) {
          filesToUpload.push({
            key: `male_chapter_${idx}_r2_key`,
            file: chap.file,
            label: `Voix Homme — ${chap.title || `Chapitre ${idx + 1}`}`,
            fileType: "audio",
          });
        }
      });

      // Voix Femme — Livre complet
      if (formState.female_tracks.full_track.file) {
        filesToUpload.push({
          key: "female_full_r2_key",
          file: formState.female_tracks.full_track.file,
          label: "Voix Femme — Livre complet",
          fileType: "audio",
        });
      }

      // Voix Femme — Chapitres
      formState.female_tracks.chapters.forEach((chap, idx) => {
        if (chap.file) {
          filesToUpload.push({
            key: `female_chapter_${idx}_r2_key`,
            file: chap.file,
            label: `Voix Femme — ${chap.title || `Chapitre ${idx + 1}`}`,
            fileType: "audio",
          });
        }
      });

      // Téléversement séquentiel direct vers Cloudflare R2
      for (const item of filesToUpload) {
        setCurrentUploadLabel(item.label);
        const result = await uploadFileDirectToR2(
          item.file,
          item.fileType,
          (percent) => {
            setUploadProgress((prev) => ({ ...prev, [item.key]: percent }));
          }
        );
        uploadedKeys[item.key] = result.r2_key;
      }

      setCurrentUploadLabel("Finalisation de l'enregistrement...");

      // Construction du payload JSON léger
      const payload: Record<string, any> = {
        is_attached: formState.is_attached,
        price_xof: formState.price_xof,
        price_eur: formState.price_eur,
        narration_language: formState.narration_language,
        ...uploadedKeys,
      };

      if (formState.is_attached) {
        payload.attached_book_id = formState.attached_book_id;
      } else {
        payload.title = formState.title;
        payload.author = formState.author;
        payload.country = formState.country;
        payload.description = formState.description;
        payload.category = formState.category;
        payload.level = formState.level;
      }

      if (formState.language_version_id) {
        payload.language_version_id = formState.language_version_id;
      }

      // Métadonnées Voix Homme
      if (formState.male_tracks.full_track.file) {
        payload.male_full_duration = formState.male_tracks.full_track.duration_seconds;
        payload.male_full_size = formState.male_tracks.full_track.file.size;
      }
      payload.male_chapters_count = formState.male_tracks.chapters.length;
      formState.male_tracks.chapters.forEach((chap, idx) => {
        payload[`male_chapter_${idx}_title`] = chap.title || `Chapitre ${idx + 1}`;
        payload[`male_chapter_${idx}_duration`] = chap.duration_seconds;
        if (chap.file) {
          payload[`male_chapter_${idx}_size`] = chap.file.size;
        }
      });

      // Métadonnées Voix Femme
      if (formState.female_tracks.full_track.file) {
        payload.female_full_duration = formState.female_tracks.full_track.duration_seconds;
        payload.female_full_size = formState.female_tracks.full_track.file.size;
      }
      payload.female_chapters_count = formState.female_tracks.chapters.length;
      formState.female_tracks.chapters.forEach((chap, idx) => {
        payload[`female_chapter_${idx}_title`] = chap.title || `Chapitre ${idx + 1}`;
        payload[`female_chapter_${idx}_duration`] = chap.duration_seconds;
        if (chap.file) {
          payload[`female_chapter_${idx}_size`] = chap.file.size;
        }
      });

      const res = await submitAudioStudioForm(payload);
      if (res.success) {
        setSuccessMessage(
          res.data?.message ||
          (role === "admin"
            ? "Le livre audio a été enregistré et publié avec succès au catalogue."
            : "Le livre audio a été enregistré avec succès et transmis pour validation.")
        );
        setTimeout(() => {
          router.push(onSuccessRedirectPath);
        }, 1500);
      } else {
        setErrorMessage(res.error || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur réseau lors de la communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
      setCurrentUploadLabel(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Alertes d'état */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Grille principale en 2 colonnes (Métadonnées à gauche, Pistes audio à droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLONNE GAUCHE : Métadonnées & Tarification (5 colonnes) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-background rounded-3xl border border-border p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Layers className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-lg text-navy">
                Informations du livre
              </h2>
            </div>

            {/* Sélecteur de rattachement au catalogue */}
            <BookAttachmentSelector
              onSelectBook={handleSelectBook}
              selectedBook={
                formState.is_attached
                  ? {
                      id: formState.attached_book_id,
                      title: formState.title,
                      author: formState.author,
                      category: formState.category,
                      country: formState.country,
                      cover_url: formState.cover_url,
                      price_xof: formState.price_xof,
                      has_audio_version: true,
                    }
                  : null
              }
            />

            {/* Formulaire des champs si mode autonome ou aperçu verrouillé si rattaché */}
            <div className="space-y-4 pt-2">
              {/* Titre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                  Titre de l'ouvrage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={formState.is_attached}
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="Ex: Manuel de Droit Constitutionnel"
                  className={`w-full px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy ${
                    formState.is_attached ? "bg-background-secondary text-foreground-muted cursor-not-allowed" : "bg-background text-foreground"
                  }`}
                />
              </div>

              {/* Auteur / Éditeur */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                  Auteur / Éditeur
                </label>
                <AuthorCombobox
                  value={formState.author}
                  onChange={(name) => setFormState((prev) => ({ ...prev, author: name }))}
                  disabled={formState.is_attached}
                  placeholder="Rechercher en base ou saisir un auteur..."
                />
              </div>

              {/* Catégorie & Pays */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                    Catégorie
                  </label>
                  <DisciplineCombobox
                    value={formState.category}
                    onChange={(val) => setFormState((prev) => ({ ...prev, category: val }))}
                    disabled={formState.is_attached}
                    placeholder="Sélectionner une discipline..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                    Pays
                  </label>
                  <CountryCombobox
                    value={formState.country}
                    onChange={(name) => setFormState((prev) => ({ ...prev, country: name }))}
                    disabled={formState.is_attached}
                    placeholder="Sélectionner un pays..."
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                  Description / Résumé
                </label>
                <textarea
                  rows={3}
                  disabled={formState.is_attached}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Présentation synthétique du livre audio..."
                  className={`w-full px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none ${
                    formState.is_attached ? "bg-background-secondary text-foreground-muted cursor-not-allowed" : "bg-background text-foreground"
                  }`}
                />
              </div>

              {/* Couverture (si mode autonome) */}
              {!formState.is_attached && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                    Couverture du livre (Image)
                  </label>
                  <label className="border border-dashed border-border hover:border-gold/60 rounded-xl p-4 flex items-center gap-3 cursor-pointer bg-background-secondary hover:bg-background transition-colors">
                    <Upload className="w-5 h-5 text-gold shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-navy truncate block">
                        {formState.cover_image ? formState.cover_image.name : "Sélectionner une image (JPG, PNG)"}
                      </span>
                      <span className="text-[10px] text-foreground-muted">Format vertical 2:3 recommandé</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormState({ ...formState, cover_image: file });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Tarification Audio */}
              <div className="pt-4 border-t border-border space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-gold" />
                  Tarification du format audio
                </label>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-foreground-muted">Prix en FCFA (XOF)</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={formState.price_xof}
                    onChange={(e) => handlePriceXofChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm font-mono font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* COLONNE DROITE : Pistes Audio Voix Homme & Voix Femme (7 colonnes) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-lg text-navy">
                Pistes audio (Double Voix)
              </h2>
            </div>
            <span className="text-xs text-foreground-muted">
              Standard LAHA Éditions
            </span>
          </div>

          {/* Langue de narration de la version audio */}
          <div className="p-4 rounded-2xl bg-background border border-border space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                <Languages className="w-4 h-4 text-gold" />
                Langue de la narration audio
              </label>
              {formState.is_attached && (
                <span className="text-[10px] font-semibold text-foreground-muted">
                  Édition du livre
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground-muted">
              Indiquez la langue de lecture pour laquelle ces pistes audio sont enregistrées.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              {(formState.available_languages && formState.available_languages.length > 0
                ? formState.available_languages
                : ["fr", "en"]
              ).map((lang) => {
                const isSelected = formState.narration_language.toLowerCase() === lang.toLowerCase();
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        narration_language: lang,
                      }));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-navy text-white shadow-xs"
                        : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-mono px-1 py-0.5 rounded bg-gold/20 text-gold">
                      {lang.toUpperCase()}
                    </span>
                    <span>{lang.toLowerCase() === "fr" ? "Français" : "English"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voix Homme */}
          <VoiceTrackManager
            gender="male"
            title="Voix Homme"
            tracks={formState.male_tracks}
            onChange={(updated) => setFormState({ ...formState, male_tracks: updated })}
          />

          {/* Voix Femme */}
          <VoiceTrackManager
            gender="female"
            title="Voix Femme"
            tracks={formState.female_tracks}
            onChange={(updated) => setFormState({ ...formState, female_tracks: updated })}
          />

          {/* Note d'aide opérationnelle */}
          <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy flex items-start gap-3">
            <Info className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <span>
              <strong>Règle de production :</strong> Une seule piste suffit pour enregistrer le livre audio. Les autres fichiers peuvent être ajoutés ou enrichis ultérieurement en cours de modification.
            </span>
          </div>

          {/* Progression d'envoi en cours */}
          {isSubmitting && currentUploadLabel && (
            <div className="p-3.5 rounded-2xl bg-navy/5 border border-gold/20 flex items-center justify-between text-xs text-navy">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-gold animate-spin shrink-0" />
                <span className="truncate font-medium">{currentUploadLabel}</span>
              </div>
              <span className="text-foreground-muted font-mono font-bold shrink-0 ml-2">En cours...</span>
            </div>
          )}

          {/* Bouton de Soumission Principal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 text-gold animate-spin shrink-0" />
                  <span>
                    {currentUploadLabel
                      ? `Téléversement : ${currentUploadLabel}...`
                      : "Finalisation..."}
                  </span>
                </>
              ) : (
                <>
                  <span>Enregistrer le livre audio</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </form>
  );
}
