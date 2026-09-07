"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Headphones, 
  Search, 
  Clock, 
  Music, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Sparkles,
  AlertCircle,
  Filter
} from "lucide-react";
import { getAudioBooksList, updateAudioWorkflowStatus } from "@/lib/services/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

export default function ChiefLayoutAudioPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectingBookId, setRejectingBookId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getAudioBooksList("chief-layout");
      setBooks(data);
    } catch (err) {
      console.error("Erreur chargement livres audio:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleApprove = async (bookId: string) => {
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await updateAudioWorkflowStatus(bookId, "approve_layout");
      if (res.success) {
        setNotification({ type: "success", text: "Livre audio validé techniquement et transmis au Juriste." });
        await fetchBooks();
      } else {
        setNotification({ type: "error", text: res.error || "Erreur lors de la validation." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Erreur réseau." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBookId || !rejectionReason.trim()) return;

    setActionLoading(true);
    setNotification(null);
    try {
      const res = await updateAudioWorkflowStatus(rejectingBookId, "reject_layout", rejectionReason);
      if (res.success) {
        setNotification({ type: "success", text: "Demande de correction transmise au Maquettiste." });
        setRejectingBookId(null);
        setRejectionReason("");
        await fetchBooks();
      } else {
        setNotification({ type: "error", text: res.error || "Erreur lors du rejet." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Erreur réseau." });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = books.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.authors_display.toLowerCase().includes(q) ||
      b.category_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* En-tête */}
      <div className="border-b border-border pb-6">
        <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy flex items-center gap-2.5">
          <Headphones className="w-6 h-6 text-gold" />
          Direction Maquette — Contrôle &amp; Validation Audio
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1">
          Écoutez les productions audio soumises par les maquettistes, vérifiez la conformité des narrations et validez techniquement avant revue juridique.
        </p>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm flex items-start gap-3 border ${
          notification.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-red-50 text-red-800 border-red-200"
        }`}>
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Barre de Recherche */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
        <input
          type="text"
          placeholder="Rechercher par titre, auteur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      {/* Liste des Livres en attente de validation */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-gold animate-spin" />
          Chargement des livres audio...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-secondary space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-serif font-bold text-base text-navy">Tous les livres audio sont à jour</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Aucun livre audio en attente de validation technique pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((book) => {
            const isPending = book.audio_status === "pending_layout_validation";

            return (
              <div
                key={book.id}
                className={`rounded-2xl border p-5 sm:p-6 bg-background flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs transition-all ${
                  isPending ? "border-amber-300 bg-amber-50/20" : "border-border"
                }`}
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-16 h-24 rounded-lg bg-background-secondary border border-border overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <Headphones className="w-6 h-6 text-gold" />
                    )}
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-mono">
                        {book.category_name} • {book.country}
                      </span>
                      {isPending ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          À valider techniquement
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-background-secondary text-foreground-muted border border-border">
                          {book.audio_status}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-base text-navy truncate">
                      {book.title}
                    </h3>
                    <p className="text-xs text-foreground-muted truncate">
                      {book.authors_display}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-mono text-foreground-muted pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold" />
                        {formatAudioDuration(book.total_duration_seconds)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-navy" />
                        {book.total_tracks_count} piste{book.total_tracks_count > 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        {book.has_male_voice && <span className="px-1.5 py-0.5 rounded bg-navy/10 text-navy font-bold text-[10px]">Homme</span>}
                        {book.has_female_voice && <span className="px-1.5 py-0.5 rounded bg-navy/10 text-navy font-bold text-[10px]">Femme</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Chef Maquettiste */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 justify-end pt-3 md:pt-0 border-t md:border-t-0 border-border">
                  <Link
                    href={`/listen/${book.id}`}
                    className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Écouter les pistes</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gold" />
                  </Link>

                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectingBookId(book.id)}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Demander corrections</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(book.id)}
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                        <span>Valider techniquement</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de rejet avec motif textuel obligatoire */}
      {rejectingBookId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-3xl border border-border max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-navy flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Demande de correction audio
            </h3>
            <p className="text-xs text-foreground-muted">
              Précisez au Maquettiste les motifs techniques du refus (ex: souffle acoustique, coupure de fin de piste, chapitre manquant).
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indiquez précisément les corrections acoustiques attendues..."
                className="w-full p-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingBookId(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 rounded-xl border border-border bg-background text-xs font-bold text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  Confirmer le renvoi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
