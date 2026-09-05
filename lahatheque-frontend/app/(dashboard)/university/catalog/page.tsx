"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { UniversityBookDetailModal } from "@/components/features/university/university-book-detail-modal";
import { getUniversityCatalog } from "@/lib/services/university";
import { useDisciplines } from "@/lib/hooks/use-disciplines";
import type { UniversityBookCatalogItem } from "@/lib/types/university";

export default function UniversityCatalogPage() {
  const [books, setBooks] = useState<UniversityBookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<UniversityBookCatalogItem | null>(null);
  const { disciplineNames } = useDisciplines();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getUniversityCatalog();
        setBooks(data);
      } catch (err) {
        console.error("Erreur chargement catalogue universitaire:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const columns: DataTableColumn<UniversityBookCatalogItem>[] = [
    {
      key: "title",
      header: "Ouvrage & Couverture",
      className: "min-w-[320px]",
      cell: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div
            onClick={() => setSelectedBook(row)}
            className="cursor-pointer hover:opacity-90 transition-opacity"
            title="Cliquez pour voir les détails"
          >
            <BookCover3D
              title={row.title}
              authors={row.authors}
              discipline={row.discipline}
              coverUrl={row.cover_url}
              size="xs"
              interactive={false}
            />
          </div>
          <div className="space-y-0.5 min-w-0">
            <button
              type="button"
              onClick={() => setSelectedBook(row)}
              className="font-serif font-bold text-xs text-navy leading-snug truncate max-w-[240px] hover:underline text-left cursor-pointer block"
              title={`Consulter la fiche détaillée : ${row.title}`}
            >
              {row.title}
            </button>
            <p className="text-[10px] text-foreground-muted truncate max-w-[240px]">
              {Array.isArray(row.authors) ? row.authors.join(", ") : (row.authors || "Auteur inconnu")}
            </p>
            <p className="text-[9px] font-mono text-foreground-muted">ISBN : {row.isbn_digital}</p>
          </div>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-navy/5 text-navy text-xs font-semibold border border-border">
          {row.discipline || "Général"}
        </span>
      ),
    },
    {
      key: "price_digital",
      header: "Tarifs Publics",
      hideOnMobile: true,
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <p className="font-mono font-semibold text-navy">
            Numérique : {row.price_digital.toLocaleString("fr-FR")} {row.currency}
          </p>
          <p className="font-mono text-[11px] text-foreground-muted">
            Papier : {row.price_paper.toLocaleString("fr-FR")} {row.currency}
          </p>
        </div>
      ),
    },
    {
      key: "consultations_count",
      header: "Usage Campus",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.consultations_count.toLocaleString("fr-FR")} vue(s)
        </span>
      ),
    },
    {
      key: "actions" as keyof UniversityBookCatalogItem,
      header: "Actions",
      className: "text-right min-w-[270px]",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => setSelectedBook(row)}
            className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-foreground-muted text-[11px] font-semibold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px] cursor-pointer"
            title="Consulter les détails de l'ouvrage"
          >
            <Eye className="w-3.5 h-3.5 text-navy" />
            <span>Détails</span>
          </button>

          <Link
            href={`/catalog/reader/${row.id}?mode=sample`}
            className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 text-navy text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
            title="Lire l'extrait gratuit"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span>Lire</span>
          </Link>

          <Link
            href={`/university/purchases/new`}
            className="px-3 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
            title="Commander des exemplaires papier"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gold" />
            <span>Commander</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue Universitaire</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Ressources Documentaires &amp; Fonds Académique
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue d&apos;Ouvrages de Votre Université
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez les ouvrages du fonds académique, lisez leurs extraits gratuits ou commandez des exemplaires papier pour votre campus.
          </p>
        </div>

        <Link
          href="/university/purchases/new"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4 text-gold" />
          Passer Commande
        </Link>
      </div>

      {/* Table DataTable 21st.dev paginée avec recherche et filtre par discipline intégrés */}
      <DataTable
        data={books}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={true}
        searchPlaceholder="Rechercher par titre, auteur ou ISBN..."
        filterKey="discipline"
        filterOptions={disciplineNames.map((d) => ({ value: d, label: d }))}
        filterPlaceholder="Toutes les disciplines"
        emptyMessage="Aucun ouvrage ne correspond à votre recherche."
        pageSize={10}
        mobileCard={(row) => (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                onClick={() => setSelectedBook(row)}
                className="cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              >
                <BookCover3D
                  title={row.title}
                  authors={row.authors}
                  discipline={row.discipline}
                  coverUrl={row.cover_url}
                  size="xs"
                  interactive={false}
                />
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setSelectedBook(row)}
                  className="font-serif font-bold text-sm text-navy leading-snug hover:underline text-left cursor-pointer block"
                >
                  {row.title}
                </button>
                <p className="text-xs text-foreground-muted">
                  {Array.isArray(row.authors) ? row.authors.join(", ") : (row.authors || "Auteur inconnu")}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-navy/5 text-navy text-[10px] font-semibold border border-border">
                    {row.discipline || "Général"}
                  </span>
                  <span className="text-[10px] font-mono text-foreground-muted">
                    ISBN : {row.isbn_digital}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
              <div>
                <p className="font-mono font-semibold text-navy">
                  Numérique : {row.price_digital.toLocaleString("fr-FR")} {row.currency}
                </p>
                <p className="font-mono text-[11px] text-foreground-muted">
                  Papier : {row.price_paper.toLocaleString("fr-FR")} {row.currency}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBook(row)}
                  className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-semibold transition-colors inline-flex items-center gap-1.5 min-h-[36px] cursor-pointer"
                  title="Consulter les détails"
                >
                  <Eye className="w-3.5 h-3.5 text-navy" />
                  <span>Détails</span>
                </button>
                <Link
                  href={`/catalog/reader/${row.id}?mode=sample`}
                  className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 text-navy text-xs font-bold transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                  title="Lire l'extrait gratuit"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  <span>Lire</span>
                </Link>
                <Link
                  href="/university/purchases/new"
                  className="px-3 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                  <span>Commander</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      />

      {/* Modale de détails d'ouvrage sécurisée en interne */}
      <UniversityBookDetailModal
        book={selectedBook}
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
