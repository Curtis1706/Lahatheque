"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminRoyalties } from "@/lib/services/admin";
import { AdminRoyalty } from "@/lib/types/admin";
import { DollarSign, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

export default function AdminRoyaltiesPage() {
  const [royalties, setRoyalties] = useState<AdminRoyalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoyalties() {
      try {
        setLoading(true);
        const data = await getAdminRoyalties();
        setRoyalties(data);
      } catch (err) {
        toast.error("Erreur de chargement des redevances.");
      } finally {
        setLoading(false);
      }
    }
    loadRoyalties();
  }, []);

  const handleSettle = (id: string) => {
    setRoyalties((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "settled" } : r))
    );
    toast.success("Paiement de la redevance validé et marqué comme réglé.");
  };

  const columns: DataTableColumn<AdminRoyalty>[] = [
    {
      key: "beneficiary_name",
      header: "Bénéficiaire",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.beneficiary_name}</p>
          <p className="text-[11px] text-foreground-muted capitalize">
            Type: {row.beneficiary_type === "author" ? "Auteur principal" : row.beneficiary_type === "publisher" ? "Éditeur tiers" : "Université partenaire"}
          </p>
        </div>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage / Source",
      cell: (row) => (
        <span className="text-xs text-foreground font-medium">
          {row.book_title || "Ventes globales éditeur"}
        </span>
      ),
    },
    {
      key: "total_reads",
      header: "Lectures Cumulées",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground font-semibold">
          {row.total_reads.toLocaleString("fr-FR")} accès
        </span>
      ),
    },
    {
      key: "payout_amount",
      header: "Redevance Due",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gold-dark">
          {row.payout_amount.toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut Règlement",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          {row.status !== "settled" ? (
            <button
              onClick={() => handleSettle(row.id)}
              className="px-3 py-1 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Régler
            </button>
          ) : (
            <span className="text-[11px] font-mono text-success font-medium">Réglé</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Calculs & Règlements des Redevances
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Ventilation automatique des droits d'auteur, parts éditeurs et reversements institutionnels.
          </p>
        </div>

        <button
          onClick={() => toast.info("Génération du rapport comptable mensuel...")}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Download className="w-4 h-4" />
          Rapport Comptable (PDF)
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={royalties}
        columns={columns}
        rowKey="id"
        loading={loading}
        filterKey="beneficiary_type"
        filterOptions={[
          { value: "all", label: "Tous les bénéficiaires" },
          { value: "author", label: "Auteurs" },
          { value: "publisher", label: "Éditeurs tiers" },
          { value: "university", label: "Universités" },
        ]}
        filterPlaceholder="Filtrer par type..."
        searchPlaceholder="Rechercher par bénéficiaire ou livre..."
      />
    </div>
  );
}
