"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ArrowLeft, Building2, Edit2, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getUniversityRoyalties,
  getThirdPartyPublisherRoyalties,
  updateThirdPartyPublisherRate,
} from "@/lib/services/legal";
import type { UniversityRoyalty, ThirdPartyPublisherRoyalty } from "@/lib/types/legal";

export default function LegalRedevancesPage() {
  const [univRoyalties, setUnivRoyalties] = useState<UniversityRoyalty[]>([]);
  const [pubRoyalties, setPubRoyalties] = useState<ThirdPartyPublisherRoyalty[]>([]);
  const [loading, setLoading] = useState(true);

  // Modification du taux éditeur tiers
  const [selectedPub, setSelectedPub] = useState<ThirdPartyPublisherRoyalty | null>(null);
  const [newRate, setNewRate] = useState(20);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [uData, pData] = await Promise.all([
        getUniversityRoyalties(),
        getThirdPartyPublisherRoyalties(),
      ]);
      setUnivRoyalties(uData);
      setPubRoyalties(pData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpdatePubRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPub) return;

    setUpdating(true);
    try {
      const success = await updateThirdPartyPublisherRate(selectedPub.publisher_id, newRate);
      if (success) {
        setPubRoyalties((prev) =>
          prev.map((p) =>
            p.publisher_id === selectedPub.publisher_id
              ? { ...p, contractual_rate: newRate, amount_due: (p.total_sales * newRate) / 100 }
              : p
          )
        );
        toast.success(`Le taux contractuel de ${selectedPub.name} a été ajusté à ${newRate}% avec succès.`);
        setSelectedPub(null);
      } else {
        toast.error("Impossible de mettre à jour le taux éditeur.");
      }
    } catch {
      toast.error("Erreur de connexion lors de la mise à jour du taux.");
    } finally {
      setUpdating(false);
    }
  };

  const univColumns: DataTableColumn<UniversityRoyalty>[] = [
    {
      key: "name",
      header: "Université",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.name}</p>
          <p className="text-[10px] text-foreground-muted">Pays : {row.country}</p>
        </div>
      ),
    },
    {
      key: "fixed_rate_percentage",
      header: "Taux Fixe Institutionnel (Section 10.2)",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-bold text-navy text-xs px-2.5 py-1 rounded-xl bg-navy-light border border-navy/20">
            {row.fixed_rate_percentage}%
          </span>
          <span className="text-[10px] text-foreground-muted flex items-center gap-0.5" title="Fixé par le cahier des charges v3.2 (Non modifiable)">
            <Lock className="w-3 h-3 text-foreground-muted" />
            Taux Fixe
          </span>
        </div>
      ),
    },
    {
      key: "total_sales_generated",
      header: "Ventes Générées",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.total_sales_generated.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "amount_due",
      header: "Redevance Due (15%)",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.amount_due.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
  ];

  const pubColumns: DataTableColumn<ThirdPartyPublisherRoyalty>[] = [
    {
      key: "name",
      header: "Éditeur Tiers",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.name}</p>
          <p className="text-[10px] text-foreground-muted font-mono">Ref: {row.contract_reference || "N/A"}</p>
        </div>
      ),
    },
    {
      key: "contractual_rate",
      header: "Taux Contractuel Négocié",
      cell: (row) => (
        <span className="font-mono font-bold text-navy text-xs px-2.5 py-1 rounded-xl bg-gold/15 border border-gold/30">
          {row.contractual_rate}%
        </span>
      ),
    },
    {
      key: "amount_due",
      header: "Redevance Calculée",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.amount_due.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "actions" as keyof ThirdPartyPublisherRoyalty,
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={() => {
            setSelectedPub(row);
            setNewRate(row.contractual_rate);
          }}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
        >
          <Edit2 className="w-3.5 h-3.5 text-gold" />
          Modifier le taux
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Redevances</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/legal-reviewer" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Suivi des Redevances Contractuelles
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances Universités &amp; Éditeurs Tiers
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Sections 10.2 &amp; 10.3 du Cahier des charges — 15% fixe institutionnel pour les universités et taux contractuels négociés pour les éditeurs tiers.
          </p>
        </div>
      </div>

      {/* Section 1: Universités (15% Fixe) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold" />
            1. Redevances Universités (Taux fixe 15%)
          </h2>
          <span className="text-[10px] font-bold text-success flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Conforme Cahier v3.2
          </span>
        </div>

        <DataTable
          data={univRoyalties}
          columns={univColumns}
          rowKey="university_id"
          loading={loading}
          emptyMessage="Aucune redevance universitaire trouvée."
        />
      </div>

      {/* Section 2: Éditeurs Tiers (Taux modifiable) */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-base flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            2. Redevances Éditeurs Tiers (Taux Négocié)
          </h2>
          <span className="text-[10px] font-mono text-foreground-muted">
            Le Juriste peut ajuster directement le taux contractuel
          </span>
        </div>

        <DataTable
          data={pubRoyalties}
          columns={pubColumns}
          rowKey="publisher_id"
          loading={loading}
          emptyMessage="Aucun éditeur tiers partenaire enregistré."
        />
      </div>

      {/* Modale de modification du taux Éditeur Tiers */}
      {selectedPub && (
        <Modal
          open={!!selectedPub}
          onClose={() => setSelectedPub(null)}
          title={`Modifier le taux contractuel — ${selectedPub.name}`}
          description="Ajustez le pourcentage de redevance négocié dans le contrat de partenariat."
        >
          <form onSubmit={handleUpdatePubRate} className="space-y-4 pt-2">
            <div>
              <label htmlFor="pub-rate" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Nouveau Taux Contractuel (%) *
              </label>
              <div className="relative">
                <input
                  id="pub-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={newRate}
                  onChange={(e) => setNewRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy pr-8 min-h-[44px]"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gold">%</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPub(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={updating}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs"
              >
                {updating ? (
                  <InlineLoader size={16} />
                ) : (
                  "Enregistrer le nouveau taux"
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
