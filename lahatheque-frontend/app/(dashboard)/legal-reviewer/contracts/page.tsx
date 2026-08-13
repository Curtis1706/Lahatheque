"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ShieldCheck, PlusCircle, ArrowLeft, Download, FileText, ExternalLink } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContractSearchBar } from "@/components/features/legal/contract-search-bar";
import { getLegalContracts } from "@/lib/services/legal";
import type { LegalContract } from "@/lib/types/legal";

export default function LegalContractsListPage() {
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getLegalContracts();
      setContracts(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (partyTypeFilter !== "all" && c.party_type !== partyTypeFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchRef = c.reference.toLowerCase().includes(q);
        const matchParty = c.contracting_party.toLowerCase().includes(q);
        const matchTag = c.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchRef && !matchParty && !matchTag) return false;
      }
      return true;
    });
  }, [contracts, searchQuery, partyTypeFilter, statusFilter]);

  const columns: DataTableColumn<LegalContract>[] = [
    {
      key: "reference",
      header: "Référence & Intitulé",
      cell: (row) => (
        <Link
          href={`/legal-reviewer/contracts/${row.id}`}
          className="text-left hover:text-navy transition-colors group block"
        >
          <p className="font-mono font-bold text-[11px] text-gold">{row.reference}</p>
          <p className="font-bold text-xs text-navy group-hover:text-gold transition-colors truncate max-w-[280px]">
            {row.title}
          </p>
        </Link>
      ),
    },
    {
      key: "contracting_party",
      header: "Partie Contractante",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.contracting_party}</p>
          <span className="text-[10px] text-foreground-muted uppercase font-mono">
            {row.party_type === "author" ? "Auteur" : row.party_type === "university" ? "Université" : "Éditeur Tiers"}
          </span>
        </div>
      ),
    },
    {
      key: "signed_at",
      header: "Signé le",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {new Date(row.signed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof LegalContract,
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/legal-reviewer/contracts/${row.id}`}
            className="px-3.5 py-2 rounded-xl bg-navy hover:bg-navy-dark text-gold font-bold text-[11px] transition-colors whitespace-nowrap min-h-[38px] inline-flex items-center gap-1.5 border border-gold/30 shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            Consulter
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Contrats Légaux</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/legal-reviewer" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Base Documentaire Légale
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Contrats &amp; Conventions Stockés
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Moteur de recherche documentaire full-text et indexation des contrats d&apos;auteurs, universités et éditeurs tiers.
          </p>
        </div>

        <Link
          href="/legal-reviewer/contracts/new"
          className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-hover text-navy text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau Contrat
        </Link>
      </div>

      {/* Barre de Recherche avec filtres */}
      <ContractSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        partyTypeFilter={partyTypeFilter}
        onPartyTypeChange={setPartyTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Table des contrats avec liens directs vers la page dédiée */}
      <DataTable
        data={filteredContracts}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun contrat ne correspond à votre recherche."
        onRowClick={(row) => { window.location.href = `/legal-reviewer/contracts/${row.id}`; }}
        pageSize={10}
      />
    </div>
  );
}
