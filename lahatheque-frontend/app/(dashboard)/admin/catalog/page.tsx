"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getAdminCatalog, updateBookPricing, deleteAdminCatalogBook } from "@/lib/services/admin";
import { AdminCatalogBook } from "@/lib/types/admin";
import { BookOpen, Search, Tag, History, Shield, Eye, Pencil, X, Save, CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";

export default function AdminCatalogPage() {
  const [books, setBooks] = useState<AdminCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // State pour la modale d'édition
  const [editingBook, setEditingBook] = useState<AdminCatalogBook | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriceDigital, setEditPriceDigital] = useState<number>(5000);
  const [editPricePaper, setEditPricePaper] = useState<number>(7500);
  const [editStatus, setEditStatus] = useState<AdminCatalogBook["status"]>("published");
  const [saving, setSaving] = useState(false);

  // State pour la suppression
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<AdminCatalogBook | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await getAdminCatalog();
        setBooks(data);
      } catch (err) {
        console.error("Erreur chargement catalogue admin", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleOpenEditModal = (book: AdminCatalogBook) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditPriceDigital(book.price_digital);
    setEditPricePaper(book.price_paper);
    setEditStatus(book.status);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    setSaving(true);
    try {
      await updateBookPricing(editingBook.id, {
        title: editTitle,
        price_digital: editPriceDigital,
        price_paper: editPricePaper,
        status: editStatus,
      });

      toast.success("Ouvrage et tarifs mis à jour avec succès !");
      setBooks((prev) =>
        prev.map((b) =>
          b.id === editingBook.id
            ? {
                ...b,
                title: editTitle,
                price_digital: editPriceDigital,
                price_paper: editPricePaper,
                status: editStatus,
              }
            : b
        )
      );
      setEditingBook(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur réseau lors de la modification.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteConfirmBook) return;
    const target = deleteConfirmBook;
    setBooks((prev) => prev.filter((b) => b.id !== target.id));
    setDeleteConfirmBook(null);
    try {
      const res = await deleteAdminCatalogBook(target.id);
      if (res.success) {
        toast.success(`L'ouvrage "${target.title}" a été supprimé définitivement du catalogue.`);
      } else {
        toast.error(res.error || "Erreur lors de la suppression de l'ouvrage.");
        const data = await getAdminCatalog();
        setBooks(data);
      }
    } catch {
      toast.error("Erreur serveur lors de la suppression.");
      const data = await getAdminCatalog();
      setBooks(data);
    }
  };

  const formatAuthors = (authors?: string[] | string, fallbackName?: string): string => {
    if (Array.isArray(authors) && authors.length > 0) return authors.join(", ");
    if (typeof authors === "string" && authors.trim().length > 0) return authors;
    if (fallbackName && fallbackName.trim().length > 0) return fallbackName;
    return "Auteur non renseigné";
  };

  const columns: DataTableColumn<AdminCatalogBook>[] = [
    {
      key: "title",
      header: "Ouvrage & Couverture",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <BookCover3D
            title={row.title}
            authors={row.authors || row.author_name}
            discipline={row.discipline}
            coverUrl={row.cover_image || row.cover_url}
            size="xs"
          />
          <div className="min-w-0 max-w-xs">
            <p className="font-semibold text-xs text-foreground truncate">{row.title}</p>
            <p className="text-[11px] font-mono text-foreground-muted">ISBN: {row.isbn || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s) & Éditeur",
      cell: (row) => (
        <div>
          <p className="text-xs font-medium text-foreground">{formatAuthors(row.authors, row.author_name)}</p>
          <p className="text-[11px] text-gold font-medium">{row.publisher_name}</p>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-background-secondary border border-border text-foreground-muted font-medium">
          {row.discipline || "Non classé"}
        </span>
      ),
    },
    {
      key: "price_digital",
      header: "Prix Numérique / Papier",
      cell: (row) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-navy">{row.price_digital.toLocaleString("fr-FR")} FCFA</span>
          <span className="text-[10px] text-foreground-muted block">Papier: {row.price_paper.toLocaleString("fr-FR")} FCFA</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Dépôt",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "protection_type",
      header: "DRM / Protection",
      cell: (row) => (
        <Link
          href={`/publisher/catalog/${row.id}/protection`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/10 hover:bg-navy hover:text-white text-navy font-semibold text-[11px] font-mono uppercase transition-all group"
          title="Configurer les règles de protection pour cet ouvrage"
        >
          <Shield className="w-3 h-3 text-gold group-hover:text-gold" />
          <span>{row.protection_type || "LCP"}</span>
        </Link>
      ),
    },
    {
      key: "id",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-gold hover:text-navy text-foreground-muted transition-colors cursor-pointer"
            title="Modifier le prix ou statut"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/publisher/catalog/${row.id}/protection`}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-navy hover:text-white text-foreground-muted transition-colors"
            title="Gérer les droits DRM"
          >
            <Shield className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/catalog/reader/${row.id}`}
            target="_blank"
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-navy hover:text-white text-foreground-muted transition-colors cursor-pointer"
            title="Aperçu dans la liseuse"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteConfirmBook(row)}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-error/15 text-foreground-muted hover:text-error transition-colors cursor-pointer"
            title="Supprimer définitivement l'ouvrage"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy">Gestion du Catalogue Global</h1>
          <p className="text-xs text-foreground-muted mt-1">
            Supervision du catalogue universitaire, tarification dérogatoire et politiques de protection DRM.
          </p>
        </div>

        {/* Boutons d'action et bascule de vue */}
        <div className="flex flex-wrap items-center gap-2.5">
          <ViewToggle mode={viewMode} onChange={setViewMode} />

          <Link
            href="/admin/settings/drm"
            className="px-3.5 py-2 rounded-xl bg-gold/10 border border-gold/30 text-navy font-bold text-xs hover:bg-gold/20 transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <Shield className="w-3.5 h-3.5 text-gold" />
            Politiques DRM
          </Link>
          <Link
            href="/admin/catalog/pricing"
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            Tarification
          </Link>
          <Link
            href="/admin/catalog/pricing/history"
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <History className="w-3.5 h-3.5 text-navy" />
            Historique Prix
          </Link>
        </div>
      </div>

      {/* Mode de vue conditionnel (Grille / Liste) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {books.map((book) => (
            <div key={book.id} className="p-4 rounded-2xl bg-background border border-border space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between group shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-light text-navy font-bold truncate max-w-[120px]">
                    {book.discipline || "Général"}
                  </span>
                  <StatusBadge status={book.status} />
                </div>

                {/* Couverture 3D élégante centrée */}
                <div className="flex justify-center py-1">
                  <BookCover3D
                    title={book.title}
                    authors={book.authors || book.author_name}
                    discipline={book.discipline}
                    coverUrl={book.cover_image || book.cover_url}
                    size="sm"
                  />
                </div>

                <div className="space-y-1 text-center">
                  <h3 className="font-serif font-bold text-sm text-foreground line-clamp-2">{book.title}</h3>
                  <p className="text-xs text-foreground-muted truncate">Par {formatAuthors(book.authors, book.author_name)}</p>
                  <p className="text-xs text-gold font-medium">{book.publisher_name}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">{book.price_digital.toLocaleString("fr-FR")} FCFA</span>
                  <span className="text-[10px] text-foreground-muted uppercase font-bold">{book.protection_type || "LCP"}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(book)}
                    className="p-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-navy transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Modifier l'ouvrage et ses tarifs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gold" />
                  </button>
                  <Link
                    href={`/publisher/catalog/${book.id}/protection`}
                    className="flex-1 py-2 px-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-navy text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 min-h-[36px]"
                  >
                    <Shield className="w-3 h-3 text-gold" />
                    <span>Protection</span>
                  </Link>
                  <Link
                    href={`/catalog/reader/${book.id}`}
                    target="_blank"
                    className="p-2 rounded-xl bg-navy/10 hover:bg-navy hover:text-white text-navy transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                    title="Ouvrir dans le lecteur sécurisé"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmBook(book)}
                    className="p-2 rounded-xl bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Supprimer définitivement l'ouvrage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataTable
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          filterKey="status"
          filterOptions={[
            { value: "all", label: "Tous les Statuts" },
            { value: "published", label: "Publiés" },
            { value: "submitted", label: "En Soumission" },
            { value: "draft", label: "Brouillons" },
            { value: "archived", label: "Archivés" },
          ]}
          searchPlaceholder="Rechercher par titre ou auteur..."
        />
      )}

      {/* Modale d'Édition Rapide */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-background rounded-3xl border border-border p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-base">Modifier l&apos;Ouvrage</h3>
                  <p className="text-[11px] text-foreground-muted">Édition des métadonnées et tarifs catalogue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="p-1 text-foreground-muted hover:text-navy rounded-lg hover:bg-background-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-navy">Titre de l&apos;Ouvrage</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-navy">Prix Numérique (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={editPriceDigital}
                    onChange={(e) => setEditPriceDigital(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-navy">Prix Papier (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={editPricePaper}
                    onChange={(e) => setEditPricePaper(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-navy">Statut de Publication</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdminCatalogBook["status"])}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy"
                >
                  <option value="published">Publié (En ligne)</option>
                  <option value="draft">Brouillon</option>
                  <option value="submitted">En Soumission</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold hover:bg-background-secondary transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold transition-colors flex items-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-gold" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation de Suppression d'un Ouvrage */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-background rounded-3xl border border-border p-6 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-error/15 text-error mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-foreground">Supprimer l&apos;Ouvrage</h3>
              <p className="text-xs text-foreground-muted mt-1.5">
                Êtes-vous sûr de vouloir supprimer définitivement l&apos;ouvrage{" "}
                <span className="font-semibold text-foreground">
                  &laquo; {deleteConfirmBook.title} &raquo;
                </span>{" "}
                du catalogue ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBook(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-secondary cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                className="px-4 py-2 rounded-xl bg-error text-white font-bold text-xs hover:bg-error/90 transition-colors cursor-pointer shadow-xs"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
