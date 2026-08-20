"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookOpen, Search, Filter, PlusCircle, ArrowLeft } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getMyDeposits } from "@/lib/services/layout-artist";
import type { LayoutDeposit, DepositFilterStatus } from "@/lib/types/layout-artist";

export default function MaquettisteDepositsPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as DepositFilterStatus) || "all";

  const [deposits, setDeposits] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DepositFilterStatus>(initialStatus);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getMyDeposits();
      setDeposits(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((dep) => {
      if (statusFilter !== "all" && dep.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = dep.metadata.title.toLowerCase().includes(q);
        const matchAuthor = dep.metadata.authors.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchAuthor) return false;
      }
      return true;
    });
  }, [deposits, searchQuery, statusFilter]);

  const columns: DataTableColumn<LayoutDeposit>[] = [
    {
      key: "metadata.title",
      header: "Ouvrage & Couverture",
      cell: (row) => (
        <Link href={`/layout-artist/deposits/${row.id}`} className="flex items-center gap-3 group py-1">
          <BookCover3D
            title={row.metadata.title}
            authors={row.metadata.authors}
            discipline={row.classification.discipline}
            coverUrl={row.files.cover_url}
            size="xs"
          />
          <div className="min-w-0">
            <p className="font-bold text-xs text-navy group-hover:text-gold transition-colors truncate max-w-[220px]">
              {row.metadata.title}
            </p>
            <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
              {row.metadata.authors.join(", ")} • {row.metadata.publication_year}
            </p>
          </div>
        </Link>
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
      key: "metadata.language",
      header: "Langue",
      hideOnMobile: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-foreground font-semibold">{row.metadata.language}</span>
          <AISuggestionBadge source={row.metadata.language_source} />
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Déposé le",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/layout-artist" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Espace Maquettiste
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Dépôts Personnels
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Historique complet des ouvrages que vous avez déposés pour création du catalogue.
          </p>
        </div>

        <Link
          href="/layout-artist/deposits/new"
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Nouveau Dépôt
        </Link>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-background border border-border p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre d'ouvrage ou auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>

        {/* Filtres par statut */}
        <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" />
            Statut :
          </span>
          {[
            { id: "all" as DepositFilterStatus, label: "Tous" },
            { id: "draft" as DepositFilterStatus, label: "Brouillons" },
            { id: "pending_validation" as DepositFilterStatus, label: "En attente" },
            { id: "revision_requested" as DepositFilterStatus, label: "Corrections demandées" },
            { id: "published" as DepositFilterStatus, label: "Publiés" },
          ].map((st) => (
            <button
              key={st.id}
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

      {/* Table des dépôts */}
      <DataTable
        data={filteredDeposits}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun dépôt ne correspond à vos critères."
        onRowClick={(row) => { window.location.href = `/layout-artist/deposits/${row.id}`; }}
        pageSize={10}
      />
    </div>
  );
}
