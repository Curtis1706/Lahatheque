"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Percent,
  CheckCircle2,
  Building2,
  Users,
  Edit3,
  Save,
  Sliders,
  CreditCard,
  Download,
  Library,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import {
  getGlobalPricingConfig,
  updateGlobalPricingConfig,
  getPartnerRoyaltyConfigs,
  updatePartnerRoyaltyRate,
} from "@/lib/services/admin";
import {
  GlobalPricingConfig,
  PartnerRoyaltyConfig,
} from "@/lib/types/admin";
import { toast } from "sonner";
import { generateCsvExport } from "@/lib/services/export-service";

export default function AdminRoyaltiesManagementPage() {
  const [globalConfig, setGlobalConfig] = useState<GlobalPricingConfig | null>(null);
  const [partnerConfigs, setPartnerConfigs] = useState<PartnerRoyaltyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Édition des taux par défaut
  const [authorRate, setAuthorRate] = useState(70.0);
  const [publisherRate, setPublisherRate] = useState(22.0);
  const [universityRate, setUniversityRate] = useState(15.0);
  const [platformShare, setPlatformShare] = useState(8.0);

  // Modale d'édition d'un barème spécifique partenaire
  const [editingPartner, setEditingPartner] = useState<PartnerRoyaltyConfig | null>(null);
  const [newCustomRate, setNewCustomRate] = useState<number>(22.0);
  const [savingPartner, setSavingPartner] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, partnersData] = await Promise.all([
        getGlobalPricingConfig(),
        getPartnerRoyaltyConfigs(),
      ]);
      setGlobalConfig(configData);
      setPartnerConfigs(partnersData);

      if (configData) {
        setAuthorRate(configData.default_author_royalty_rate || 70.0);
        setPublisherRate(configData.default_publisher_royalty_rate || 22.0);
        setUniversityRate(configData.default_university_royalty_rate || 15.0);
        setPlatformShare(configData.default_platform_share_rate || 8.0);
      }
    } catch {
      toast.error("Erreur de chargement des barèmes de redevances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGlobalRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      const res = await updateGlobalPricingConfig({
        default_author_royalty_rate: authorRate,
        default_publisher_royalty_rate: publisherRate,
        default_university_royalty_rate: universityRate,
        default_platform_share_rate: platformShare,
      });
      if (res.success) {
        toast.success(res.message || "Barèmes généraux de répartition enregistrés avec succès.");
      } else {
        toast.error(res.error || "Erreur lors de la sauvegarde.");
      }
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleOpenEditPartner = (partner: PartnerRoyaltyConfig) => {
    setEditingPartner(partner);
    setNewCustomRate(partner.custom_royalty_rate);
  };

  const handleSavePartnerRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    setSavingPartner(true);
    try {
      const res = await updatePartnerRoyaltyRate(editingPartner.partner_id, newCustomRate);
      if (res.success) {
        toast.success(`Taux de ${editingPartner.partner_name} modifié à ${newCustomRate}%.`);
        setPartnerConfigs((prev) =>
          prev.map((p) =>
            p.partner_id === editingPartner.partner_id
              ? { ...p, custom_royalty_rate: newCustomRate }
              : p
          )
        );
        setEditingPartner(null);
      } else {
        toast.error(res.error || "Erreur de mise à jour du taux.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSavingPartner(false);
    }
  };

  const handleExportPartnerRates = () => {
    if (partnerConfigs.length === 0) {
      toast.info("Aucun barème partenaire à exporter.");
      return;
    }
    generateCsvExport(
      partnerConfigs.map((p) => ({
        ID_Partenaire: p.partner_id,
        Nom_Partenaire: p.partner_name,
        Type: p.partner_type,
        Contrat_Reference: p.contract_reference,
        Taux_Contractuel_Pourcent: p.custom_royalty_rate,
        Mode_Paiement: p.payment_method_preferred,
        Coordonnees: p.account_identifier,
        Derniere_MAJ: p.last_updated,
      })),
      `baremes_redevances_partenaires_${new Date().toISOString().slice(0, 10)}`
    );
    toast.success("Barèmes partenaires exportés avec succès !");
  };

  // Colonnes DataTable pour les Taux Contractuels Dérogatoires par Partenaire
  const partnerColumns: DataTableColumn<PartnerRoyaltyConfig>[] = [
    {
      key: "partner_name",
      header: "Partenaire & Raison Sociale",
      className: "min-w-[220px]",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-foreground">{row.partner_name}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                row.partner_type === "publisher"
                  ? "bg-gold/15 text-gold"
                  : row.partner_type === "university"
                  ? "bg-navy/10 text-navy"
                  : "bg-background-secondary text-foreground-muted border border-border"
              }`}
            >
              {row.partner_type === "publisher"
                ? "Maison d'édition"
                : row.partner_type === "university"
                ? "Université"
                : "Auteur"}
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted font-mono">{row.contract_reference}</p>
        </div>
      ),
    },
    {
      key: "custom_royalty_rate",
      header: "Taux Contractuel",
      className: "min-w-[130px] whitespace-nowrap",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs sm:text-sm font-bold text-navy px-2.5 py-0.5 rounded-lg bg-navy/5 border border-navy/10">
            {row.custom_royalty_rate}%
          </span>
          <span className="text-[10px] text-foreground-muted font-medium">HT</span>
        </div>
      ),
    },
    {
      key: "account_identifier",
      header: "Canal & Coordonnées",
      className: "min-w-[200px]",
      hideOnMobile: true,
      cell: (row) => (
        <div className="text-xs text-foreground-muted space-y-0.5">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <CreditCard className="w-3.5 h-3.5 text-gold" />
            <span>{row.payment_method_preferred === "bank" ? "Virement Bancaire" : "Mobile Money"}</span>
          </div>
          <p className="text-[11px] text-foreground-muted truncate max-w-[240px]">
            {row.account_identifier || "Compte conventionné"}
          </p>
        </div>
      ),
    },
    {
      key: "last_updated",
      header: "Dernière MAJ",
      className: "min-w-[120px] whitespace-nowrap",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.last_updated || "2026-01-01"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right min-w-[130px]",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => handleOpenEditPartner(row)}
            className="px-3 py-1.5 rounded-xl bg-navy/5 text-navy font-semibold text-xs hover:bg-navy hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[34px]"
          >
            <Edit3 className="w-3.5 h-3.5 text-gold" />
            <span>Modifier Taux</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 font-poppins animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-semibold mb-2">
            <DollarSign className="w-3.5 h-3.5 text-gold" />
            Supervision & Répartition Financière
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-navy">
            Gestion Globale des Redevances & Droits
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Paramétrer les barèmes de répartition des royalties et ajuster les taux contractuels dérogatoires par partenaire.
          </p>
        </div>

        {/* Action Export */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportPartnerRates}
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-navy hover:border-gold/40 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            <span>Exporter Barèmes</span>
          </button>
        </div>
      </div>

      {/* 1. Barèmes Généraux de Répartition (Modifiables par l'Admin) */}
      <form
        onSubmit={handleSaveGlobalRates}
        className="p-5 sm:p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-navy font-serif flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold" />
              Barèmes Globaux de Répartition des Revenus
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Ces pourcentages s&apos;appliquent automatiquement par défaut sur toutes les ventes unitaires et flux de lecture.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingGlobal}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50 min-h-[40px]"
          >
            <Save className="w-3.5 h-3.5 text-gold" />
            {savingGlobal ? "Enregistrement..." : "Enregistrer les Barèmes"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Part Auteurs */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">Taux Auteurs Partenaires</span>
              <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-md bg-navy/10">
                {authorRate}%
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">Part par défaut sur les droits d&apos;auteur</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={authorRate}
                onChange={(e) => setAuthorRate(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg bg-background border border-border font-mono font-bold text-navy focus:border-gold focus:outline-none min-h-[38px]"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>

          {/* Part Éditeurs Tiers */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">Taux Éditeurs Tiers</span>
              <span className="text-xs font-mono font-bold text-gold px-2 py-0.5 rounded-md bg-gold/15">
                {publisherRate}%
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">Taux contractuel moyen sur les dépôts</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={publisherRate}
                onChange={(e) => setPublisherRate(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg bg-background border border-border font-mono font-bold text-navy focus:border-gold focus:outline-none min-h-[38px]"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>

          {/* Part Universités Partenaires */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">Taux Universités (B2B)</span>
              <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-md bg-navy/10">
                {universityRate}%
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">Reversement légal institutionnel</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={universityRate}
                onChange={(e) => setUniversityRate(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg bg-background border border-border font-mono font-bold text-navy focus:border-gold focus:outline-none min-h-[38px]"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>

          {/* Part Plateforme LAHA */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-navy">Commission Plateforme</span>
              <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-md bg-navy/10">
                {platformShare}%
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">Frais d&apos;hébergement DRM & services</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={platformShare}
                onChange={(e) => setPlatformShare(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg bg-background border border-border font-mono font-bold text-navy focus:border-gold focus:outline-none min-h-[38px]"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>
        </div>
      </form>

      {/* 2. Tableau des Taux Spécifiques Négociés par Partenaire (DataTable) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-navy font-serif flex items-center gap-2">
              <Percent className="w-4 h-4 text-gold" />
              Taux Contractuels Dérogatoires par Partenaire
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Modifier individuellement les pourcentages accordés aux maisons d&apos;édition, auteurs majeurs ou universités.
            </p>
          </div>
          <span className="text-xs text-foreground-muted font-medium">
            {partnerConfigs.length} partenaire(s) conventionné(s)
          </span>
        </div>

        <DataTable
          data={partnerConfigs}
          columns={partnerColumns}
          rowKey="partner_id"
          loading={loading}
          searchPlaceholder="Rechercher un partenaire, un contrat..."
          filterKey="partner_type"
          filterPlaceholder="Filtrer par type de partenaire"
          filterOptions={[
            { value: "publisher", label: "Maisons d'édition" },
            { value: "university", label: "Universités" },
            { value: "author", label: "Auteurs majeurs" },
          ]}
          emptyMessage="Aucun barème contractuel dérogatoire actif enregistré pour le moment."
        />
      </div>

      {/* Modale d'Édition du Taux Partenaire */}
      {editingPartner && (
        <Modal
          open={!!editingPartner}
          onClose={() => setEditingPartner(null)}
          title={`Modifier le taux pour ${editingPartner.partner_name}`}
        >
          <form onSubmit={handleSavePartnerRate} className="space-y-4 pt-2 font-poppins">
            <div className="p-3 rounded-xl bg-background-secondary border border-border text-xs text-foreground-muted space-y-1">
              <p><strong className="text-navy">Référence Mandat :</strong> {editingPartner.contract_reference}</p>
              <p><strong className="text-navy">Canal de Règlement :</strong> {editingPartner.account_identifier}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-navy">
                Nouveau Taux de Redevance Contractuel (%)
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={newCustomRate}
                  onChange={(e) => setNewCustomRate(Number(e.target.value))}
                  className="w-full p-2.5 text-sm font-mono font-bold rounded-xl bg-background border border-border text-navy focus:border-gold focus:outline-none min-h-[44px]"
                  required
                />
                <span className="text-sm font-bold text-foreground-muted">%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary text-navy min-h-[40px]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingPartner}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm min-h-[40px]"
              >
                <CheckCircle2 className="w-4 h-4 text-gold" />
                {savingPartner ? "Enregistrement..." : "Confirmer le Nouveau Taux"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
