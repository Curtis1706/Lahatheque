"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Headphones,
  Save,
  Trash2,
  Play,
  Pause,
  Clock,
  Music,
  Coins,
  FileText,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  Plus,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAudioBookDetail,
  updateAudioBook,
  deleteAudioTrack,
  uploadFileDirectToR2,
  submitAudioStudioForm,
} from "@/lib/services/audio";
import { formatAudioDuration, formatXofToEur } from "@/lib/config/audio-constants";
import { InlineLoader } from "@/components/ui/page-loader";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { CountryCombobox } from "@/components/features/catalog/country-combobox";

export default function AdminAudioEditPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Données du livre audio
  const [bookData, setBookData] = useState<any>(null);

  // Formulaire de métadonnées
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [country, setCountry] = useState("BJ");
  const [priceXof, setPriceXof] = useState<number>(2500);
  const [priceEur, setPriceEur] = useState<number>(3.80);
  const [audioStatus, setAudioStatus] = useState<string>("draft");

  // Pistes existantes
  const [tracks, setTracks] = useState<any[]>([]);
  const [deletingTrackId, setDeletingTrackId] = useState<string | null>(null);

  // Pré-écoute audio
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Ajout de nouvelle piste
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [newTrackVoice, setNewTrackVoice] = useState<"male" | "female">("male");
  const [newTrackType, setNewTrackType] = useState<"full" | "chapter">("chapter");
  const [newTrackTitle, setNewTrackTitle] = useState("");
  const [newTrackChapterNumber, setNewTrackChapterNumber] = useState<number>(1);
  const [newTrackFile, setNewTrackFile] = useState<File | null>(null);
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const loadBookDetails = async () => {
    if (!bookId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAudioBookDetail(bookId);
      if (res.success && res.data) {
        const d = res.data;
        setBookData(d);
        setTitle(d.title || "");
        setDescription(d.description || d.summary || "");
        setDiscipline(d.category_name || d.discipline_name || "Général");
        setCountry(d.country || "BJ");
        setPriceXof(d.price_audio_xof || 2500);
        setPriceEur(d.price_audio_eur || 3.80);
        setAudioStatus(d.audio_status || "draft");
        setTracks(d.tracks || []);
      } else {
        setErrorMsg(res.error || "Impossible de charger les données du livre audio.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookDetails();
  }, [bookId]);

  // Calcul automatique du prix EUR
  const handlePriceXofChange = (val: number) => {
    const xof = Math.max(0, val);
    const eur = parseFloat((xof / 655.957).toFixed(2));
    setPriceXof(xof);
    setPriceEur(eur);
  };

  // Sauvegarde des métadonnées
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre du livre audio est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateAudioBook(bookId, {
        title: title.trim(),
        description: description.trim(),
        category: discipline,
        country,
        price_audio_xof: priceXof,
        price_audio_eur: priceEur,
        audio_status: audioStatus,
      });

      if (res.success) {
        toast.success(res.message || "Livre audio mis à jour avec succès.");
        router.push("/admin/audio");
      } else {
        toast.error(res.error || "Erreur lors de la mise à jour.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  // Suppression d'une piste
  const handleDeleteTrack = async (trackId: string) => {
    setDeletingTrackId(trackId);
    try {
      const res = await deleteAudioTrack(trackId);
      if (res.success) {
        toast.success("Piste audio supprimée avec succès.");
        if (playingTrackId === trackId && audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          setPlayingTrackId(null);
        }
        setTracks((prev) => prev.filter((t) => t.id !== trackId));
      } else {
        toast.error(res.error || "Échec de la suppression de la piste.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression.");
    } finally {
      setDeletingTrackId(null);
    }
  };

  // Lecture / Pause pré-écoute
  const handleTogglePlay = (track: any) => {
    const trackUrl = track.audio_url || track.hls_manifest_url;
    if (!trackUrl) {
      toast.warning("Fichier sonore en cours d'encodage HLS.");
      return;
    }

    if (playingTrackId === track.id) {
      audioPlayerRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = trackUrl;
        audioPlayerRef.current.play().catch(() => {
          toast.error("Impossible de lire ce flux audio.");
        });
      }
      setPlayingTrackId(track.id);
    }
  };

  // Téléversement d'une nouvelle piste vers R2
  const handleAddNewTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackFile) {
      toast.error("Veuillez sélectionner un fichier audio (MP3 / AAC / M4B).");
      return;
    }

    setIsUploadingTrack(true);
    setUploadProgress(0);
    try {
      // 1. Upload direct vers Cloudflare R2
      const r2Res = await uploadFileDirectToR2(newTrackFile, "audio", (p) => setUploadProgress(p));
      const r2Key = r2Res.r2_key;

      // 2. Rattachement via API submit
      const payload: Record<string, any> = {
        book_id: bookId,
        narration_language: bookData?.narration_language || "fr",
      };

      if (newTrackType === "full") {
        if (newTrackVoice === "male") {
          payload.male_full_r2_key = r2Key;
          payload.male_full_duration = 0;
          payload.male_full_size = newTrackFile.size;
        } else {
          payload.female_full_r2_key = r2Key;
          payload.female_full_duration = 0;
          payload.female_full_size = newTrackFile.size;
        }
      } else {
        if (newTrackVoice === "male") {
          payload.male_chapters_count = 1;
          payload["male_chapter_0_r2_key"] = r2Key;
          payload["male_chapter_0_title"] = newTrackTitle || `Chapitre ${newTrackChapterNumber}`;
          payload["male_chapter_0_duration"] = 0;
          payload["male_chapter_0_size"] = newTrackFile.size;
        } else {
          payload.female_chapters_count = 1;
          payload["female_chapter_0_r2_key"] = r2Key;
          payload["female_chapter_0_title"] = newTrackTitle || `Chapitre ${newTrackChapterNumber}`;
          payload["female_chapter_0_duration"] = 0;
          payload["female_chapter_0_size"] = newTrackFile.size;
        }
      }

      const submitRes = await submitAudioStudioForm(payload);
      if (submitRes.success) {
        toast.success("Nouvelle piste audio téléversée et rattachée avec succès !");
        setShowAddTrackModal(false);
        setNewTrackFile(null);
        setNewTrackTitle("");
        await loadBookDetails();
      } else {
        toast.error(submitRes.error || "Erreur lors du rattachement de la piste.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi du fichier.");
    } finally {
      setIsUploadingTrack(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <InlineLoader />
        <p className="text-xs text-foreground-muted font-sans font-medium">
          Chargement du livre audio et de ses pistes...
        </p>
      </div>
    );
  }

  if (errorMsg || !bookData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Impossible d'accéder au livre audio</h3>
            <p className="text-xs">{errorMsg || "L'ouvrage demandé n'existe pas ou n'est plus accessible."}</p>
          </div>
        </div>
        <Link
          href="/admin/audio"
          className="inline-flex items-center gap-2 text-xs font-semibold text-navy hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la gestion des livres audio
        </Link>
      </div>
    );
  }

  // Séparation des pistes par narrateur
  const maleTracks = tracks.filter((t) => t.voice_gender === "male");
  const femaleTracks = tracks.filter((t) => t.voice_gender === "female");

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Lecteur audio invisible pour pré-écoute */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setPlayingTrackId(null)}
        onError={() => setPlayingTrackId(null)}
        className="hidden"
      />

      {/* En-tête de navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link
            href="/admin/audio"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la gestion globale des livres audio
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy flex items-center gap-2.5">
              <Headphones className="w-6 h-6 text-gold" />
              Modifier : {bookData.title}
            </h1>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs ${
                audioStatus === "published"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : audioStatus === "pending_layout_validation"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : audioStatus === "pending_legal_validation"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : audioStatus === "rejected"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-background-secondary text-foreground-muted border border-border"
              }`}
            >
              {audioStatus === "published"
                ? "Publié au catalogue"
                : audioStatus === "pending_layout_validation"
                ? "Attente Maquette"
                : audioStatus === "pending_legal_validation"
                ? "Attente Juriste"
                : audioStatus === "rejected"
                ? "Rejeté"
                : "Brouillon"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            {bookData.authors_display} • {tracks.length} piste(s) audio • {formatAudioDuration(bookData.total_duration_seconds)}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/listen/${bookId}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Tester dans la liseuse audio"
          >
            <ExternalLink className="w-4 h-4 text-gold" />
            <span>Liseuse Audio</span>
          </Link>
        </div>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={handleSaveMetadata} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Métadonnées et Tarification (2 colonnes) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Métadonnées */}
            <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-navy font-serif font-bold text-base">
                <FileText className="w-4 h-4 text-gold" />
                <span>Métadonnées Éditoriales</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Titre du Livre Audio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Description / Résumé
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Présentation de l'ouvrage, de l'intrigue ou du programme pédagogique..."
                    className="w-full p-3 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">
                      Discipline / Matière
                    </label>
                    <DisciplineCombobox
                      value={discipline}
                      onChange={(val) => setDiscipline(val)}
                      placeholder="Sélectionner une discipline..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy mb-1.5">
                      Pays d'origine
                    </label>
                    <CountryCombobox
                      value={country}
                      onChange={(val) => setCountry(val)}
                      placeholder="Sélectionner un pays..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section Tarification & Statut */}
            <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-border pb-3 text-navy font-serif font-bold text-base">
                <Coins className="w-4 h-4 text-gold" />
                <span>Tarification &amp; Publication</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Prix Audio (FCFA)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={priceXof}
                      onChange={(e) => handlePriceXofChange(Number(e.target.value))}
                      className="w-full h-10 px-3.5 pr-14 rounded-xl border border-border bg-background font-mono text-xs sm:text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground-muted font-mono">
                      FCFA
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Équivalent EUR
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={priceEur}
                      onChange={(e) => setPriceEur(Number(e.target.value))}
                      className="w-full h-10 px-3.5 pr-12 rounded-xl border border-border bg-background font-mono text-xs sm:text-sm font-bold text-navy focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted">
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1.5">
                    Statut Éditorial
                  </label>
                  <select
                    value={audioStatus}
                    onChange={(e) => setAudioStatus(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs sm:text-sm font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
                  >
                    <option value="draft">Brouillon (Non public)</option>
                    <option value="pending_layout_validation">Attente Chef Maquettiste</option>
                    <option value="pending_legal_validation">Attente Juriste</option>
                    <option value="published">Publié au Catalogue</option>
                    <option value="rejected">Rejeté / Modifications</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : Aperçu Couverture & Actions */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
              <span className="text-xs font-bold text-navy block uppercase tracking-wider">
                Couverture Actuelle
              </span>
              <div className="w-full aspect-3/4 rounded-2xl bg-background-secondary border border-border overflow-hidden flex items-center justify-center shadow-xs">
                {bookData.cover_url ? (
                  <img
                    src={bookData.cover_url}
                    alt={bookData.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Headphones className="w-16 h-16 text-gold/60" />
                )}
              </div>

              <div className="space-y-1 text-xs text-foreground-muted pt-2 border-t border-border">
                <p>
                  <strong className="text-navy">Type d'ouvrage :</strong>{" "}
                  {bookData.format_type === "audio" ? "Livre audio autonome" : "Version audio rattachée"}
                </p>
                <p>
                  <strong className="text-navy">Créé le :</strong>{" "}
                  {bookData.created_at ? new Date(bookData.created_at).toLocaleDateString("fr-FR") : "-"}
                </p>
              </div>
            </div>

            {/* Bouton de sauvegarde principal */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-6 rounded-2xl bg-navy hover:bg-navy-hover text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-gold" />
              <span>{saving ? "Enregistrement en cours..." : "Enregistrer les modifications"}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Section Gestion des Pistes Audio */}
      <div className="p-6 sm:p-8 rounded-3xl bg-background border border-border shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="font-serif font-bold text-xl text-navy flex items-center gap-2.5">
              <Music className="w-5 h-5 text-gold" />
              <span>Gestion des Pistes Audio ({tracks.length})</span>
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Consultez, pré-écoutez ou supprimez les fichiers narrés (voix masculine, féminine et chapitres).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddTrackModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy/5 hover:bg-navy/10 text-navy text-xs font-bold transition-colors border border-navy/15 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-gold" />
            <span>Ajouter une Piste Audio</span>
          </button>
        </div>

        {tracks.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-background-secondary/50 space-y-3">
            <Headphones className="w-10 h-10 text-foreground-muted mx-auto" />
            <p className="text-xs text-foreground-muted font-medium">
              Aucune piste sonore n'est actuellement rattachée à ce livre audio.
            </p>
            <button
              type="button"
              onClick={() => setShowAddTrackModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-gold" />
              <span>Ajouter la première piste</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Voix Homme */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-navy" />
                  Voix Homme ({maleTracks.length})
                </span>
              </div>

              {maleTracks.length === 0 ? (
                <p className="text-xs text-foreground-muted italic py-4">Aucune piste voix masculine.</p>
              ) : (
                <div className="space-y-2">
                  {maleTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-3.5 rounded-2xl border border-border bg-background hover:bg-background-secondary/40 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(track)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            playingTrackId === track.id
                              ? "bg-gold text-white shadow-xs"
                              : "bg-navy/10 text-navy hover:bg-navy hover:text-white"
                          }`}
                          title={playingTrackId === track.id ? "Pause" : "Écouter"}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-navy truncate" title={track.title}>
                            {track.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-foreground-muted font-mono mt-0.5">
                            <span>{formatAudioDuration(track.duration_seconds)}</span>
                            <span>•</span>
                            <span>{track.track_type === "full" ? "Complet" : `Chap. ${track.chapter_number}`}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(track.id)}
                        disabled={deletingTrackId === track.id}
                        className="p-2 rounded-xl text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                        title="Supprimer cette piste"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Voix Femme */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-bold text-gold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  Voix Femme ({femaleTracks.length})
                </span>
              </div>

              {femaleTracks.length === 0 ? (
                <p className="text-xs text-foreground-muted italic py-4">Aucune piste voix féminine.</p>
              ) : (
                <div className="space-y-2">
                  {femaleTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-3.5 rounded-2xl border border-border bg-background hover:bg-background-secondary/40 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleTogglePlay(track)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                            playingTrackId === track.id
                              ? "bg-gold text-white shadow-xs"
                              : "bg-gold/15 text-gold hover:bg-gold hover:text-white"
                          }`}
                          title={playingTrackId === track.id ? "Pause" : "Écouter"}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-navy truncate" title={track.title}>
                            {track.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-foreground-muted font-mono mt-0.5">
                            <span>{formatAudioDuration(track.duration_seconds)}</span>
                            <span>•</span>
                            <span>{track.track_type === "full" ? "Complet" : `Chap. ${track.chapter_number}`}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTrack(track.id)}
                        disabled={deletingTrackId === track.id}
                        className="p-2 rounded-xl text-foreground-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
                        title="Supprimer cette piste"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modale d'ajout d'une nouvelle piste sonore */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNewTrack}
            className="w-full max-w-lg rounded-3xl bg-background border border-border p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg text-navy flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-gold" />
                <span>Téléverser une nouvelle piste</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTrackModal(false)}
                className="p-1 rounded-lg text-foreground-muted hover:bg-background-secondary cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Voix du narrateur</label>
                  <select
                    value={newTrackVoice}
                    onChange={(e) => setNewTrackVoice(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold cursor-pointer"
                  >
                    <option value="male">Voix Homme</option>
                    <option value="female">Voix Femme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Type de piste</label>
                  <select
                    value={newTrackType}
                    onChange={(e) => setNewTrackType(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold cursor-pointer"
                  >
                    <option value="chapter">Chapitre individuel</option>
                    <option value="full">Livre complet (Intégral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">Titre de la piste</label>
                <input
                  type="text"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  placeholder={newTrackType === "full" ? "Livre complet – Voix Homme" : "Chapitre 1 : Introduction"}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              {newTrackType === "chapter" && (
                <div>
                  <label className="block text-xs font-bold text-navy mb-1">Numéro du chapitre</label>
                  <input
                    type="number"
                    min={1}
                    value={newTrackChapterNumber}
                    onChange={(e) => setNewTrackChapterNumber(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Fichier audio (MP3, M4B, AAC) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept="audio/mpeg,audio/mp3,audio/m4b,audio/aac,audio/wav"
                  onChange={(e) => setNewTrackFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-foreground-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-navy/10 file:text-navy hover:file:bg-navy/20 cursor-pointer"
                />
              </div>

              {isUploadingTrack && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] font-bold text-navy font-mono">
                    <span>Téléversement vers Cloudflare R2...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-background-secondary overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddTrackModal(false)}
                disabled={isUploadingTrack}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isUploadingTrack || !newTrackFile}
                className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUploadingTrack ? "Téléversement..." : "Confirmer et ajouter"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
