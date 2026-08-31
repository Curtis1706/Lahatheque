"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, PlusCircle, UploadCloud, ArrowLeft, Eye, ShieldCheck, Download, Edit } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublisherBooks } from "@/lib/services/publisher";
import type { PublisherBook } from "@/lib/types/publisher";

export default function PublisherCatalogPage() {
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPublisherBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchIsbn = b.isbn_digital.toLowerCase().includes(q);
        const matchAuthor = b.authors.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchIsbn && !matchAuthor) return false;
      }
      return true;
    });
  }, [books, searchQuery, statusFilter]);

  const columns: DataTableColumn<PublisherBook>[] = [
    {
      key: "title",
      header: "Ouvrage & ISBN",
      cell: (row) => (
        <Link href={`/publisher/catalog/${row.id}`} className="hover:text-navy transition-colors flex items-center gap-3">
          {row.cover_url && row.cover_url !== "/placeholder-cover.jpg" ? (
            <img
              src={row.cover_url}
              alt=""
              className="w-8 h-11 rounded-md object-cover border border-border shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-11 rounded-md bg-navy/5 border border-border flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-gold/70" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-serif font-bold text-xs text-navy leading-snug truncate max-w-[260px]">{row.title}</p>
            <p className="text-[10px] text-foreground-muted font-mono">ISBN : {row.isbn_digital}</p>
          </div>
        </Link>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s)",
      cell: (row) => <span className="font-semibold text-xs text-foreground">{row.authors.join(", ")}</span>,
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-[11px] font-semibold text-navy bg-navy-light px-2 py-0.5 rounded-md">
          {row.discipline}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut Validation",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "consultations_count",
      header: "Consultations",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground font-semibold">
          {row.consultations_count} vue(s)
        </span>
      ),
    },
    {
      key: "actions" as keyof PublisherBook,
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/catalog/reader/${row.id}`}
            className="p-2 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 transition-colors text-navy min-h-[36px] inline-flex items-center"
            title="Prévisualiser dans la Liseuse LAHA"
          >
            <BookOpen className="w-4 h-4 text-gold" />
          </Link>
          <Link
            href={`/publisher/catalog/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            Fiche &amp; Flux
          </Link>
          <Link
            href={`/publisher/catalog/${row.id}/protection`}
            className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold transition-colors text-navy min-h-[36px] inline-flex items-center"
            title="Protection DRM / Filigrane"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mon Catalogue</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Catalogue Maison d&apos;Édition
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mon Catalogue Déposé
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivi exclusif des ouvrages déposés par votre maison d&apos;édition et de leur statut de validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/publisher/catalog/batch"
            className="px-3.5 py-2.5 rounded-xl bg-background border border-border text-navy font-bold text-xs hover:border-gold transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <UploadCloud className="w-4 h-4 text-gold" />
            Import ONIX 3.0
          </Link>
          <Link
            href="/publisher/catalog/new"
            className="px-4 py-2.5 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            Nouveau Dépôt Web
          </Link>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un ouvrage par titre, ISBN ou auteur..."
          className="w-full sm:w-80 px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Tous les statuts" },
            { id: "published", label: "Publiés" },
            { id: "pending", label: "En cours de validation" },
            { id: "revision_requested", label: "Correction demandée" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                statusFilter === st.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredBooks}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun ouvrage déposé ne correspond à votre recherche."
        onRowClick={(row) => { window.location.href = `/publisher/catalog/${row.id}`; }}
        pageSize={10}
      />
    </div>
  );
}
