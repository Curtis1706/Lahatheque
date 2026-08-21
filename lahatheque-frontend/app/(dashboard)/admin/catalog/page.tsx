"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminCatalog, updateBookPricing } from "@/lib/services/admin";
import { AdminCatalogBook } from "@/lib/types/admin";
import { BookOpen, Search, Tag, History, Shield, Eye, Pencil, X, Save, CheckCircle2 } from "lucide-react";
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

  const formatAuthors = (authors?: string[] | string, fallbackName?: string): string => {
    if (Array.isArray(authors) && authors.length > 0) return authors.join(", ");
    if (typeof authors === "string" && authors.trim().length > 0) return authors;
    if (fallbackName && fallbackName.trim().length > 0) return fallbackName;
    return "Auteur non renseigné";
  };

  const columns: DataTableColumn<AdminCatalogBook>[] = [
    {
      key: "title",
      header: "Titre & ISBN",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground max-w-xs truncate">{row.title}</p>
          <p className="text-[11px] font-mono text-foreground-muted">ISBN: {row.isbn}</p>
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
        <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-foreground-muted">
          {row.discipline}
        </span>
      ),
    },
    {
      key: "price_digital",
      header: "Prix Numérique / Papier",
      cell: (row) => (
        <div className="font-mono text-xs">
          <span className="font-bold text-foreground">{row.price_digital.toLocaleString("fr-FR")} FCFA</span>
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
          <span>{row.protection_type}</span>
        </Link>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-1.5 rounded-lg bg-gold/10 text-navy hover:bg-gold/20 transition-colors cursor-pointer"
            title="Modifier le prix et les informations de cet ouvrage"
          >
            <Pencil className="w-3.5 h-3.5 text-gold" />
          </button>
          <Link
            href={`/publisher/catalog/${row.id}/protection`}
            className="p-1.5 rounded-lg bg-navy/10 text-navy hover:bg-navy hover:text-white transition-colors"
            title="Paramétrer la protection DRM de l'ouvrage"
          >
            <Shield className="w-3.5 h-3.5 text-gold" />
          </Link>
          <Link
            href={`/catalog/reader/${row.id}`}
            className="p-1.5 rounded-lg bg-navy/10 text-navy hover:bg-navy hover:text-white transition-colors"
            title="Ouvrir dans le lecteur universel sécurisé"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion du Catalogue Global
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Supervision du catalogue universitaire, tarification dérogatoire et politiques de protection DRM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/admin/settings/drm"
            className="px-3.5 py-2 rounded-xl bg-gold/10 border border-gold/30 text-navy font-bold text-xs hover:bg-gold/20 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-gold" />
            Politiques DRM
          </Link>
          <Link
            href="/admin/catalog/pricing"
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            Tarification
          </Link>
          <Link
            href="/admin/catalog/pricing/history"
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5"
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
            <div key={book.id} className="p-4 rounded-2xl bg-background border border-border space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-light text-navy font-bold">
                    {book.discipline}
                  </span>
                  <StatusBadge status={book.status} />
                </div>
                <h3 className="font-serif font-bold text-sm text-foreground line-clamp-2">{book.title}</h3>
                <p className="text-xs text-foreground-muted truncate">Par {formatAuthors(book.authors, book.author_name)}</p>
                <p className="text-xs text-gold font-medium">{book.publisher_name}</p>
              </div>

              <div className="pt-3 border-t border-border space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">{book.price_digital.toLocaleString("fr-FR")} FCFA</span>
                  <span className="text-[10px] text-foreground-muted uppercase font-bold">{book.protection_type}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-sans">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(book)}
                    className="p-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-navy transition-colors cursor-pointer"
                    title="Modifier l'ouvrage et ses tarifs"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gold" />
                  </button>
                  <Link
                    href={`/publisher/catalog/${book.id}/protection`}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-navy text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <Shield className="w-3 h-3 text-gold" />
                    <span>Protection</span>
                  </Link>
                  <Link
                    href={`/catalog/reader/${book.id}`}
                    className="p-1.5 rounded-lg bg-navy/10 hover:bg-navy hover:text-white text-navy transition-colors"
                    title="Ouvrir dans le lecteur sécurisé"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
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
            { value: "published", label: "Publié" },
            { value: "in_review", label: "En Relecture" },
            { value: "submitted", label: "Soumis" },
          ]}
          filterPlaceholder="Filtrer par statut..."
          searchPlaceholder="Rechercher par titre, auteur ou ISBN..."
        />
      )}

      {/* Modale d'Édition d'Ouvrage par l'Administrateur */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-lg">Modifier l&apos;Ouvrage</h3>
                  <p className="text-xs text-foreground-muted font-mono">ISBN: {editingBook.isbn || "Non attribué"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4">
              {/* Titre */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Titre de l&apos;Ouvrage</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>

              {/* Prix Numérique & Prix Papier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Prix Numérique (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    required
                    value={editPriceDigital}
                    onChange={(e) => setEditPriceDigital(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground font-mono font-bold focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Prix Papier (FCFA)</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    required
                    value={editPricePaper}
                    onChange={(e) => setEditPricePaper(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground font-mono font-bold focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>
              </div>

              {/* Statut du Dépôt */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Statut du Dépôt</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AdminCatalogBook["status"])}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                >
                  <option value="published">Publié (Disponible en Vitrine)</option>
                  <option value="pending_validation">En attente de validation</option>
                  <option value="draft">Brouillon</option>
                  <option value="revision_requested">Demande de retouche</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>

              {/* Boutons d'Action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary transition-colors min-h-[44px] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 min-h-[44px] cursor-pointer"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-gold" />
                      Enregistrer les Modifications
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
