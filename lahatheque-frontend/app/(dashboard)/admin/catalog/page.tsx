"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminCatalog } from "@/lib/services/admin";
import { AdminCatalogBook } from "@/lib/types/admin";
import { BookOpen, Search, Tag, History, Shield, Eye } from "lucide-react";
import Link from "next/link";

import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";

export default function AdminCatalogPage() {
  const [books, setBooks] = useState<AdminCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
          <p className="text-xs font-medium text-foreground">{row.authors.join(", ")}</p>
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
          <Link
            href={`/publisher/catalog/${row.id}/protection`}
            className="p-1.5 rounded-lg bg-gold/10 text-navy hover:bg-gold/20 transition-colors"
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
                <p className="text-xs text-foreground-muted truncate">Par {book.authors.join(", ")}</p>
                <p className="text-xs text-gold font-medium">{book.publisher_name}</p>
              </div>

              <div className="pt-3 border-t border-border space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">{book.price_digital.toLocaleString("fr-FR")} FCFA</span>
                  <span className="text-[10px] text-foreground-muted uppercase font-bold">{book.protection_type}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 font-sans">
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
    </div>
  );
}
