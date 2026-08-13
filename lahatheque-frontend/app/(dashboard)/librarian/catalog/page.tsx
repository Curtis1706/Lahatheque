"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, ArrowLeft, Eye, Download, Search, Filter } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { FacultyTreeView } from "@/components/features/librarian/faculty-tree-view";
import { getUniversityBooks } from "@/lib/services/librarian";
import type { UniversityBook } from "@/lib/types/librarian";

export default function UniversityCatalogPage() {
  const [books, setBooks] = useState<UniversityBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "tree">("tree");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (facultyFilter !== "all" && !b.faculty.includes(facultyFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchIsbn = b.isbn_digital.toLowerCase().includes(q);
        const matchAuthor = b.authors.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchIsbn && !matchAuthor) return false;
      }
      return true;
    });
  }, [books, searchQuery, facultyFilter]);

  const columns: DataTableColumn<UniversityBook>[] = [
    {
      key: "title",
      header: "Titre & Auteurs",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          <p className="text-[10px] text-foreground-muted">Auteurs : {row.authors.join(", ")}</p>
        </div>
      ),
    },
    {
      key: "faculty",
      header: "Faculté Rattachée",
      cell: (row) => <span className="font-semibold text-xs text-navy">{row.faculty}</span>,
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => <span className="text-[11px] font-semibold text-foreground">{row.discipline}</span>,
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
      key: "royalty_15_percent",
      header: "Redevance 15%",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.royalty_15_percent.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/librarian" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mon Catalogue Établissement</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/librarian" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-gold" />
            Fonds Documentaire Rattaché (Section 4.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mon Catalogue Établissement
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Ouvrages rattachés automatiquement à votre université (IA), organisés par faculté et par discipline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("tree")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              viewMode === "tree" ? "bg-navy text-white" : "bg-background-secondary text-foreground-muted hover:text-navy"
            }`}
          >
            Vue Arborescence (Tree)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              viewMode === "table" ? "bg-navy text-white" : "bg-background-secondary text-foreground-muted hover:text-navy"
            }`}
          >
            Vue Tableau (Table)
          </button>
        </div>
      </div>

      {/* Moteur de Recherche Full-Text & Filtres par Faculté */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Recherche full-text par titre, auteur, discipline..."
          className="w-full sm:w-80 px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Toutes facultés" },
            { id: "FADESP", label: "FADESP (Droit)" },
            { id: "FASEG", label: "FASEG (Économie)" },
            { id: "FSS", label: "FSS (Santé)" },
            { id: "FSA", label: "FSA (Agronomie)" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFacultyFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                facultyFilter === f.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Affichage Tree View 21st.dev originui id: 4316 vs DataTable */}
      {viewMode === "tree" ? (
        <FacultyTreeView books={filteredBooks} />
      ) : (
        <DataTable
          data={filteredBooks}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun ouvrage ne correspond à votre filtre."
          pageSize={10}
        />
      )}
    </div>
  );
}
