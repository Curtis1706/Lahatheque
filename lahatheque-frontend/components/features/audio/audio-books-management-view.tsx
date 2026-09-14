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
  Pencil,
  Trash2,
  SlidersHorizontal,
  Volume2,
  X,
  FileAudio
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { 
  getAudioBooksList, 
  updateAudioWorkflowStatus,
  getAudioBookDetail,
  updateAudioBook,
  deleteAudioBook
} from "@/lib/services/audio";
import { formatAudioDuration } from "@/lib/config/audio-constants";

export interface AudioBookItem {
  id: string;
  title: string;
  authors_display: string;
  category_name: string;
  country: string;
  cover_url?: string;
  format_type?: string;
  has_audio_version?: boolean;
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modale de rejet (Chef Maquettiste)
  const [rejectingBookId, setRejectingBookId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Modale d'inspection détaillée (Admin)
  const [inspectingBookId, setInspectingBookId] = useState<string | null>(null);
  const [inspectingBookData, setInspectingBookData] = useState<any | null>(null);
  const [isLoadingInspection, setIsLoadingInspection] = useState(false);
  const [inspectionVoiceFilter, setInspectionVoiceFilter] = useState<"all" | "male" | "female">("all");

  // Modale d'édition rapide (Admin)
  const [quickEditBook, setQuickEditBook] = useState<AudioBookItem | null>(null);
  const [quickPriceXof, setQuickPriceXof] = useState<number>(2500);
  const [quickPriceEur, setQuickPriceEur] = useState<number>(3.8);
  const [quickStatus, setQuickStatus] = useState<string>("draft");
  const [isQuickSaving, setIsQuickSaving] = useState(false);

  // Modale de confirmation de suppression (Admin)
  const [deletingBook, setDeletingBook] = useState<AudioBookItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination pour la vue en Grille
  const [gridCurrentPage, setGridCurrentPage] = useState(1);
  const [gridPageSize, setGridPageSize] = useState(12);
  const gridPageSizeOptions = [6, 12, 24, 48];

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
          text: currentStatus === "published" ? "Livre audio retiré du catalogue public." : "Livre audio publié sur le catalogue public."
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

  // Gestion Inspection (Admin)
  const handleOpenInspection = async (bookId: string) => {
    setInspectingBookId(bookId);
    setIsLoadingInspection(true);
    setInspectingBookData(null);
    setInspectionVoiceFilter("all");
    try {
      const res = await getAudioBookDetail(bookId);
      if (res.success && res.data) {
        setInspectingBookData(res.data);
      } else {
        setNotification({ type: "error", text: res.error || "Impossible de charger les détails du livre audio." });
        setInspectingBookId(null);
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Erreur réseau lors de l'inspection." });
      setInspectingBookId(null);
    } finally {
      setIsLoadingInspection(false);
    }
  };

  // Gestion Édition Rapide (Admin)
  const handleOpenQuickEdit = (book: AudioBookItem) => {
    setQuickEditBook(book);
    setQuickPriceXof(book.price_audio_xof || 2500);
    setQuickPriceEur(book.price_audio_eur || 3.8);
    setQuickStatus(book.audio_status || "draft");
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditBook) return;

    setIsQuickSaving(true);
    setNotification(null);
    try {
      const res = await updateAudioBook(quickEditBook.id, {
        price_audio_xof: quickPriceXof,
        price_audio_eur: quickPriceEur,
        audio_status: quickStatus,
      });
      if (res.success) {
        setNotification({ type: "success", text: "Tarifs et statut mis à jour avec succès." });
        setQuickEditBook(null);
        await fetchBooks();
      } else {
        setNotification({ type: "error", text: res.error || "Erreur lors de la mise à jour." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Erreur réseau." });
    } finally {
      setIsQuickSaving(false);
    }
  };

  // Gestion Suppression (Admin)
  const handleConfirmDelete = async () => {
    if (!deletingBook) return;

    setIsDeleting(true);
    setNotification(null);
    try {
      const res = await deleteAudioBook(deletingBook.id);
      if (res.success) {
        setNotification({ type: "success", text: res.message || "Livre audio supprimé avec succès." });
        setDeletingBook(null);
        await fetchBooks();
      } else {
        setNotification({ type: "error", text: res.error || "Erreur lors de la suppression." });
      }
    } catch (err: any) {
      setNotification({ type: "error", text: err.message || "Erreur réseau." });
    } finally {
      setIsDeleting(false);
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

  // Filtrage des pistes pour la modale d'inspection
  const filteredInspectionTracks = useMemo(() => {
    if (!inspectingBookData?.tracks) return [];
    if (inspectionVoiceFilter === "all") return inspectingBookData.tracks;
    return inspectingBookData.tracks.filter(
      (t: any) => t.voice_gender === inspectionVoiceFilter
    );
  }, [inspectingBookData, inspectionVoiceFilter]);

  // Badge de statut
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shadow-2xs">
            Publié au catalogue
          </span>
        );
      case "pending_layout_validation":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shadow-2xs">
            Attente Chef Maquettiste
          </span>
        );
      case "pending_legal_validation":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap shadow-2xs">
            Attente Juriste
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 whitespace-nowrap shadow-2xs">
            Rejeté / Modifications
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-background-secondary text-foreground-muted border border-border whitespace-nowrap shadow-2xs">
            Brouillon
          </span>
        );
    }
  };

  // Colonnes DataTable
  const columns: DataTableColumn<AudioBookItem>[] = [
    {
      key: "title",
      header: "Ouvrage",
      className: "min-w-[280px] lg:min-w-[320px]",
      cell: (book) => (
        <div className="flex items-center gap-3.5 py-1">
          <div className="w-12 h-16 rounded-xl bg-background-secondary border border-border overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <Headphones className="w-6 h-6 text-gold" />
            )}
          </div>
          <div className="min-w-0 max-w-sm">
            <h4 className="font-serif font-bold text-sm text-navy leading-snug line-clamp-2" title={book.title}>
              {book.title}
            </h4>
            <p className="text-xs text-foreground-muted truncate mt-0.5" title={book.authors_display}>
              {book.authors_display}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "category_name",
      header: "Discipline & Pays",
      className: "min-w-[160px] whitespace-nowrap",
      cell: (book) => (
        <div className="space-y-1 whitespace-nowrap">
          <span className="text-xs font-semibold text-navy block truncate" title={book.category_name}>
            {book.category_name}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-background-secondary border border-border text-foreground-muted">
            {book.country}
          </span>
        </div>
      ),
    },
    {
      key: "total_duration_seconds",
      header: "Durée & Pistes",
      className: "min-w-[140px] whitespace-nowrap",
      cell: (book) => (
        <div className="space-y-1 font-mono text-xs whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-navy font-semibold">
            <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>{formatAudioDuration(book.total_duration_seconds)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted font-sans">
            <Music className="w-3.5 h-3.5 text-navy/70 shrink-0" />
            <span>{book.total_tracks_count} piste{book.total_tracks_count > 1 ? "s" : ""}</span>
          </div>
        </div>
      ),
    },
    {
      key: "has_male_voice",
      header: "Narrateurs",
      className: "min-w-[130px] whitespace-nowrap",
      cell: (book) => (
        <div className="flex items-center gap-1.5 flex-wrap whitespace-nowrap">
          {book.has_male_voice && (
            <span className="px-2.5 py-0.5 rounded-md bg-navy/10 text-navy font-bold text-[10px] border border-navy/20">
              Homme
            </span>
          )}
          {book.has_female_voice && (
            <span className="px-2.5 py-0.5 rounded-md bg-gold/15 text-gold font-bold text-[10px] border border-gold/30">
              Femme
            </span>
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
      className: "min-w-[130px] whitespace-nowrap",
      cell: (book) => (
        <div className="whitespace-nowrap font-mono">
          <span className="text-xs font-bold text-navy block whitespace-nowrap">
            {book.price_audio_xof.toLocaleString("fr-FR")} FCFA
          </span>
          <span className="text-[10px] text-foreground-muted block">
            {book.price_audio_eur ? `${book.price_audio_eur.toFixed(2)} €` : "-"}
          </span>
        </div>
      ),
    },
    {
      key: "audio_status",
      header: "Statut",
      className: "min-w-[170px] whitespace-nowrap",
      cell: (book) => (
        <div className="whitespace-nowrap">
          {renderStatusBadge(book.audio_status)}
        </div>
      ),
    },
    {
      key: "id",
      header: "Actions",
      className: "min-w-[270px] text-right whitespace-nowrap",
      cell: (book) => (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
          <Link
            href={`/listen/${book.id}`}
            className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
            title="Écouter le flux audio"
          >
            <ExternalLink className="w-4 h-4 text-gold" />
          </Link>

          {/* Actions Rôle Admin (CRUD Complet) */}
          {role === "admin" && (
            <>
              <button
                type="button"
                onClick={() => handleOpenInspection(book.id)}
                className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                title="Inspecter les pistes et détails"
              >
                <Eye className="w-4 h-4" />
              </button>

              <Link
                href={`/admin/audio/${book.id}/edit`}
                className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                title="Modifier l'ouvrage audio"
              >
                <Pencil className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => handleOpenQuickEdit(book)}
                className="w-9 h-9 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                title="Édition rapide (prix & statut)"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleTogglePublish(book.id, book.audio_status)}
                disabled={actionLoading}
                className={`h-9 px-3 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 ${
                  book.audio_status === "published"
                    ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 shadow-2xs"
                    : "bg-navy text-white hover:bg-navy-hover shadow-xs"
                }`}
                title={book.audio_status === "published" ? "Dépublier du catalogue" : "Publier au catalogue"}
              >
                {book.audio_status === "published" ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">Dépublier</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-gold" />
                    <span className="hidden xl:inline">Publier</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDeletingBook(book)}
                disabled={actionLoading}
                className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors inline-flex items-center justify-center shrink-0 shadow-2xs cursor-pointer disabled:opacity-50"
                title="Supprimer le livre audio"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </>
          )}

          {/* Actions Rôle Chef Maquettiste */}
          {role === "chief-layout" && book.audio_status === "pending_layout_validation" && (
            <>
              <button
                type="button"
                onClick={() => handleApproveLayout(book.id)}
                disabled={actionLoading}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valider</span>
              </button>

              <button
                type="button"
                onClick={() => { setRejectingBookId(book.id); setRejectionReason(""); }}
                disabled={actionLoading}
                className="h-9 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
              className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
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

      {/* Barre d'outils unifiée : Recherche, Filtre & Commutateur Grille / Liste */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-background border border-border p-3 sm:p-4 rounded-2xl shadow-xs">
        {/* Recherche */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, pays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background-secondary/40 text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:bg-background transition-all"
          />
        </div>

        {/* Filtre statut & Commutateur Grille / Liste */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gold shrink-0" />
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
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
              title="Affichage en Liste (Tableau)"
            >
              <List className="w-4 h-4" />
              <span>Liste</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
              title="Affichage en Grille"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grille</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu : Liste (défaut) ou Grille */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted flex items-center justify-center gap-2 bg-background border border-border rounded-2xl">
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
        /* VUE EN LISTE (Défaut : DataTable LAHAThèque avec pagination) */
        <DataTable
          data={filtered}
          columns={columns}
          rowKey="id"
          searchable={false}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
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
                    <h4 className="font-serif font-bold text-sm text-navy line-clamp-2 leading-snug group-hover:text-gold transition-colors" title={book.title}>
                      {book.title}
                    </h4>
                    <p className="text-xs text-foreground-muted truncate" title={book.authors_display}>
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
                  <div className="font-mono">
                    <span className="text-xs font-bold text-navy block">
                      {book.price_audio_xof.toLocaleString("fr-FR")} FCFA
                    </span>
                    <span className="text-[10px] text-foreground-muted block">
                      {book.price_audio_eur ? `${book.price_audio_eur.toFixed(2)} €` : "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/listen/${book.id}`}
                      className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy transition-colors cursor-pointer"
                      title="Écouter le livre audio"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gold" />
                    </Link>

                    {/* Actions Admin (CRUD Complet) */}
                    {role === "admin" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenInspection(book.id)}
                          className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors cursor-pointer"
                          title="Inspecter les pistes et détails"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/admin/audio/${book.id}/edit`}
                          className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors cursor-pointer"
                          title="Modifier l'ouvrage audio"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleOpenQuickEdit(book)}
                          className="p-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy hover:text-gold transition-colors cursor-pointer"
                          title="Édition rapide (prix & statut)"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePublish(book.id, book.audio_status)}
                          disabled={actionLoading}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                            book.audio_status === "published"
                              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-navy text-white hover:bg-navy-hover shadow-xs"
                          }`}
                          title={book.audio_status === "published" ? "Dépublier du catalogue" : "Publier au catalogue"}
                        >
                          {book.audio_status === "published" ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-gold" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingBook(book)}
                          disabled={actionLoading}
                          className="p-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Supprimer le livre audio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
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

      {/* Modale d'Inspection Détaillée (Admin) */}
      {inspectingBookId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-background border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-background-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-navy">
                  <Headphones className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-navy">
                    Inspection Détaillée du Livre Audio
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    Analyse des pistes, des narrateurs et de la configuration audio.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBookId(null)}
                className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingInspection ? (
                <div className="py-16 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold animate-spin" />
                  <span>Chargement des détails et pistes de l'ouvrage...</span>
                </div>
              ) : inspectingBookData ? (
                <>
                  {/* Résumé de l'ouvrage */}
                  <div className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl bg-background-secondary/40 border border-border">
                    <div className="w-20 h-28 rounded-xl bg-background-secondary border border-border overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                      {inspectingBookData.cover_url ? (
                        <img src={inspectingBookData.cover_url} alt={inspectingBookData.title} className="w-full h-full object-cover" />
                      ) : (
                        <Headphones className="w-8 h-8 text-gold" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase text-gold">
                          {inspectingBookData.category_name} • {inspectingBookData.country}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-background border border-border text-foreground-muted">
                          {inspectingBookData.format_type === "audio" ? "Livre audio autonome" : "Version audio rattachée"}
                        </span>
                        {renderStatusBadge(inspectingBookData.audio_status)}
                      </div>

                      <h4 className="font-serif font-bold text-lg text-navy leading-snug">
                        {inspectingBookData.title}
                      </h4>

                      <p className="text-xs text-foreground-muted">
                        Auteurs : <strong className="text-navy">{inspectingBookData.authors_display}</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-navy font-bold">
                          <Clock className="w-4 h-4 text-gold" />
                          <span>{formatAudioDuration(inspectingBookData.total_duration_seconds)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-foreground-muted font-sans">
                          <Music className="w-4 h-4 text-navy" />
                          <span>{inspectingBookData.total_tracks_count} piste{inspectingBookData.total_tracks_count > 1 ? "s" : ""} au total</span>
                        </div>
                        <div className="text-navy font-bold">
                          {inspectingBookData.price_audio_xof?.toLocaleString("fr-FR")} FCFA / {inspectingBookData.price_audio_eur?.toFixed(2)} €
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filtre Voix */}
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-gold" />
                      <span className="font-serif font-bold text-sm text-navy">Pistes Sonores & Narrations</span>
                    </div>

                    <div className="inline-flex items-center p-1 rounded-xl bg-background-secondary border border-border text-xs">
                      <button
                        type="button"
                        onClick={() => setInspectionVoiceFilter("all")}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          inspectionVoiceFilter === "all" ? "bg-navy text-white" : "text-foreground-muted hover:text-navy"
                        }`}
                      >
                        Toutes ({inspectingBookData.tracks?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectionVoiceFilter("male")}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          inspectionVoiceFilter === "male" ? "bg-navy text-white" : "text-foreground-muted hover:text-navy"
                        }`}
                      >
                        Homme ({inspectingBookData.tracks?.filter((t: any) => t.voice_gender === "male").length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectionVoiceFilter("female")}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                          inspectionVoiceFilter === "female" ? "bg-navy text-white" : "text-foreground-muted hover:text-navy"
                        }`}
                      >
                        Femme ({inspectingBookData.tracks?.filter((t: any) => t.voice_gender === "female").length || 0})
                      </button>
                    </div>
                  </div>

                  {/* Liste des Pistes */}
                  {filteredInspectionTracks.length === 0 ? (
                    <div className="p-8 text-center text-xs text-foreground-muted bg-background-secondary/30 rounded-2xl border border-dashed border-border">
                      Aucune piste sonore trouvée pour ce filtre.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInspectionTracks.map((track: any, idx: number) => (
                        <div
                          key={track.id || idx}
                          className="p-4 rounded-2xl border border-border bg-background hover:border-gold/50 transition-all flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-navy/5 border border-navy/10 flex items-center justify-center text-navy shrink-0">
                                <FileAudio className="w-4 h-4 text-gold" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-navy">
                                    {track.track_type === "full" ? "Livre complet" : `Chapitre ${track.chapter_number || idx + 1}`}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    track.voice_gender === "male"
                                      ? "bg-navy/10 text-navy border border-navy/20"
                                      : "bg-gold/15 text-gold border border-gold/30"
                                  }`}>
                                    {track.voice_gender === "male" ? "Voix Homme" : "Voix Femme"}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground-muted font-serif">
                                  {track.title || `Piste ${idx + 1}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 font-mono text-xs text-foreground-muted">
                              <span className="flex items-center gap-1 font-semibold text-navy">
                                <Clock className="w-3.5 h-3.5 text-gold" />
                                {formatAudioDuration(track.duration_seconds || 0)}
                              </span>
                              {track.bitrate_kbps && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-background-secondary border border-border">
                                  {track.bitrate_kbps} kbps
                                </span>
                              )}
                              {track.file_size_bytes && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-background-secondary border border-border">
                                  {(track.file_size_bytes / (1024 * 1024)).toFixed(1)} Mo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Lecteur audio intégré si URL accessible */}
                          {track.audio_url && (
                            <div className="pt-2 border-t border-border/60">
                              <audio
                                controls
                                preload="none"
                                src={track.audio_url}
                                className="w-full h-8"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Footer Modal */}
            <div className="p-5 border-t border-border bg-background-secondary/30 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setInspectingBookId(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background transition-colors cursor-pointer"
              >
                Fermer
              </button>

              {inspectingBookData && (
                <Link
                  href={`/admin/audio/${inspectingBookData.id}/edit`}
                  className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-gold" />
                  <span>Accéder à l'Éditeur Complet</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale d'Édition Rapide (Admin) */}
      {quickEditBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveQuickEdit}
            className="w-full max-w-md rounded-3xl bg-background border border-border p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-base text-navy">
                  Édition Rapide — Tarifs & Statut
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickEditBook(null)}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-foreground-muted line-clamp-1">
              Ouvrage : <strong className="text-navy font-semibold">{quickEditBook.title}</strong>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  Tarif Livre Audio en FCFA (XOF)
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={quickPriceXof}
                  onChange={(e) => setQuickPriceXof(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-navy"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  Tarif Livre Audio en Euros (€ EUR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.05}
                  value={quickPriceEur}
                  onChange={(e) => setQuickPriceEur(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-navy"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1.5">
                  Statut de diffusion audio
                </label>
                <select
                  value={quickStatus}
                  onChange={(e) => setQuickStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
                >
                  <option value="draft">Brouillon</option>
                  <option value="pending_layout_validation">Attente Chef Maquettiste</option>
                  <option value="pending_legal_validation">Attente Juriste</option>
                  <option value="published">Publié au catalogue public</option>
                  <option value="rejected">Rejeté / Demande de corrections</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setQuickEditBook(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isQuickSaving}
                className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isQuickSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modale de Confirmation de Suppression (Admin) */}
      {deletingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-background border border-border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 pb-2 border-b border-border">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-navy">
                  Supprimer le livre audio ?
                </h3>
                <p className="text-xs text-foreground-muted">
                  Confirmation de l'opération de suppression
                </p>
              </div>
            </div>

            {/* Avertissement selon nature du livre */}
            <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-semibold">Avertissement important :</p>
              <p>
                {deletingBook.format_type === "audio"
                  ? "Cet ouvrage est un livre audio autonome. Cette action supprimera définitivement le livre audio du catalogue, ainsi que l'ensemble de ses pistes sonores hébergées."
                  : "Cet ouvrage possède également une version numérique ou papier. Cette action supprimera l'ensemble des pistes audio et désactivera la version audio, sans impacter la publication principale."}
              </p>
            </div>

            {/* Fiche récapitulative */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background-secondary border border-border">
              <div className="w-10 h-14 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {deletingBook.cover_url ? (
                  <img src={deletingBook.cover_url} alt={deletingBook.title} className="w-full h-full object-cover" />
                ) : (
                  <Headphones className="w-5 h-5 text-gold" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif font-bold text-xs text-navy truncate">
                  {deletingBook.title}
                </h4>
                <p className="text-[11px] text-foreground-muted truncate">
                  {deletingBook.authors_display}
                </p>
                <p className="text-[10px] font-mono text-gold font-bold">
                  {deletingBook.total_tracks_count} piste{deletingBook.total_tracks_count > 1 ? "s" : ""} • {formatAudioDuration(deletingBook.total_duration_seconds)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBook(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression en cours...</span>
                  </>
                ) : (
                  <span>Confirmer la suppression</span>
                )}
              </button>
            </div>
          </div>
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
