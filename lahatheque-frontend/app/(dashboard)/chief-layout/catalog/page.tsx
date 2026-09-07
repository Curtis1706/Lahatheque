"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit,
  ExternalLink,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Layers,
  GraduationCap,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Package,
  Headphones,
} from "lucide-react";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { getCatalogBooks } from "@/lib/services/layout-artist";
import { EditBookModal } from "@/components/features/chief-layout/edit-book-modal";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { toast } from "sonner";

export default function ChiefLayoutCatalogPage() {
  const { playBook } = useAudioPlayer();
  const [books, setBooks] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [selectedPaperFilter, setSelectedPaperFilter] = useState<"all" | "paper_only" | "digital_only">("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Editing state
  const [editingBook, setEditingBook] = useState<LayoutDeposit | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatalogBooks({
        search: searchQuery || undefined,
        discipline: selectedDiscipline !== "all" ? selectedDiscipline : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      });
      setBooks(data);
    } catch {
      toast.error("Erreur de chargement du catalogue");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedDiscipline, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Client-side filtering for paper availability
  const filteredBooks = books.filter((b) => {
    if (selectedPaperFilter === "paper_only") return Boolean(b.is_paper_available);
    if (selectedPaperFilter === "digital_only") return !b.is_paper_available;
    return true;
  });

  // KPI statistics
  const totalCount = books.length;
  const publishedCount = books.filter((b) => b.status === "published").length;
  const paperAvailableCount = books.filter((b) => b.is_paper_available).length;
  const pendingCount = books.filter((b) => b.status === "pending_validation").length;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">
          Espace Chef Maquettiste
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue des Ouvrages</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Gestion Éditoriale &amp; Tarification
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue des Ouvrages
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez tous les ouvrages de la bibliothèque, modifiez leurs métadonnées, prix et activez la disponibilité papier.
          </p>
        </div>

        <Link
          href="/chief-layout/deposit"
          className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-bold text-xs flex items-center gap-2 shadow-sm transition-all shrink-0 min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-navy" />
          Déposer un Nouvel Ouvrage
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
            Total Ouvrages
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {totalCount}
          </p>
          <span className="text-[10px] text-foreground-muted">Au catalogue global</span>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-success uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Publiés en Ligne
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {publishedCount}
          </p>
          <span className="text-[10px] text-success font-medium">Accessibles aux lecteurs</span>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            Version Papier
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {paperAvailableCount}
          </p>
          <span className="text-[10px] text-gold font-medium">Commandables en physique</span>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            En Attente
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {pendingCount}
          </p>
          <span className="text-[10px] text-foreground-muted">À valider</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-background-secondary border border-border space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par titre, auteur, discipline ou ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
            />
          </div>

          {/* Discipline filter avec Combobox recherche + sélection de toutes les disciplines en base */}
          <div className="w-full">
            <DisciplineCombobox
              value={selectedDiscipline === "all" ? "" : selectedDiscipline}
              onChange={(val) => setSelectedDiscipline(val || "all")}
              placeholder="Toutes les disciplines"
              searchPlaceholder="Rechercher une discipline..."
              includeAllOption={true}
              allOptionLabel="Toutes les disciplines"
            />
          </div>

          {/* Paper Availability filter */}
          <div>
            <select
              value={selectedPaperFilter}
              onChange={(e) => setSelectedPaperFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs text-navy font-semibold focus:ring-2 focus:ring-navy min-h-[44px]"
            >
              <option value="all">Tous les formats</option>
              <option value="paper_only">Disponible en Papier</option>
              <option value="digital_only">Numérique Uniquement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books List / Table */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-3xl bg-navy/5 border border-border p-4 space-y-3" />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-background border border-border text-center space-y-3 shadow-xs">
          <BookOpen className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-serif font-bold text-navy text-base">Aucun ouvrage trouvé</h3>
          <p className="text-xs text-foreground-muted max-w-md mx-auto">
            Aucun livre ne correspond à vos critères de recherche. Vous pouvez réinitialiser les filtres ou déposer un nouvel ouvrage.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedDiscipline("all");
              setSelectedPaperFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px] cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBooks.map((book) => {
            const isPublished = book.status === "published";
            const authorsList = book.metadata.authors.join(", ") || "Auteur LAHA";

            return (
              <div
                key={book.id}
                className="rounded-3xl bg-background border border-border p-5 shadow-xs hover:border-gold/60 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Top: Cover + Info */}
                <div className="flex gap-4">
                  {/* Cover */}
                  <div className="w-20 h-28 rounded-xl bg-navy/5 border border-border overflow-hidden shrink-0 relative shadow-2xs">
                    {book.files.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.files.cover_url}
                        alt={book.metadata.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-foreground-muted text-[10px]">
                        <BookOpen className="w-6 h-6 text-gold mb-1" />
                        PDF
                      </div>
                    )}
                  </div>

                  {/* Title & metadata */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        isPublished
                          ? "bg-success/15 text-success"
                          : book.status === "revision_requested"
                          ? "bg-rose-500/15 text-rose-600"
                          : "bg-gold/15 text-gold"
                      }`}>
                        {isPublished ? "En Ligne" : book.status === "revision_requested" ? "Retouche" : "Attente"}
                      </span>

                      {book.classification.discipline && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-background-secondary text-foreground-muted font-medium truncate max-w-[130px]">
                          {book.classification.discipline}
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-sm text-navy line-clamp-2 leading-snug">
                      {book.metadata.title}
                    </h3>
                    <p className="text-[11px] text-foreground-muted line-clamp-1">
                      Par {authorsList}
                    </p>

                    {book.classification.university && (
                      <p className="text-[10px] text-navy font-semibold truncate flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-gold shrink-0" />
                        {book.classification.university}
                      </p>
                    )}
                  </div>
                </div>

                {/* Formats & Tarifs Box */}
                <div className={`p-3 rounded-2xl bg-background-secondary border border-border grid gap-2 text-xs ${
                  book.has_audio_version || book.has_audio || book.price_audio ? "grid-cols-3" : "grid-cols-2"
                }`}>
                  <div>
                    <span className="text-[10px] text-foreground-muted uppercase font-bold block truncate">
                      Numérique
                    </span>
                    <span className="font-mono font-bold text-navy text-xs">
                      {book.default_price.toLocaleString("fr-FR")} XOF
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-foreground-muted uppercase font-bold block truncate">
                      Papier
                    </span>
                    <span className={`font-mono text-xs font-bold ${
                      book.is_paper_available ? "text-gold" : "text-foreground-muted/60"
                    }`}>
                      {book.is_paper_available
                        ? `${(book.admin_price || 7500).toLocaleString("fr-FR")} XOF`
                        : "Désactivé"}
                    </span>
                  </div>

                  {(book.has_audio_version || book.has_audio || book.price_audio) && (
                    <div>
                      <span className="text-[10px] text-gold uppercase font-bold flex items-center gap-1 truncate">
                        <Headphones className="w-2.5 h-2.5 text-gold" />
                        Audio
                      </span>
                      <span className="font-mono font-bold text-gold text-xs">
                        {(book.price_audio || 3500).toLocaleString("fr-FR")} XOF
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBook(book)}
                    className="flex-1 py-2 px-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-1.5 min-h-[40px] shadow-xs cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-gold" />
                    Modifier
                  </button>

                  {(book.has_audio_version || book.has_audio || book.price_audio) && (
                    <button
                      type="button"
                      onClick={() => playBook(book.id)}
                      className="p-2 rounded-xl bg-gold/15 border border-gold/40 text-navy hover:bg-gold/25 transition-colors flex items-center justify-center min-h-[40px] min-w-[40px] cursor-pointer"
                      title="Écouter la version audio"
                    >
                      <Headphones className="w-4 h-4 text-gold" />
                    </button>
                  )}

                  <Link
                    href={`/student/catalog/${book.id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-background border border-border text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                    title="Voir sur le catalogue public"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/catalog/reader/${book.id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-background border border-border text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
                    title="Ouvrir dans la Liseuse DRM"
                  >
                    <Play className="w-4 h-4 text-gold fill-gold" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen={Boolean(editingBook)}
          onClose={() => setEditingBook(null)}
          onSaved={(updated) => {
            setBooks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
          }}
        />
      )}
    </div>
  );
}
