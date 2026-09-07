"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  XCircle,
  ShieldCheck,
  FileText
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getAudioBooksList, updateAudioWorkflowStatus } from "@/lib/services/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

export interface AudioBookItem {
  id: string;
  title: string;
  authors_display: string;
  category_name: string;
  country: string;
  cover_url?: string;
  price_audio_xof: number;
  price_audio_eur: number;
  audio_status: string;
  has_male_voice: boolean;
  has_female_voice: boolean;
  total_duration_seconds: number;
  total_tracks_count: number;
  created_at?: string;
  rejection_reason?: string;
}

interface AudioBooksManagementViewProps {
  role: "admin" | "chief-layout" | "layout-artist" | "legal-reviewer";
  title: string;
  subtitle: string;
  newAudioHref?: string;
}

export function AudioBooksManagementView({
  role,
  title,
  subtitle,
  newAudioHref,
}: AudioBooksManagementViewProps) {
  const [books, setBooks] = useState<AudioBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modale de rejet (Chef Maquettiste)
  const [rejectingBookId, setRejectingBookId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Pagination pour la vue en Grille
  const [gridCurrentPage, setGridCurrentPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(6);
  const gridPageSizeOptions = [6, 9, 12, 24];

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getAudioBooksList(role, statusFilter);
      setBooks(data);
    } catch (err) {
      console.error(`Erreur chargement livres audio (${role}):`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [role, statusFilter]);

  // Réinitialiser la page grille lors de la recherche
  useEffect(() => {
    setGridCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Actions selon le rôle
  const handleTogglePublish = async (bookId: string, currentStatus: string) => {
    setActionLoading(true);
    setNotification(null);
    const newAction = currentStatus === "published" ? "unpublish_admin" : "publish_admin";
    try {
      const res = await updateAudioWorkflowStatus(bookId, newAction);
      if (res.success) {
        setNotification({
          type: "success",
          text: currentStatus === "published" ? "Livre audio retiré du catalogue public." : "Livre audio publié sur le catalogue public !"
        });
        await fetchBooks();
      } else {
        setNotification({ type: "error", text: res.error || "Erreur lors de la mise à jour." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Erreur réseau." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveLayout = async (bookId: string) => {
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

  const handleRejectLayout = async (e: React.FormEvent) => {
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

  // Filtrage local pour la recherche
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.authors_display?.toLowerCase().includes(q) ||
        b.category_name?.toLowerCase().includes(q) ||
        b.country?.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  // Données paginées en Grille
  const gridTotalPages = Math.ceil(filtered.length / gridPageSize) || 1;
  const safeGridPage = Math.min(Math.max(gridCurrentPage, 1), gridTotalPages);
  const paginatedGridData = useMemo(() => {
    const start = (safeGridPage - 1) * gridPageSize;
    return filtered.slice(start, start + gridPageSize);
  }, [filtered, safeGridPage, gridPageSize]);

  // Badge de statut
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Publié au catalogue
          </span>
        );
      case "pending_layout_validation":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Attente Chef Maquettiste
          </span>
        );
      case "pending_legal_validation":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Attente Juriste
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            Rejeté / Modifications
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-background-secondary text-foreground-muted border border-border">
            Brouillon
          </span>
        );
    }
  };

  // Colonnes DataTable pour le Mode Liste
  const columns: DataTableColumn<AudioBookItem>[] = [
    {
      key: "title",
      header: "Ouvrage",
      className: "min-w-[240px]",
      cell: (book) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-16 rounded-lg bg-background-secondary border border-border overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <Headphones className="w-5 h-5 text-gold" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-serif font-bold text-sm text-navy truncate">{book.title}</h4>
            <p className="text-xs text-foreground-muted truncate">{book.authors_display}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category_name",
      header: "Discipline & Pays",
      className: "min-w-[160px]",
      cell: (book) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-navy block truncate">{book.category_name}</span>
          <span className="text-[11px] font-mono text-foreground-muted block">{book.country}</span>
        </div>
      ),
    },
    {
      key: "total_duration_seconds",
      header: "Durée & Pistes",
      cell: (book) => (
        <div className="space-y-0.5 font-mono text-xs text-foreground-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span>{formatAudioDuration(book.total_duration_seconds)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-navy" />
            <span>{book.total_tracks_count} piste{book.total_tracks_count > 1 ? "s" : ""}</span>
          </div>
        </div>
      ),
    },
    {
      key: "has_male_voice",
      header: "Narrateurs",
      cell: (book) => (
        <div className="flex items-center gap-1">
          {book.has_male_voice && (
            <span className="px-2 py-0.5 rounded bg-navy/10 text-navy font-bold text-[10px]">Homme</span>
          )}
          {book.has_female_voice && (
            <span className="px-2 py-0.5 rounded bg-navy/10 text-navy font-bold text-[10px]">Femme</span>
          )}
          {!book.has_male_voice && !book.has_female_voice && (
            <span className="text-xs text-foreground-muted">-</span>
          )}
        </div>
      ),
    },
    {
      key: "price_audio_xof",
      header: "Tarif",
      cell: (book) => (
        <div className="space-y-0.5 font-mono">
          <span className="text-xs font-bold text-navy block">{book.price_audio_xof.toLocaleString("fr-FR")} FCFA</span>
          <span className="text-[10px] text-foreground-muted block">({book.price_audio_eur.toFixed(2)} €)</span>
        </div>
      ),
    },
    {
      key: "audio_status",
      header: "Statut",
      cell: (book) => renderStatusBadge(book.audio_status),
    },
    {
      key: "id",
      header: "Actions",
      className: "text-right",
      cell: (book) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/listen/${book.id}`}
            className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy transition-colors cursor-pointer"
            title="Écouter le livre audio"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gold" />
          </Link>

          {/* Actions Rôle Admin */}
          {role === "admin" && (
            <button
              type="button"
              onClick={() => handleTogglePublish(book.id, book.audio_status)}
              disabled={actionLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                book.audio_status === "published"
                  ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-navy text-white hover:bg-navy-hover shadow-xs"
              }`}
            >
              {book.audio_status === "published" ? (
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
          )}

          {/* Actions Rôle Chef Maquettiste */}
          {role === "chief-layout" && book.audio_status === "pending_layout_validation" && (
            <>
              <button
                type="button"
                onClick={() => handleApproveLayout(book.id)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valider</span>
              </button>

              <button
                type="button"
                onClick={() => { setRejectingBookId(book.id); setRejectionReason(""); }}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejeter</span>
              </button>
            </>
          )}

          {/* Actions Rôle Juriste */}
          {role === "legal-reviewer" && book.audio_status === "pending_legal_validation" && (
            <button
              type="button"
              onClick={() => handleApproveLegal(book.id)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conformité OK</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-gold" />
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {newAudioHref && (
            <Link
              href={newAudioHref}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>Nouveau Livre Audio</span>
            </Link>
          )}
        </div>
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

      {/* Barre d'outils : Recherche, Filtre & Commutateur de vue Grille / Liste */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Recherche */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        {/* Filtre statut & Commutateur Grille / Liste */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
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

          {/* Commutateur Grille / Liste */}
          <div className="inline-flex items-center p-1 rounded-xl bg-background-secondary border border-border shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
              title="Affichage en Grille"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">Grille</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
              title="Affichage en Liste (Tableau)"
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu : Grille ou Liste */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-gold animate-spin" />
          Chargement des livres audio...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-background-secondary space-y-4">
          <Headphones className="w-10 h-10 text-gold mx-auto" />
          <h3 className="font-serif font-bold text-base text-navy">Aucun livre audio trouvé</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Aucun ouvrage ne correspond à vos critères actuels de recherche.
          </p>
          {newAudioHref && (
            <Link
              href={newAudioHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-gold" />
              Créer un livre audio
            </Link>
          )}
        </div>
      ) : viewMode === "list" ? (
        /* VUE EN LISTE (DataTable LAHAThèque avec pagination intégrée) */
        <DataTable
          data={filtered}
          columns={columns}
          rowKey="id"
          searchable={false}
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          showPagination={true}
        />
      ) : (
        /* VUE EN GRILLE avec pagination complète */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedGridData.map((book) => (
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
                      {renderStatusBadge(book.audio_status)}
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
                    {book.has_male_voice && (
                      <span className="px-1.5 py-0.5 rounded bg-navy/5 text-navy font-bold text-[9px]">Homme</span>
                    )}
                    {book.has_female_voice && (
                      <span className="px-1.5 py-0.5 rounded bg-navy/5 text-navy font-bold text-[9px]">Femme</span>
                    )}
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <span className="text-xs font-bold font-mono text-navy">
                    {book.price_audio_xof.toLocaleString("fr-FR")} FCFA
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/listen/${book.id}`}
                      className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy transition-colors cursor-pointer"
                      title="Écouter le livre audio"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gold" />
                    </Link>

                    {/* Action Admin */}
                    {role === "admin" && (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(book.id, book.audio_status)}
                        disabled={actionLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                          book.audio_status === "published"
                            ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-navy text-white hover:bg-navy-hover shadow-xs"
                        }`}
                      >
                        {book.audio_status === "published" ? (
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
                    )}

                    {/* Action Chef Maquettiste */}
                    {role === "chief-layout" && book.audio_status === "pending_layout_validation" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveLayout(book.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valider</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setRejectingBookId(book.id); setRejectionReason(""); }}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rejeter</span>
                        </button>
                      </>
                    )}

                    {/* Action Juriste */}
                    {role === "legal-reviewer" && book.audio_status === "pending_legal_validation" && (
                      <button
                        type="button"
                        onClick={() => handleApproveLegal(book.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valider</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination de la Grille */}
          {filtered.length > 0 && (
            <div className="p-4 border border-border rounded-2xl bg-background flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
              <div>
                Affichage de <strong className="text-navy">{Math.min((safeGridPage - 1) * gridPageSize + 1, filtered.length)}</strong> à <strong className="text-navy">{Math.min(safeGridPage * gridPageSize, filtered.length)}</strong> sur <strong className="text-navy">{filtered.length}</strong> livres audio
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>Par page :</span>
                  <select
                    value={gridPageSize}
                    onChange={(e) => {
                      setGridPageSize(Number(e.target.value));
                      setGridCurrentPage(1);
                    }}
                    className="px-2 py-1 rounded-lg border border-border bg-background text-navy focus:outline-none focus:ring-1 focus:ring-navy cursor-pointer"
                  >
                    {gridPageSizeOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setGridCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={safeGridPage <= 1}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-navy cursor-pointer"
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-semibold text-navy">
                    {safeGridPage} / {gridTotalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setGridCurrentPage((p) => Math.min(p + 1, gridTotalPages))}
                    disabled={safeGridPage >= gridTotalPages}
                    className="p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-navy cursor-pointer"
                    aria-label="Page suivante"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modale de Rejet pour le Chef Maquettiste */}
      {rejectingBookId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRejectLayout}
            className="w-full max-w-md rounded-3xl bg-background border border-border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-red-600 font-serif font-bold text-lg border-b border-border pb-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>Demande de corrections / Rejet</span>
            </div>

            <p className="text-xs text-foreground-muted">
              Veuillez préciser la raison du rejet technique pour permettre au maquettiste d'apporter les corrections nécessaires sur les pistes audio.
            </p>

            <textarea
              required
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Pistes de voix féminine inaudibles à partir du chapitre 3, bruit de fond excessif..."
              className="w-full p-3 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy resize-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingBookId(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                Confirmer le rejet
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
