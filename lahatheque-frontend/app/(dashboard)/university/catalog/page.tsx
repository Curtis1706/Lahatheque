"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  ShoppingBag,
  Building2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getUniversityCatalog } from "@/lib/services/university";
import type { UniversityBookCatalogItem } from "@/lib/types/university";

export default function UniversityCatalogPage() {
  const [books, setBooks] = useState<UniversityBookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityCatalog();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const faculties = useMemo(() => {
    const set = new Set(books.map((b) => b.faculty_code));
    return Array.from(set);
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (facultyFilter !== "all" && b.faculty_code !== facultyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchAuthor = b.authors.some((a) => a.toLowerCase().includes(q));
        const matchIsbn = b.isbn_digital.toLowerCase().includes(q) || b.isbn_print.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchIsbn) return false;
      }
      return true;
    });
  }, [books, searchQuery, facultyFilter]);

  const columns: DataTableColumn<UniversityBookCatalogItem>[] = [
    {
      key: "title",
      header: "Ouvrage & Couverture",
      cell: (row) => (
        <div className="flex items-center gap-3 py-1">
          <div className="relative w-10 h-14 rounded-lg bg-navy/10 overflow-hidden shrink-0 border border-border shadow-xs">
            {row.cover_url ? (
              <Image
                src={row.cover_url}
                alt={row.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-navy text-white text-[9px] font-bold">
                LAHA
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="font-serif font-bold text-xs text-navy leading-snug truncate max-w-[240px]">
              {row.title}
            </p>
            <p className="text-[10px] text-foreground-muted">{row.authors.join(", ")}</p>
            <p className="text-[9px] font-mono text-foreground-muted">ISBN : {row.isbn_digital}</p>
          </div>
        </div>
      ),
    },
    {
      key: "faculty_name",
      header: "Faculté & Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <div>
          <span className="px-2 py-0.5 rounded-md bg-navy-light text-navy text-[11px] font-bold border border-navy-hover/20">
            {row.faculty_code}
          </span>
          <p className="text-[10px] text-foreground-muted mt-1">{row.discipline}</p>
        </div>
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
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Link
            href={`/catalog/reader/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold/25 text-navy text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
            title="Prévisualiser dans la Liseuse LAHA"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span>Liseuse</span>
          </Link>

          <Link
            href={`/university/purchases/new`}
            className="px-3 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gold" />
            <span>Papier</span>
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
            Catalogue d&apos;Ouvrages de l&apos;Université
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez les ouvrages affiliés à votre établissement, ouvrez-les dans la liseuse LAHA ou commandez des exemplaires papier.
          </p>
        </div>

        <Link
          href="/university/purchases/new"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4 text-gold" />
          Passer Commande Papier
        </Link>
      </div>

      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur ou ISBN..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
          >
            <option value="all">Toutes les Facultés</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table DataTable 21st.dev paginée */}
      <DataTable
        data={filteredBooks}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun ouvrage ne correspond à votre recherche."
        pageSize={10}
      />
    </div>
  );
}
