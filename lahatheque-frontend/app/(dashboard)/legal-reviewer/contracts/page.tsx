"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  PlusCircle,
  ArrowLeft,
  FileText,
  Edit2,
  Trash2,
  Download,
  RotateCw,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContractSearchBar } from "@/components/features/legal/contract-search-bar";
import { EditContractModal } from "@/components/features/legal/edit-contract-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { getLegalContracts, deleteLegalContract } from "@/lib/services/legal";
import type { LegalContract } from "@/lib/types/legal";
import { toast } from "sonner";

export default function LegalContractsListPage() {
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modales CRUD
  const [contractToEdit, setContractToEdit] = useState<LegalContract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<LegalContract | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLegalContracts({
        search: searchQuery.trim() || undefined,
        partyType: partyTypeFilter !== "all" ? partyTypeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setContracts(data);
    } catch (err) {
      console.error("Erreur chargement contrats:", err);
      toast.error("Impossible de charger les contrats.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, partyTypeFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContracts();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchContracts]);

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;
    try {
      setDeleting(true);
      const ok = await deleteLegalContract(contractToDelete.id);
      if (ok) {
        toast.success(`Le contrat ${contractToDelete.reference} a été supprimé avec succès.`);
        setContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
        setContractToDelete(null);
        fetchContracts();
      } else {
        toast.error("Erreur lors de la suppression du contrat.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression.");
    } finally {
      setDeleting(false);
    }
  };

  const columns: DataTableColumn<LegalContract>[] = [
    {
      key: "reference",
      header: "Référence & Intitulé",
      cell: (row) => (
        <Link
          href={`/legal-reviewer/contracts/${row.id}`}
          className="text-left hover:text-navy transition-colors group block space-y-0.5"
        >
          <p className="font-mono font-bold text-[11px] text-gold">{row.reference}</p>
          <p className="font-bold text-xs text-navy group-hover:text-gold transition-colors truncate max-w-[280px]">
            {row.title}
          </p>
          {row.ouvrage_title && (
            <span className="inline-flex items-center gap-1 text-[10px] text-foreground-muted bg-background-secondary px-2 py-0.5 rounded border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              Livre : {row.ouvrage_title}
            </span>
          )}
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
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Consulter */}
          <Link
            href={`/legal-reviewer/contracts/${row.id}`}
            title="Consulter le contrat et le PDF"
            className="p-2 rounded-xl bg-navy hover:bg-navy-dark text-gold font-bold text-xs transition-colors border border-gold/30 shadow-xs cursor-pointer inline-flex items-center gap-1 min-h-[38px] px-2.5"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span className="hidden sm:inline">Consulter</span>
          </Link>

          {/* Modifier */}
          <button
            type="button"
            title="Modifier les métadonnées du contrat"
            onClick={() => setContractToEdit(row)}
            className="p-2 rounded-xl bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors border border-border cursor-pointer inline-flex items-center justify-center min-h-[38px] min-w-[38px]"
          >
            <Edit2 className="w-3.5 h-3.5 text-navy" />
          </button>

          {/* Télécharger */}
          {row.file_url && (
            <a
              href={row.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              title="Télécharger le document signé"
              className="p-2 rounded-xl bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors border border-border cursor-pointer inline-flex items-center justify-center min-h-[38px] min-w-[38px]"
            >
              <Download className="w-3.5 h-3.5 text-navy" />
            </a>
          )}

          {/* Supprimer / Archiver */}
          <button
            type="button"
            title="Archiver ce contrat"
            onClick={() => setContractToDelete(row)}
            className="p-2 rounded-xl bg-background hover:bg-destructive/10 text-destructive font-bold text-xs transition-colors border border-border hover:border-destructive/30 cursor-pointer inline-flex items-center justify-center min-h-[38px] min-w-[38px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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
            Moteur de recherche documentaire full-text et gestion complète (CRUD) des contrats signés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchContracts}
            disabled={loading}
            className="p-2.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy font-bold text-xs transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer shadow-2xs"
            title="Actualiser les contrats"
          >
            <RotateCw className={`w-4 h-4 text-navy ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/legal-reviewer/contracts/new"
            className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-gold border border-gold/30 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            Nouveau Contrat
          </Link>
        </div>
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

      {/* Table des contrats */}
      <DataTable
        data={contracts}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={false}
        emptyMessage="Aucun contrat ne correspond à votre recherche."
        pageSize={10}
      />

      {/* Modale d'Édition CRUD */}
      {contractToEdit && (
        <EditContractModal
          contract={contractToEdit}
          isOpen={!!contractToEdit}
          onClose={() => setContractToEdit(null)}
          onSuccess={fetchContracts}
        />
      )}

      {/* Modale de Confirmation de Suppression/Archivage */}
      {contractToDelete && (
        <ConfirmationModal
          isOpen={!!contractToDelete}
          onClose={() => setContractToDelete(null)}
          onConfirm={handleDeleteConfirm}
          loading={deleting}
          title="Archiver le contrat"
          description={`Êtes-vous sûr de vouloir archiver le contrat « ${contractToDelete.reference} — ${contractToDelete.title} » ? Son statut passera à archivé.`}
          confirmLabel="Archiver le contrat"
          isDestructive={true}
        />
      )}
    </div>
  );
}

