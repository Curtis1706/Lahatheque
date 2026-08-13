"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FileBarChart, ArrowLeft, Eye, Download, Headphones, DollarSign, GraduationCap, Percent } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getUniversityBooks } from "@/lib/services/librarian";
import type { UniversityBook } from "@/lib/types/librarian";

export default function UniversityStatsPage() {
  const [books, setBooks] = useState<UniversityBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sales" | "usage">("sales");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalConsultations = books.reduce((acc, b) => acc + b.consultations_count, 0);
  const totalDownloads = books.reduce((acc, b) => acc + b.downloads_count, 0);
  const totalAudio = books.reduce((acc, b) => acc + b.audio_listens_count, 0);
  const totalRevenue = books.reduce((acc, b) => acc + b.revenue_generated, 0);
  const totalRoyalty15 = books.reduce((acc, b) => acc + b.royalty_15_percent, 0);

  const salesColumns: DataTableColumn<UniversityBook>[] = [
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
      key: "revenue_generated",
      header: "Revenus Ventes",
      cell: (row) => (
        <span className="font-mono font-bold text-navy text-xs">
          {row.revenue_generated.toLocaleString("fr-FR")} XOF
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

  const usageColumns: DataTableColumn<UniversityBook>[] = [
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
      header: "Lectures en Ligne",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.consultations_count.toLocaleString("fr-FR")} vues
        </span>
      ),
    },
    {
      key: "downloads_count",
      header: "Téléchargements (EPUB/PDF)",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.downloads_count.toLocaleString("fr-FR")} fois
        </span>
      ),
    },
    {
      key: "audio_listens_count",
      header: "Écoutes Audio",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.audio_listens_count > 0 ? `${row.audio_listens_count.toLocaleString("fr-FR")} écoutes` : "N/A"}
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
        <span className="text-navy font-semibold">Statistiques &amp; Usage</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/librarian" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <FileBarChart className="w-4 h-4 text-gold" />
            Reporting d&apos;Utilisation Institutionnel (Section 12)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Statistiques Ventes &amp; Consultations
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Analyse détaillée des ventes par faculté/discipline et des usages (EPUB/PDF, audios, lectures en ligne).
          </p>
        </div>
      </div>

      {/* Synthèse par format d'usage */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Consultations Web</span>
          <p className="font-serif font-bold text-xl text-navy font-mono">{totalConsultations.toLocaleString("fr-FR")}</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Téléchargements PDF/EPUB</span>
          <p className="font-serif font-bold text-xl text-navy font-mono">{totalDownloads.toLocaleString("fr-FR")}</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Écoutes Audio</span>
          <p className="font-serif font-bold text-xl text-navy font-mono">{totalAudio.toLocaleString("fr-FR")}</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Redevance 15% Dues</span>
          <p className="font-serif font-bold text-xl text-gold font-mono">{totalRoyalty15.toLocaleString("fr-FR")} XOF</p>
        </div>
      </div>

      {/* Onglets Ventes vs Usage */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("sales")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === "sales"
              ? "bg-navy text-white"
              : "bg-background-secondary text-foreground-muted hover:text-navy"
          }`}
        >
          Ventes par Faculté &amp; Discipline
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("usage")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "usage"
              ? "bg-navy text-white"
              : "bg-background-secondary text-foreground-muted hover:text-navy"
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-gold" />
          Utilisation &amp; Consultations (EPUB/Audio)
        </button>
      </div>

      {/* Table correspondante */}
      <DataTable
        data={books}
        columns={activeTab === "sales" ? salesColumns : usageColumns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune donnée statistique disponible."
        pageSize={10}
      />
    </div>
  );
}
