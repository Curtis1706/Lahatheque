"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  FileBarChart,
  ArrowLeft,
  Eye,
  DollarSign,
  TrendingUp,
  BookOpen,
  PlusCircle,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublisherBooks, getPublisherKpis } from "@/lib/services/publisher";
import type { PublisherBook, PublisherKpis } from "@/lib/types/publisher";

export default function PublisherStatsPage() {
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [kpis, setKpis] = useState<PublisherKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [booksData, kpisData] = await Promise.all([
          getPublisherBooks(),
          getPublisherKpis().catch(() => null),
        ]);
        setBooks(booksData);
        if (kpisData) setKpis(kpisData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalConsultations = useMemo(() => {
    if (kpis?.totalConsultations !== undefined && kpis.totalConsultations > 0) {
      return kpis.totalConsultations;
    }
    return books.reduce((acc, b) => acc + (b.consultations_count || 0), 0);
  }, [kpis, books]);

  const publishedBooksCount = useMemo(() => {
    if (kpis?.publishedBooks !== undefined && kpis.publishedBooks > 0) {
      return kpis.publishedBooks;
    }
    return books.filter((b) => b.status === "published").length;
  }, [kpis, books]);

  const totalRevenue = useMemo(() => {
    if (kpis?.totalRevenue !== undefined && kpis.totalRevenue > 0) {
      return kpis.totalRevenue;
    }
    return books.reduce((acc, b) => acc + (b.revenue_generated || 0), 0);
  }, [kpis, books]);

  const columns: DataTableColumn<PublisherBook>[] = [
    {
      key: "title",
      header: "Ouvrage & ISBN",
      className: "min-w-[300px]",
      cell: (row) => (
        <Link
          href={`/publisher/catalog/${row.id}`}
          className="hover:opacity-90 transition-opacity flex items-center gap-3 py-1 group"
        >
          <BookCover3D
            title={row.title}
            authors={row.authors}
            discipline={row.discipline}
            coverUrl={row.cover_url}
            size="xs"
            interactive={false}
          />
          <div className="min-w-0">
            <p className="font-serif font-bold text-xs sm:text-sm text-navy leading-snug group-hover:text-gold transition-colors line-clamp-1">
              {row.title}
            </p>
            {row.subtitle && (
              <p className="text-[11px] text-foreground-muted line-clamp-1 italic">
                {row.subtitle}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-foreground-muted font-mono font-semibold">
                ISBN : {row.isbn_digital}
              </span>
              <span className="text-[10px] font-semibold text-navy bg-navy-light px-2 py-0.2 rounded">
                {row.discipline}
              </span>
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s)",
      cell: (row) => (
        <span className="font-semibold text-xs text-foreground line-clamp-2">
          {row.authors.join(", ")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "consultations_count",
      header: "Consultations Streaming",
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-navy">
          <Eye className="w-3.5 h-3.5 text-info shrink-0" />
          <span>{(row.consultations_count || 0).toLocaleString("fr-FR")} lectures</span>
        </div>
      ),
    },
    {
      key: "revenue_generated",
      header: "Revenus Générés",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {(row.revenue_generated || 0).toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "actions" as keyof PublisherBook,
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/publisher/catalog/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-foreground font-bold text-xs transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Détails</span>
          </Link>
        </div>
      ),
    },
  ];

  // Rendu Responsive Mobile
  const renderMobileCard = (row: PublisherBook) => (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <BookCover3D
          title={row.title}
          authors={row.authors}
          discipline={row.discipline}
          coverUrl={row.cover_url}
          size="xs"
          interactive={false}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge status={row.status} />
            <span className="text-[10px] font-semibold text-navy bg-navy-light px-2 py-0.5 rounded-md">
              {row.discipline}
            </span>
          </div>
          <h4 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
            {row.title}
          </h4>
          <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">
            {row.authors.join(", ")}
          </p>
          <p className="text-[10px] font-mono text-foreground-muted mt-0.5">
            ISBN : {row.isbn_digital}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-background-secondary/60 text-xs border border-border">
        <div>
          <span className="text-[10px] text-foreground-muted block font-semibold">Consultations</span>
          <span className="font-mono font-bold text-navy">
            {(row.consultations_count || 0).toLocaleString("fr-FR")} lectures
          </span>
        </div>
        <div>
          <span className="text-[10px] text-foreground-muted block font-semibold">Revenus Générés</span>
          <span className="font-mono font-bold text-gold">
            {(row.revenue_generated || 0).toLocaleString("fr-FR")} XOF
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Link
          href={`/publisher/catalog/${row.id}`}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
        >
          <Eye className="w-3.5 h-3.5 text-gold" />
          <span>Voir Détails</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Statistiques</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/publisher"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
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
            Consultations en streaming sécurisé et chiffre d&apos;affaires généré par votre catalogue exclusif.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/publisher/catalog/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dépôt
          </Link>
        </div>
      </div>

      {/* Cartes de Synthèse Globale */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Total Consultations
            </span>
            <div className="p-2 rounded-xl bg-info/10 text-info">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">
            {totalConsultations.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-foreground-muted">Lectures uniques en streaming sécurisé</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Ouvrages Diffusés
            </span>
            <div className="p-2 rounded-xl bg-gold/15 text-gold">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">
            {publishedBooksCount} <span className="text-sm font-normal text-foreground-muted font-sans">/ {books.length} titres</span>
          </p>
          <p className="text-[11px] text-foreground-muted">Titres actifs au catalogue</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Chiffre d&apos;Affaires Cumulé
            </span>
            <div className="p-2 rounded-xl bg-success/10 text-success">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-gold font-mono">
            {totalRevenue.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">Ventes directes &amp; Bouquets</p>
        </div>
      </div>

      {/* Table par ouvrage */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Détail des Performances par Ouvrage ({books.length})
        </h3>

        <DataTable<PublisherBook>
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          searchable={true}
          searchPlaceholder="Rechercher par titre, auteur ou ISBN..."
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          mobileCard={renderMobileCard}
          emptyState={
            <div className="py-16 text-center space-y-3">
              <FileBarChart className="w-10 h-10 text-foreground-muted mx-auto" />
              <h3 className="font-serif font-bold text-navy text-base">
                Aucun résultat de statistiques
              </h3>
              <p className="text-xs text-foreground-muted max-w-md mx-auto">
                Dès que vos ouvrages déposés seront validés et consultés par les étudiants, enseignants et universités, leurs statistiques s&apos;afficheront automatiquement ici en temps réel.
              </p>
              <div className="pt-2">
                <Link
                  href="/publisher/catalog/new"
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-gold" />
                  Déposer un premier ouvrage
                </Link>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
