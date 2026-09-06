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
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContractSearchBar } from "@/components/features/legal/contract-search-bar";
import { EditContractModal } from "@/components/features/legal/edit-contract-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { getLegalContracts, deleteLegalContract, reindexLegalContract, reindexAllLegalContracts } from "@/lib/services/legal";
import type { LegalContract } from "@/lib/types/legal";
import { toast } from "sonner";

export default function LegalContractsListPage() {
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [indexingFilter, setIndexingFilter] = useState("all");

  // Modales CRUD & Reindex
  const [contractToEdit, setContractToEdit] = useState<LegalContract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<LegalContract | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reindexingId, setReindexingId] = useState<string | null>(null);
  const [reindexingAll, setReindexingAll] = useState(false);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    console.log("[Contrats Page] Rafraichissement de la liste...", {
      search: searchQuery.trim(),
      partyType: partyTypeFilter,
      status: statusFilter,
      indexingStatus: indexingFilter,
    });
    try {
      const data = await getLegalContracts({
        search: searchQuery.trim() || undefined,
        partyType: partyTypeFilter !== "all" ? partyTypeFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        indexingStatus: indexingFilter !== "all" ? indexingFilter : undefined,
      });
      console.log(`[Contrats Page] ${data.length} contrat(s) charge(s) dans le tableau.`);
      setContracts(data);
    } catch (err) {
      console.error("[Contrats Page ERREUR] Impossible de charger les contrats:", err);
      toast.error("Impossible de charger les contrats.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, partyTypeFilter, statusFilter, indexingFilter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleReindex = async (contractId: string) => {
    console.log(`[Contrats Page] Declenchement reindexation OCR pour contrat id='${contractId}'`);
    try {
      setReindexingId(contractId);
      const res = await reindexLegalContract(contractId);
      if (res.success) {
        console.log(`[Contrats Page SUCCES] Reindexation initiee pour '${contractId}':`, res.message);
        toast.success(res.message || "Analyse OCR et réindexation lancées en tâche de fond.");
        // Mise à jour optimiste du statut
        setContracts((prev) =>
          prev.map((c) =>
            c.id === contractId ? { ...c, indexing_status: "processing" } : c
          )
        );
      } else {
        console.warn(`[Contrats Page AVERTISSEMENT] Reindexation echouee pour '${contractId}':`, res.error);
        toast.error(res.error || "Échec de la réindexation.");
      }
    } catch (err: any) {
      console.error(`[Contrats Page ERREUR CRITIQUE] Exception reindexation '${contractId}':`, err);
      toast.error(err.message || "Erreur de réindexation.");
    } finally {
      setReindexingId(null);
    }
  };

  const handleReindexAll = async () => {
    console.log("[Contrats Page] Declenchement reindexation globale de masse...");
    try {
      setReindexingAll(true);
      const res = await reindexAllLegalContracts(false);
      if (res.success) {
        console.log("[Contrats Page SUCCES] Reindexation globale acceptee:", res);
        toast.success(res.message || "Réindexation globale lancée en tâche de fond.");
        fetchContracts();
      } else {
        console.warn("[Contrats Page AVERTISSEMENT] Reindexation globale rejetee:", res.error);
        toast.error(res.error || "Échec du lancement de la réindexation.");
      }
    } catch (err: any) {
      console.error("[Contrats Page ERREUR CRITIQUE] Exception reindexation globale:", err);
      toast.error(err.message || "Erreur réseau.");
    } finally {
      setReindexingAll(false);
    }
  };

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
        <div className="space-y-1.5 max-w-[380px]">
          <Link
            href={`/legal-reviewer/contracts/${row.id}`}
            className="text-left hover:text-navy transition-colors group block space-y-0.5"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono font-bold text-[11px] text-gold">{row.reference}</span>

              {/* Badges d'état d'indexation OCR */}
              {row.indexing_status === "processing" && (
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 font-medium animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin shrink-0" />
                  OCR en cours
                </span>
              )}

              {row.indexing_status === "failed" && (
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30 font-medium">
                  <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                  Échec OCR
                </span>
              )}

              {row.indexing_status === "indexed" && (
                <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-navy/5 text-foreground-muted border border-border font-medium">
                  <CheckCircle2 className="w-2.5 h-2.5 text-gold shrink-0" />
                  {row.ocr_engine_used === "tesseract_ocr"
                    ? "Indexé (OCR)"
                    : row.ocr_engine_used === "python_docx"
                    ? "Indexé (Word)"
                    : "Indexé (Natif)"}
                </span>
              )}
            </div>

            <p className="font-bold text-xs text-navy group-hover:text-gold transition-colors line-clamp-1">
              {row.title}
            </p>
          </Link>

          {/* Snippet contextuel en surbrillance (T011) */}
          {row.snippet_highlight && (
            <div className="p-2 rounded-xl bg-background-secondary border border-border text-[11px] text-foreground leading-relaxed font-sans shadow-2xs">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <FileText className="w-3 h-3 text-gold" />
                Clause détectée dans le document :
              </span>
              <div
                dangerouslySetInnerHTML={{ __html: row.snippet_highlight }}
                className="line-clamp-2 [&>strong]:text-gold [&>strong]:bg-gold/10 [&>strong]:px-1 [&>strong]:rounded"
              />
            </div>
          )}

          {row.ouvrage_title && (
            <span className="inline-flex items-center gap-1 text-[10px] text-foreground-muted bg-background-secondary px-2 py-0.5 rounded border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              Livre : {row.ouvrage_title}
            </span>
          )}
        </div>
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

          {/* Réindexer / OCR de secours */}
          <button
            type="button"
            title="Relancer l'extraction et l'indexation OCR"
            disabled={reindexingId === row.id || row.indexing_status === "processing"}
            onClick={() => handleReindex(row.id)}
            className="p-2 rounded-xl bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors border border-border cursor-pointer inline-flex items-center justify-center min-h-[38px] min-w-[38px] disabled:opacity-40"
          >
            <Cpu className={`w-3.5 h-3.5 ${reindexingId === row.id ? "animate-spin text-gold" : "text-navy"}`} />
          </button>

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
            Moteur de recherche documentaire full-text haute performance et reconnaissance optique (OCR).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReindexAll}
            disabled={reindexingAll || loading}
            className="p-2.5 px-3.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy font-bold text-xs transition-colors min-h-[44px] inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Lancer l'analyse OCR sur tous les contrats non indexés"
          >
            <Cpu className={`w-4 h-4 text-gold ${reindexingAll ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Réindexer l&apos;existant</span>
          </button>
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
        indexingFilter={indexingFilter}
        onIndexingFilterChange={setIndexingFilter}
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
