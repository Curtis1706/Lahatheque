"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Headphones, 
  ShieldCheck, 
  Search, 
  Clock, 
  Music, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Sparkles,
  FileText
} from "lucide-react";
import { getAudioBooksList, updateAudioWorkflowStatus } from "@/lib/services/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

export default function LegalReviewerAudioPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getAudioBooksList("legal-reviewer");
      setBooks(data);
    } catch (err) {
      console.error("Erreur chargement livres audio juridique:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleApproveLegal = async (bookId: string) => {
    setActionLoading(true);
    setNotification(null);
    try {
      const res = await updateAudioWorkflowStatus(bookId, "approve_legal");
      if (res.success) {
        setNotification({ type: "success", text: "Conformité juridique audio validée. Le livre est approuvé pour diffusion." });
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
          <ShieldCheck className="w-6 h-6 text-gold" />
          Espace Juridique — Validation des Droits Livres Audio
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-1">
          Examinez les exploitations sonores validées techniquement par la Maquette et approuvez la conformité des contrats et redevances audio.
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

      {/* Liste des Livres Audio */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-gold animate-spin" />
          Chargement des dossiers audio juridiques...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-secondary space-y-3">
          <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-serif font-bold text-base text-navy">Aucun dossier juridique audio en attente</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Tous les contrats et autorisations d'exploitation audio sont régularisés.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((book) => {
            const isPendingLegal = book.audio_status === "pending_legal_validation";

            return (
              <div
                key={book.id}
                className={`rounded-2xl border p-5 sm:p-6 bg-background flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs transition-all ${
                  isPendingLegal ? "border-blue-300 bg-blue-50/20" : "border-border"
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
                      {isPendingLegal ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          En attente validation contrat audio
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                      <span className="font-bold text-navy">
                        Tarif : {book.price_audio_xof.toLocaleString("fr-FR")} FCFA ({book.price_audio_eur} €)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Juriste */}
                <div className="flex flex-wrap items-center gap-3 shrink-0 justify-end pt-3 md:pt-0 border-t md:border-t-0 border-border">
                  <Link
                    href={`/listen/${book.id}`}
                    className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Écouter</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gold" />
                  </Link>

                  <Link
                    href="/legal-reviewer/contracts"
                    className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-gold" />
                    <span>Voir le contrat</span>
                  </Link>

                  {isPendingLegal && (
                    <button
                      type="button"
                      onClick={() => handleApproveLegal(book.id)}
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                      <span>Approuver les droits audio</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
