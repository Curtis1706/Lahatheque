"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileBarChart, ArrowLeft, Eye, Download, DollarSign, Filter, TrendingUp } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getPublisherBooks } from "@/lib/services/publisher";
import type { PublisherBook } from "@/lib/types/publisher";

export default function PublisherStatsPage() {
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPublisherBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalConsultations = books.reduce((acc, b) => acc + b.consultations_count, 0);
  const totalDownloads = books.reduce((acc, b) => acc + b.downloads_count, 0);
  const totalRevenue = books.reduce((acc, b) => acc + b.revenue_generated, 0);

  const columns: DataTableColumn<PublisherBook>[] = [
    {
      key: "title",
      header: "Titre de l'Ouvrage",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          <p className="text-[10px] text-foreground-muted font-mono">ISBN : {row.isbn_digital}</p>
        </div>
      ),
    },
    {
      key: "consultations_count",
      header: "Consultations",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.consultations_count.toLocaleString("fr-FR")} vues
        </span>
      ),
    },
    {
      key: "downloads_count",
      header: "Téléchargements",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.downloads_count.toLocaleString("fr-FR")} fois
        </span>
      ),
    },
    {
      key: "revenue_generated",
      header: "Revenus Générés",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.revenue_generated.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Statistiques</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <FileBarChart className="w-4 h-4 text-gold" />
            Analytique du Catalogue (Section 12)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Statistiques &amp; Performances
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultations, téléchargements et chiffre d&apos;affaires généré par votre catalogue exclusif.
          </p>
        </div>
      </div>

      {/* Cartes de Synthèse Globale */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">Total Consultations</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><Eye className="w-4 h-4" /></div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">{totalConsultations.toLocaleString("fr-FR")}</p>
          <p className="text-[11px] text-foreground-muted">Lectures uniques sur la plateforme</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">Total Téléchargements</span>
            <div className="p-2 rounded-xl bg-gold/15 text-gold"><Download className="w-4 h-4" /></div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">{totalDownloads.toLocaleString("fr-FR")}</p>
          <p className="text-[11px] text-foreground-muted">Ouvertures autorisées en LCP DRM</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">Chiffre d&apos;Affaires Cumulé</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><DollarSign className="w-4 h-4" /></div>
          </div>
          <p className="font-bold text-2xl text-gold font-mono">{totalRevenue.toLocaleString("fr-FR")} XOF</p>
          <p className="text-[11px] text-foreground-muted">Ventes directes &amp; Bouquets</p>
        </div>
      </div>

      {/* Table par ouvrage */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Détail des Performances par Ouvrage ({books.length})
        </h3>

        <DataTable
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun ouvrage n'a encore généré de statistiques."
          pageSize={10}
        />
      </div>
    </div>
  );
}
