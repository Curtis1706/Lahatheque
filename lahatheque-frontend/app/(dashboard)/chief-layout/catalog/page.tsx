"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Pencil,
  ExternalLink,
  Eye,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Headphones,
  GraduationCap,
} from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthorsDisplay } from "@/components/features/catalog/authors-display";
import { EditBookModal } from "@/components/features/chief-layout/edit-book-modal";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { getCatalogBooks } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { toast } from "sonner";

export default function ChiefLayoutCatalogPage() {
  const { playBook } = useAudioPlayer();
  const [books, setBooks] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale d'édition
  const [editingBook, setEditingBook] = useState<LayoutDeposit | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCatalogBooks();
      setBooks(data);
    } catch {
      toast.error("Erreur lors du chargement du catalogue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistiques KPIs calculées sur l'intégralité du catalogue
  const totalCount = books.length;
  const publishedCount = useMemo(
    () => books.filter((b) => b.status === "published").length,
    [books]
  );
  const paperAvailableCount = useMemo(
    () => books.filter((b) => Boolean(b.is_paper_available)).length,
    [books]
  );
  const pendingCount = useMemo(
    () => books.filter((b) => b.status === "pending_validation").length,
    [books]
  );

  // Colonnes du DataTable
  const columns: DataTableColumn<LayoutDeposit>[] = [
    {
      key: "title",
      header: "Ouvrage & Couverture",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <BookCover3D
            title={row.metadata.title}
            authors={row.metadata.authors}
            discipline={row.classification.discipline}
            coverUrl={row.files.cover_url}
            size="xs"
          />
          <div className="min-w-0 max-w-xs space-y-0.5">
            <p className="font-semibold text-xs text-foreground truncate">
              {row.metadata.title}
            </p>
            <p className="text-[11px] font-mono text-foreground-muted">
              ISBN: {row.metadata.isbn || "—"}
            </p>
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold bg-navy/10 text-navy">
                Langue: {(row.metadata.language || "fr").toUpperCase()}
              </span>
              {Boolean(row.files.format) && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-secondary text-foreground-muted border border-border uppercase">
                  {row.files.format}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s) & Institution",
      cell: (row) => (
        <div className="max-w-xs space-y-1">
          <AuthorsDisplay
            authors={row.metadata.authors}
            bookTitle={row.metadata.title}
            maxVisible={2}
            className="text-xs font-medium text-foreground"
          />
          {row.classification.university ? (
            <p className="text-[11px] text-gold font-medium flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-gold shrink-0" />
              <span className="truncate">{row.classification.university}</span>
            </p>
          ) : (
            <p className="text-[11px] text-foreground-muted">Édition LAHA</p>
          )}
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-background-secondary border border-border text-foreground-muted font-medium inline-block max-w-[150px] truncate">
          {row.classification.discipline || "Non classé"}
        </span>
      ),
    },
    {
      key: "pricing",
      header: "Formats & Tarifs",
      cell: (row) => (
        <div className="font-mono text-xs space-y-0.5">
          <span className="font-bold text-navy block">
            {row.default_price.toLocaleString("fr-FR")} XOF{" "}
            <span className="text-[9px] font-sans text-foreground-muted font-normal">
              (Numérique)
            </span>
          </span>
          <span className="text-[10px] text-foreground-muted block">
            Papier:{" "}
            <strong className={row.is_paper_available ? "text-gold font-bold" : "text-foreground-muted"}>
              {row.is_paper_available
                ? `${(row.admin_price || 7500).toLocaleString("fr-FR")} XOF`
                : "Désactivé"}
            </strong>
          </span>
          {(row.has_audio_version || (row as any).has_audio || row.price_audio) && (
            <span className="text-[10px] text-gold font-bold flex items-center gap-1">
              <Headphones className="w-3 h-3 text-gold shrink-0" />
              <span>
                Audio: {(row.price_audio || 3500).toLocaleString("fr-FR")} XOF
              </span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Dépôt",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "id",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => setEditingBook(row)}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-gold hover:text-navy text-foreground-muted transition-colors cursor-pointer"
            title="Modifier l'ouvrage et ses tarifs"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {(row.has_audio_version || (row as any).has_audio || row.price_audio) && (
            <button
              type="button"
              onClick={() => playBook(row.id)}
              className="p-1.5 rounded-lg border border-gold/40 bg-gold/10 hover:bg-gold hover:text-navy text-gold transition-colors cursor-pointer"
              title="Écouter la piste audio"
            >
              <Headphones className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            href={`/catalog/reader/${row.id}`}
            target="_blank"
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-navy hover:text-white text-foreground-muted transition-colors cursor-pointer"
            title="Aperçu dans la liseuse sécurisée"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          <Link
            href={`/student/catalog/${row.id}`}
            target="_blank"
            className="p-1.5 rounded-lg border border-border bg-background hover:border-gold hover:text-navy text-foreground-muted transition-colors cursor-pointer"
            title="Consulter sur le catalogue public"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
  ];

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
            Supervision de l&apos;ensemble du catalogue universitaire, modification des métadonnées, prix et activation de la disponibilité papier.
          </p>
        </div>

        <Link
          href="/chief-layout/deposit"
          className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-bold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0 min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-navy" />
          Déposer un Nouvel Ouvrage
        </Link>
      </div>

      {/* Cartes de KPIs Réels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
            Total Ouvrages
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {totalCount.toLocaleString("fr-FR")}
          </p>
          <span className="text-[10px] text-foreground-muted">Au catalogue global</span>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-success uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Publiés en Ligne
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {publishedCount.toLocaleString("fr-FR")}
          </p>
          <span className="text-[10px] text-success font-medium">Accessibles aux lecteurs</span>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            Version Papier
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {paperAvailableCount.toLocaleString("fr-FR")}
          </p>
          <span className="text-[10px] text-gold font-medium">Commandables en physique</span>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            En Attente
          </span>
          <p className="text-xl sm:text-2xl font-serif font-bold text-navy">
            {pendingCount.toLocaleString("fr-FR")}
          </p>
          <span className="text-[10px] text-foreground-muted">À valider</span>
        </div>
      </div>

      {/* DataTable Professionnel des Ouvrages */}
      <DataTable
        data={books}
        columns={columns}
        rowKey="id"
        loading={loading}
        filterKey="status"
        filterOptions={[
          { value: "all", label: "Tous les statuts" },
          { value: "published", label: "Publiés" },
          { value: "submitted", label: "En Attente" },
          { value: "pending_legal_approval", label: "Approbation Juridique" },
          { value: "revision_requested", label: "Retouche demandée" },
          { value: "draft", label: "Brouillons" },
        ]}
        searchPlaceholder="Rechercher par titre, auteur, discipline ou ISBN..."
        pageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        emptyMessage="Aucun ouvrage ne correspond à vos critères de recherche."
      />

      {/* Modale d'Édition Rapide */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen={Boolean(editingBook)}
          onClose={() => setEditingBook(null)}
          onSaved={(updated) => {
            setBooks((prev) =>
              prev.map((b) => (b.id === updated.id ? updated : b))
            );
            toast.success("Ouvrage mis à jour avec succès !");
          }}
        />
      )}
    </div>
  );
}
