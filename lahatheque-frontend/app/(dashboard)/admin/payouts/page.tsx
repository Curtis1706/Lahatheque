"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminPayouts, getAdminPayoutKpis } from "@/lib/services/admin";
import {
  AdminPayoutRequest,
  AdminPayoutKpis,
  AdminPayoutsListResponse,
} from "@/lib/types/admin";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Download,
  Check,
  X,
  CreditCard,
  FileText,
  Building2,
  GraduationCap,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { generateCsvExport } from "@/lib/services/export-service";
import { PayoutValidationModal } from "@/components/features/admin/payout-validation-modal";
import { PayoutRejectionModal } from "@/components/features/admin/payout-rejection-modal";

export default function AdminPayoutsPage() {
  const [payoutsResponse, setPayoutsResponse] = useState<AdminPayoutsListResponse | null>(null);
  const [kpis, setKpis] = useState<AdminPayoutKpis | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Modales d'actions
  const [selectedPayoutForValidation, setSelectedPayoutForValidation] = useState<AdminPayoutRequest | null>(null);
  const [selectedPayoutForRejection, setSelectedPayoutForRejection] = useState<AdminPayoutRequest | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [payoutsRes, kpisRes] = await Promise.all([
        getAdminPayouts({
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          q: searchQuery || undefined,
          all: true,
        }),
        getAdminPayoutKpis().catch(() => null),
      ]);
      setPayoutsResponse(payoutsRes);
      if (kpisRes) setKpis(kpisRes);
    } catch {
      toast.error("Erreur lors de la récupération des demandes de versement.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCsv = () => {
    const list = payoutsResponse?.results || [];
    if (list.length === 0) {
      toast.info("Aucun versement à exporter.");
      return;
    }

    const filename = `demandes_versement_lahatheque_${new Date().toISOString().slice(0, 10)}`;
    generateCsvExport(
      list.map((p) => ({
        ID_Demande: p.id,
        Beneficiaire: p.beneficiary_name,
        Type: p.beneficiary_type,
        Email: p.beneficiary_email,
        Objet: p.purpose_label,
        Base_Brute_FCFA: p.gross_base_amount,
        Taux_Effectif_Pourcent: p.effective_rate_percent,
        Montant_Net_FCFA: p.net_payout_amount,
        Moyen_Paiement: p.payment_method,
        Coordonnees: p.payment_details_preview,
        Statut: p.status,
        Reference_Transaction: p.transaction_reference || "",
        Date_Versement: p.payout_date || "",
        Motif_Rejet: p.rejection_reason || "",
        Date_Demande: p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "",
      })),
      filename
    );
    toast.success("Demandes de versement exportées avec succès !");
  };

  // Colonnes DataTable
  const columns: DataTableColumn<AdminPayoutRequest>[] = [
    {
      key: "beneficiary_name",
      header: "Bénéficiaire",
      cell: (row) => {
        const isAuthor = row.beneficiary_type === "author";
        const isUniv = row.beneficiary_type === "university";
        return (
          <div className="font-poppins">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-foreground">
                {row.beneficiary_name}
              </span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/5 text-navy border border-navy/10">
                {isAuthor ? (
                  <Users className="w-2.5 h-2.5 text-navy" />
                ) : isUniv ? (
                  <GraduationCap className="w-2.5 h-2.5 text-gold" />
                ) : (
                  <Building2 className="w-2.5 h-2.5 text-navy" />
                )}
                {isAuthor ? "Auteur" : isUniv ? "Université" : "Éditeur"}
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted font-mono line-clamp-1">
              {row.beneficiary_email || "N/A"}
            </p>
          </div>
        );
      },
    },
    {
      key: "purpose_label",
      header: "Motif & Base",
      cell: (row) => (
        <div className="font-poppins">
          <p className="text-xs font-medium text-foreground line-clamp-1">
            {row.purpose_label}
          </p>
          <p className="text-[11px] text-foreground-muted">
            Base : <span className="font-mono">{row.gross_base_amount.toLocaleString("fr-FR")} FCFA</span> • Taux :{" "}
            <span className="font-semibold text-navy">{row.effective_rate_percent}%</span>
          </p>
        </div>
      ),
    },
    {
      key: "net_payout_amount",
      header: "Montant Net",
      cell: (row) => (
        <div className="font-mono">
          <span className="font-bold text-navy text-sm">
            {row.net_payout_amount.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      ),
    },
    {
      key: "payment_details_preview",
      header: "Coordonnées de Virement",
      cell: (row) => (
        <div className="text-xs font-poppins">
          <p className="font-mono text-foreground font-medium line-clamp-1">
            {row.payment_details_preview}
          </p>
          <span className="text-[11px] text-foreground-muted capitalize">
            {row.payment_method}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      header: "Date de Demande",
      cell: (row) => (
        <div className="text-xs font-poppins">
          <span className="text-foreground font-mono">
            {row.created_at ? new Date(row.created_at).toLocaleDateString("fr-FR") : "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => {
        if (row.status === "pending" || row.status === "approved") {
          return (
            <div className="flex items-center justify-end gap-1.5 font-poppins">
              <button
                type="button"
                onClick={() => setSelectedPayoutForValidation(row)}
                className="px-2.5 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-hover transition-colors flex items-center gap-1 cursor-pointer"
                title="Valider le versement"
              >
                <Check className="w-3.5 h-3.5 text-gold" />
                Valider
              </button>
              <button
                type="button"
                onClick={() => setSelectedPayoutForRejection(row)}
                className="px-2 py-1.5 rounded-lg border border-border hover:bg-background-secondary text-foreground text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Rejeter la demande"
              >
                <X className="w-3.5 h-3.5 text-foreground-muted" />
                Rejeter
              </button>
            </div>
          );
        }

        if (row.status === "processed") {
          return (
            <div className="text-right text-[11px] text-foreground-muted font-poppins">
              <span className="text-navy font-semibold font-mono block">
                Réf: {row.transaction_reference || "Confirmé"}
              </span>
              {row.receipt_file_url && (
                <a
                  href={row.receipt_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-gold hover:underline mt-0.5"
                >
                  <FileText className="w-3 h-3" />
                  Bordereau
                </a>
              )}
            </div>
          );
        }

        if (row.status === "rejected") {
          return (
            <div className="text-right text-[11px] text-foreground-muted font-poppins">
              <span className="text-foreground line-clamp-1" title={row.rejection_reason || "Refusé"}>
                Motif : {row.rejection_reason || "Non spécifié"}
              </span>
            </div>
          );
        }

        return null;
      },
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Demandes de Versement des Droits &amp; Redevances
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy/10 text-navy border border-navy/20 font-mono">
              {payoutsResponse?.results?.length ?? 0} demande{(payoutsResponse?.results?.length ?? 0) > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5 font-poppins">
            Instruction, validation avec enregistrement des références bancaires/Momo et traitement des décaissements.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer min-h-[44px] font-poppins"
        >
          <Download className="w-4 h-4 text-gold" />
          Exporter ({payoutsResponse?.count || 0})
        </button>
      </div>

      {/* Cartes KPI décisionnelles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-poppins">
        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">
              Total en attente
            </span>
            <span className="p-2 rounded-xl bg-gold/10 text-gold">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-navy">
            {(kpis?.total_pending_amount ?? 0).toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-[11px] text-foreground-muted">
            {kpis?.pending_count ?? 0} demande(s) nécessitant votre instruction
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">
              Demandes en attente
            </span>
            <span className="p-2 rounded-xl bg-navy/10 text-navy">
              <AlertCircle className="w-4 h-4 text-gold" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {kpis?.pending_count ?? 0}
          </p>
          <p className="text-[11px] text-foreground-muted">
            Délai moyen de traitement : ~{kpis?.average_processing_time_hours ?? 24}h
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">
              Versé ce mois
            </span>
            <span className="p-2 rounded-xl bg-navy/10 text-navy">
              <CheckCircle2 className="w-4 h-4 text-gold" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-navy">
            {(kpis?.total_settled_this_month ?? 0).toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-[11px] text-foreground-muted">
            {kpis?.settled_this_month_count ?? 0} versement(s) réglé(s) avec succès
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-background p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">
              Ayants-droit concernés
            </span>
            <span className="p-2 rounded-xl bg-navy/5 text-navy">
              <Users className="w-4 h-4 text-navy" />
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-mono text-foreground">
            {kpis?.distinct_beneficiaries_count ?? 0}
          </p>
          <p className="text-[11px] text-foreground-muted">
            Auteurs, éditeurs et universités partenaires
          </p>
        </div>
      </div>

      {/* Barre de filtrage */}
      <div className="space-y-3 font-poppins">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Statuts */}
          <div className="inline-flex p-1 rounded-xl bg-background-secondary border border-border text-xs">
            {[
              { id: "all", label: "Toutes les demandes" },
              { id: "pending", label: "En attente" },
              { id: "processed", label: "Virées / Traitées" },
              { id: "rejected", label: "Rejetées" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? "bg-navy text-white shadow-xs"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Types de partenaires */}
          <div className="inline-flex p-1 rounded-xl bg-background-secondary border border-border text-xs">
            {[
              { id: "all", label: "Tous les rôles" },
              { id: "author", label: "Auteurs" },
              { id: "publisher", label: "Éditeurs" },
              { id: "university", label: "Universités" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTypeFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  typeFilter === tab.id
                    ? "bg-navy text-white shadow-xs"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={payoutsResponse?.results || []}
          columns={columns}
          rowKey="id"
          loading={loading}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          searchPlaceholder="Rechercher par ayant-droit, email, motif..."
          emptyMessage="Aucune demande de versement ne correspond à ces critères."
        />
      </div>

      {/* Modale de validation */}
      {selectedPayoutForValidation && (
        <PayoutValidationModal
          payout={selectedPayoutForValidation}
          isOpen={true}
          onClose={() => setSelectedPayoutForValidation(null)}
          onSuccess={loadData}
        />
      )}

      {/* Modale de rejet */}
      {selectedPayoutForRejection && (
        <PayoutRejectionModal
          payout={selectedPayoutForRejection}
          isOpen={true}
          onClose={() => setSelectedPayoutForRejection(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
