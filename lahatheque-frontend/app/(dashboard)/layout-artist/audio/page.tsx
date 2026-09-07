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
  ExternalLink,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { getAudioBooksList } from "@/lib/services/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

export default function LayoutArtistAudioPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const data = await getAudioBooksList("layout-artist", statusFilter);
        if (active) setBooks(data);
      } catch (err) {
        console.error("Erreur chargement livres audio:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchBooks();
    return () => { active = false; };
  }, [statusFilter]);

  const filtered = books.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.authors_display.toLowerCase().includes(q) ||
      b.category_name.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Publié au catalogue</span>;
      case "pending_layout_validation":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">En attente Chef Maquettiste</span>;
      case "pending_legal_validation":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">En attente Juriste</span>;
      case "rejected":
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">Corrections demandées</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-background-secondary text-foreground-muted border border-border">Brouillon</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-gold" />
            Mes Livres Audio
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Gérez vos productions audio, téléversements de pistes voix homme/femme et suivez les validations.
          </p>
        </div>

        <Link
          href="/layout-artist/audio/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Créer un livre audio</span>
        </Link>
      </div>

      {/* Barre de Filtres & Recherche */}
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
            <option value="pending_layout_validation">En attente Chef Maquettiste</option>
            <option value="pending_legal_validation">En attente Juriste</option>
            <option value="published">Publiés</option>
            <option value="rejected">Rejetés / Corrections</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>
      </div>

      {/* Liste des Livres Audio */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-gold animate-spin" />
          Chargement de vos livres audio...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-secondary space-y-4">
          <Headphones className="w-10 h-10 text-gold mx-auto" />
          <h3 className="font-serif font-bold text-base text-navy">Aucun livre audio trouvé</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Vous n'avez pas encore créé de livre audio correspondant à ces critères.
          </p>
          <Link
            href="/layout-artist/audio/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-gold" />
            Créer mon premier livre audio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((book) => (
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gold">
                    {book.category_name} • {book.country}
                  </div>
                  <h4 className="font-serif font-bold text-sm text-navy line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                    {book.title}
                  </h4>
                  <p className="text-xs text-foreground-muted truncate">
                    {book.authors_display}
                  </p>
                  <div className="pt-1">{getStatusBadge(book.audio_status)}</div>
                </div>
              </div>

              {/* Métriques Pistes & Durée */}
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
                  {book.has_male_voice && <span className="px-1.5 py-0.5 rounded bg-navy/5 text-navy font-bold text-[9px]">VH</span>}
                  {book.has_female_voice && <span className="px-1.5 py-0.5 rounded bg-navy/5 text-navy font-bold text-[9px]">VF</span>}
                </div>
              </div>

              {/* Motif de rejet si présent */}
              {book.audio_status === "rejected" && book.rejection_reason && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 mt-0.5" />
                  <span><strong>Motif :</strong> {book.rejection_reason}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold font-mono text-navy">
                  {book.price_audio_xof.toLocaleString("fr-FR")} FCFA
                </span>

                <Link
                  href={`/listen/${book.id}`}
                  className="px-3 py-1.5 rounded-xl border border-border bg-background-secondary hover:bg-navy/5 text-navy text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Écouter</span>
                  <ExternalLink className="w-3 h-3 text-gold" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
