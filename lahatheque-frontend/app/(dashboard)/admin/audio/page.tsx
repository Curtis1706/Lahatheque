"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Headphones, 
  Plus, 
  Search, 
  Clock, 
  Music, 
  Filter, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Layers
} from "lucide-react";
import { getAudioBooksList, updateAudioWorkflowStatus } from "@/lib/services/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

export default function AdminAudioPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getAudioBooksList("admin", statusFilter);
      setBooks(data);
    } catch (err) {
      console.error("Erreur chargement livres audio admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [statusFilter]);

  const handleTogglePublish = async (bookId: string, currentStatus: string) => {
    setActionLoading(true);
    setNotification(null);
    const newAction = currentStatus === "published" ? "unpublish_admin" : "publish_admin";
    try {
      const res = await updateAudioWorkflowStatus(bookId, newAction);
      if (res.success) {
        setNotification({ 
          type: "success", 
          text: currentStatus === "published" ? "Livre audio retiré du catalogue." : "Livre audio publié sur le catalogue public !" 
        });
        await fetchBooks();
      } else {
        setNotification({ type: "error", text: res.error || "Erreur de mise à jour." });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-gold" />
            Administration — Gestion Globale des Livres Audio
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Supervisez l'intégralité du fonds sonore LAHAThèque, publiez directement ou accédez au Studio Audio.
          </p>
        </div>

        <Link
          href="/admin/audio/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Nouveau Livre Audio</span>
        </Link>
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

      {/* Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-gold" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiés au catalogue</option>
            <option value="pending_layout_validation">Attente Chef Maquettiste</option>
            <option value="pending_legal_validation">Attente Juriste</option>
            <option value="rejected">Rejetés / Corrections</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
      </div>

      {/* Grille des Livres Audio Admin */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-gold animate-spin" />
          Chargement du catalogue audio complet...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-secondary space-y-4">
          <Headphones className="w-10 h-10 text-gold mx-auto" />
          <h3 className="font-serif font-bold text-base text-navy">Aucun livre audio trouvé</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Commencez par ajouter un nouveau livre audio via le Studio Audio.
          </p>
          <Link
            href="/admin/audio/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-gold" />
            Créer un livre audio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((book) => {
            const isPublished = book.audio_status === "published";

            return (
              <div
                key={book.id}
                className="rounded-2xl border border-border bg-background p-5 flex flex-col justify-between space-y-4 shadow-xs hover:border-gold/60 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-24 rounded-lg bg-background-secondary border border-border overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <Headphones className="w-6 h-6 text-gold" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gold font-mono">
                      {book.category_name} • {book.country}
                    </div>
                    <h4 className="font-serif font-bold text-sm text-navy line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-xs text-foreground-muted truncate">
                      {book.authors_display}
                    </p>
                    <div className="pt-1">
                      {isPublished ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Publié au catalogue
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          {book.audio_status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Métriques */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted font-mono">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold" />
                      {formatAudioDuration(book.total_duration_seconds)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Music className="w-3 h-3 text-navy" />
                      {book.total_tracks_count} piste{book.total_tracks_count > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {book.has_male_voice && <span className="px-1.5 py-0.5 rounded bg-navy/5 text-navy font-bold text-[9px]">Homme</span>}
                    {book.has_female_voice && <span className="px-1.5 py-0.5 rounded bg-navy/5 text-navy font-bold text-[9px]">Femme</span>}
                  </div>
                </div>

                {/* Actions Admin */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-xs font-bold font-mono text-navy">
                    {book.price_audio_xof.toLocaleString("fr-FR")} FCFA
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/listen/${book.id}`}
                      className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy transition-colors cursor-pointer"
                      title="Écouter l'audio"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gold" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(book.id, book.audio_status)}
                      disabled={actionLoading}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                        isPublished
                          ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-navy text-white hover:bg-navy-hover shadow-xs"
                      }`}
                    >
                      {isPublished ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Dépublier</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-gold" />
                          <span>Publier</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
