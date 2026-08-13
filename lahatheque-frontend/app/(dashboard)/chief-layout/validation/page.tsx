"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { CheckSquare, Search, Filter, ArrowLeft, User } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { getPendingDeposits } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

export default function ChefValidationPage() {
  const [deposits, setDeposits] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPendingDeposits();
      setDeposits(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((dep) => {
      if (disciplineFilter !== "all" && dep.classification.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = dep.metadata.title.toLowerCase().includes(q);
        const matchMaquettiste = dep.maquettiste_name.toLowerCase().includes(q);
        if (!matchTitle && !matchMaquettiste) return false;
      }
      return true;
    });
  }, [deposits, searchQuery, disciplineFilter]);

  const columns: DataTableColumn<LayoutDeposit>[] = [
    {
      key: "metadata.title",
      header: "Ouvrage",
      cell: (row) => (
        <Link href={`/chief-layout/validation/${row.id}`} className="hover:text-navy transition-colors">
          <p className="font-bold text-xs text-navy truncate max-w-[220px]">{row.metadata.title}</p>
          <p className="text-[10px] text-foreground-muted">{row.metadata.authors.join(", ")}</p>
        </Link>
      ),
    },
    {
      key: "maquettiste_name",
      header: "Maquettiste",
      cell: (row) => (
        <span className="text-xs text-foreground font-semibold flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gold" />
          {row.maquettiste_name}
        </span>
      ),
    },
    {
      key: "classification.discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground font-medium">{row.classification.discipline}</span>
      ),
    },
    {
      key: "submitted_at",
      header: "Soumis le",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.submitted_at
            ? new Date(row.submitted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof LayoutDeposit,
      header: "",
      cell: (row) => (
        <Link
          href={`/chief-layout/validation/${row.id}`}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
        >
          <CheckSquare className="w-3.5 h-3.5 text-gold" />
          Examiner &amp; Valider
        </Link>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Dépôts à Valider</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/chief-layout" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <CheckSquare className="w-4 h-4 text-gold" />
          Chef Maquettiste
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Dépôts en Attente de Validation
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Examinez les dépôts soumis par les maquettistes. La validation déclenche la mise en ligne automatique sur la vitrine publique.
        </p>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-background border border-border p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre ou nom de maquettiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>

        {/* Filtre par discipline */}
        <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" />
            Discipline :
          </span>
          {[
            { id: "all", label: "Toutes les disciplines" },
            { id: "Droit & Sciences Politiques", label: "Droit" },
            { id: "Médecine & Santé", label: "Médecine" },
            { id: "Économie & Gestion", label: "Économie" },
            { id: "Sciences Humaines", label: "Sciences Humaines" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setDisciplineFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                disciplineFilter === d.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredDeposits}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun dépôt en attente de validation."
        onRowClick={(row) => { window.location.href = `/chief-layout/validation/${row.id}`; }}
        pageSize={10}
      />
    </div>
  );
}
