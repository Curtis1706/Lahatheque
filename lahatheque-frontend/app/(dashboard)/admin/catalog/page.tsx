"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminCatalog } from "@/lib/services/admin";
import { AdminCatalogBook } from "@/lib/types/admin";
import { BookOpen, Search, Tag, History, Shield, Eye } from "lucide-react";
import Link from "next/link";

export default function AdminCatalogPage() {
  const [books, setBooks] = useState<AdminCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);

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
        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-navy-light text-navy font-semibold">
          {row.protection_type}
        </span>
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

        <div className="flex items-center gap-2">
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

      {/* Main Table */}
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
    </div>
  );
}
