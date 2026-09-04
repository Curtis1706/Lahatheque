"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  BookOpen,
  Edit3,
  Save,
  ArrowRight,
  Sliders,
  ShieldCheck,
  CreditCard,
  History,
  X,
  Download,
  FileText,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import {
  getAdminRoyalties,
  getGlobalPricingConfig,
  updateGlobalPricingConfig,
  getPartnerRoyaltyConfigs,
  updatePartnerRoyaltyRate,
  processRoyaltyPayout,
} from "@/lib/services/admin";
import {
  AdminRoyalty,
  GlobalPricingConfig,
  PartnerRoyaltyConfig,
} from "@/lib/types/admin";
import { toast } from "sonner";
import { generateOfficialPdf, generateCsvExport } from "@/lib/services/export-service";

export default function AdminRoyaltiesManagementPage() {
  const [royalties, setRoyalties] = useState<AdminRoyalty[]>([]);
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

  // Modale de traitement de reversement
  const [payoutToProcess, setPayoutToProcess] = useState<AdminRoyalty | null>(null);
  const [payoutAction, setPayoutAction] = useState<"approve" | "reject">("approve");
  const [txRef, setTxRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [royaltiesData, configData, partnersData] = await Promise.all([
        getAdminRoyalties(),
        getGlobalPricingConfig(),
        getPartnerRoyaltyConfigs(),
      ]);
      setRoyalties(royaltiesData);
      setGlobalConfig(configData);
      setPartnerConfigs(partnersData);

      if (configData) {
        setAuthorRate(configData.default_author_royalty_rate || 70.0);
        setPublisherRate(configData.default_publisher_royalty_rate || 22.0);
        setUniversityRate(configData.default_university_royalty_rate || 15.0);
        setPlatformShare(configData.default_platform_share_rate || 8.0);
      }
    } catch (err) {
      toast.error("Erreur de chargement des données de redevances.");
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

  const handleOpenProcessPayout = (item: AdminRoyalty, action: "approve" | "reject") => {
    setPayoutToProcess(item);
    setPayoutAction(action);
    setTxRef(action === "approve" ? `VIR-PAYOUT-${Date.now().toString().slice(-6)}` : "");
    setAdminNotes(action === "reject" ? "Coordonnées incomplètes ou justificatifs manquants." : "Versement approuvé.");
  };

  const handleSubmitProcessPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutToProcess) return;
    setProcessingPayout(true);
    try {
      const res = await processRoyaltyPayout(payoutToProcess.id, payoutAction, {
        transaction_reference: txRef,
        admin_notes: adminNotes,
      });
      if (res.success) {
        toast.success(res.message || "Traitement du versement validé.");
        setRoyalties((prev) =>
          prev.map((r) =>
            r.id === payoutToProcess.id
              ? {
                  ...r,
                  status: payoutAction === "approve" ? "settled" : "on_hold",
                  transaction_reference: txRef,
                }
              : r
          )
        );
        setPayoutToProcess(null);
      } else {
        toast.error(res.error || "Erreur de traitement.");
      }
    } catch {
      toast.error("Erreur serveur lors du traitement.");
    } finally {
      setProcessingPayout(false);
    }
  };

  const pendingPayouts = royalties.filter((r) => r.status === "pending" || r.status === "approved");

  const royaltyColumns: DataTableColumn<AdminRoyalty>[] = [
    {
      key: "beneficiary_name",
      header: "Bénéficiaire",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.beneficiary_name}</p>
          <p className="text-[11px] text-foreground-muted capitalize">
            {row.beneficiary_type === "author"
              ? "Auteur Partenaire"
              : row.beneficiary_type === "publisher"
              ? "Maison d'Édition"
              : "Université Partenaire"}
          </p>
        </div>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage / Motif",
      cell: (row) => (
        <span className="text-xs text-foreground font-medium truncate max-w-[200px] block">
          {row.book_title || "Ventes globales & lectures"}
        </span>
      ),
    },
    {
      key: "total_revenue",
      header: "Assiette Brute",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground">
          {row.total_revenue.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "payout_amount",
      header: "Montant Net Dû",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.payout_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={async () => {
              try {
                await generateOfficialPdf({
                  docType: "BORDEREAU_REDEVANCES",
                  docNumber: `REL-ADMIN-${row.id.slice(0, 8).toUpperCase()}`,
                  date: new Date().toLocaleDateString("fr-FR"),
                  period: row.period_month || "Trimestre en cours",
                  recipient: {
                    name: row.beneficiary_name,
                    roleOrTitle: `Bénéficiaire : ${row.beneficiary_type === "author" ? "Auteur" : row.beneficiary_type === "publisher" ? "Maison d'Édition" : "Université"}`,
                    emailOrPhone: row.beneficiary_email || "contact@lahatheque.bj",
                    addressOrCampus: row.account_details || "Compte Partenaire Enregistré",
                  },
                  summaryCards: [
                    { label: "Bénéficiaire", value: row.beneficiary_name },
                    { label: "Assiette Brute", value: `${row.total_revenue.toLocaleString("fr-FR")} XOF` },
                    { label: "Montant Net Dû", value: `${row.payout_amount.toLocaleString("fr-FR")} XOF` },
                    { label: "Statut", value: row.status.toUpperCase() },
                  ],
                  tableHeaders: ["Bénéficiaire", "Type", "Ouvrage / Période", "Assiette Brute", "Montant Net Dû", "Statut"],
                  tableRows: [
                    [
                      row.beneficiary_name,
                      row.beneficiary_type,
                      row.book_title || row.period_month || "Ventes plateforme",
                      `${row.total_revenue.toLocaleString("fr-FR")} XOF`,
                      `${row.payout_amount.toLocaleString("fr-FR")} XOF`,
                      row.status,
                    ],
                  ],
                  totalAmount: `${row.payout_amount.toLocaleString("fr-FR")} XOF`,
                  totalNotes: "Bordereau de redevances certifié par la Direction Financière LAHAThèque Éditions & Numérique S.A.",
                  filename: `bordereau_admin_${row.id.slice(0, 8)}.pdf`,
                });
                toast.success("Bordereau PDF officiel généré avec succès !");
              } catch {
                toast.error("Erreur lors de la génération du bordereau PDF.");
              }
            }}
            className="p-1.5 rounded-lg bg-background-secondary border border-border hover:border-gold text-navy transition-colors cursor-pointer"
            title="Télécharger le bordereau certifié PDF"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
          </button>

          {row.status !== "settled" ? (
            <>
              <button
                onClick={() => handleOpenProcessPayout(row, "approve")}
                className="px-2.5 py-1 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1 cursor-pointer"
                title="Valider le versement"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Valider
              </button>
              <button
                onClick={() => handleOpenProcessPayout(row, "reject")}
                className="px-2.5 py-1 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors cursor-pointer"
                title="Rejeter"
              >
                Rejeter
              </button>
            </>
          ) : (
            <span className="text-[11px] font-mono text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Réglé
            </span>
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-semibold mb-2">
            <DollarSign className="w-3.5 h-3.5 text-gold" />
            Supervision & Répartition Financière
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion Globale des Redevances & Droits
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Paramétrer les barèmes de répartition des royalties, ajuster les taux partenaires et valider les versements.
          </p>
        </div>

        {/* Accès direct aux sous-espaces et export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (royalties.length === 0) {
                toast.info("Aucune redevance à exporter.");
                return;
              }
              generateCsvExport(
                royalties.map((r) => ({
                  ID: r.id,
                  Beneficiaire: r.beneficiary_name,
                  Type: r.beneficiary_type,
                  Email: r.beneficiary_email || "",
                  Ouvrage_Motif: r.book_title || "Ventes globales",
                  Periode: r.period_month || "Trimestre",
                  Assiette_Brute_XOF: r.total_revenue,
                  Montant_Net_Du_XOF: r.payout_amount,
                  Statut: r.status,
                  Moyen_Paiement: r.payment_method || "Virement",
                  Coordonnees_Bancaires: r.account_details || "",
                })),
                `journal_redevances_admin_${new Date().toISOString().slice(0, 10)}`
              );
              toast.success("Journal des redevances exporté avec succès (format UTF-8 BOM pour Excel) !");
            }}
            className="px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            Exporter le Journal
          </button>
          <Link
            href="/admin/royalties/authors"
            className="px-3 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-navy" />
            Auteurs ({royalties.filter((r) => r.beneficiary_type === "author").length})
          </Link>
          <Link
            href="/admin/royalties/publishers"
            className="px-3 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            Éditeurs ({royalties.filter((r) => r.beneficiary_type === "publisher").length})
          </Link>
          <Link
            href="/admin/royalties/universities"
            className="px-3 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Building2 className="w-3.5 h-3.5 text-navy" />
            Universités ({royalties.filter((r) => r.beneficiary_type === "university").length})
          </Link>
        </div>
      </div>

      {/* 1. Barèmes Généraux de Répartition (Modifiables par l'Admin) */}
      <form
        onSubmit={handleSaveGlobalRates}
        className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold" />
              Barèmes Globaux de Répartition des Revenus
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Ces pourcentages s'appliquent automatiquement par défaut sur toutes les ventes unitaires et flux de lecture.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingGlobal}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-gold" />
            {savingGlobal ? "Enregistrement..." : "Enregistrer les Barèmes"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Part Auteurs */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Taux Auteurs Partenaires</span>
              <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-md bg-navy-light">
                {authorRate}%
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">Part par défaut sur les droits d'auteur</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={authorRate}
                onChange={(e) => setAuthorRate(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg bg-background-secondary border border-border font-mono font-bold text-foreground focus:border-gold focus:outline-none"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>

          {/* Part Éditeurs Tiers */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Taux Éditeurs Tiers</span>
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
                className="w-full p-2 text-xs rounded-lg bg-background-secondary border border-border font-mono font-bold text-foreground focus:border-gold focus:outline-none"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>

          {/* Part Universités Partenaires */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Taux Universités (B2B)</span>
              <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-md bg-navy-light">
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
                className="w-full p-2 text-xs rounded-lg bg-background-secondary border border-border font-mono font-bold text-foreground focus:border-gold focus:outline-none"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>

          {/* Part Plateforme LAHA */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Commission Plateforme</span>
              <span className="text-xs font-mono font-bold text-navy-dark px-2 py-0.5 rounded-md bg-navy/10">
                {platformShare}%
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">Frais d'hébergement DRM & services</p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={platformShare}
                onChange={(e) => setPlatformShare(Number(e.target.value))}
                className="w-full p-2 text-xs rounded-lg bg-background-secondary border border-border font-mono font-bold text-foreground focus:border-gold focus:outline-none"
              />
              <span className="text-xs font-bold text-foreground-muted">%</span>
            </div>
          </div>
        </div>
      </form>

      {/* 2. Tableau des Taux Spécifiques Négociés par Partenaire */}
      <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Percent className="w-4 h-4 text-gold" />
              Taux Contractuels Dérogatoires par Partenaire
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Modifier individuellement les pourcentages accordés aux éditeurs, auteurs majeurs ou universités.
            </p>
          </div>
        </div>

        {partnerConfigs.length === 0 ? (
          <div className="p-6 rounded-xl bg-background border border-border text-center text-xs text-foreground-muted">
            Aucun barème contractuel dérogatoire actif enregistré pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {partnerConfigs.map((p) => (
              <div
                key={p.partner_id}
                className="p-4 rounded-xl bg-background border border-border hover:border-gold/60 transition-all flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate">{p.partner_name}</span>
                    <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-full bg-navy-light">
                      {p.custom_royalty_rate}%
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted font-mono">Contrat: {p.contract_reference}</p>
                  <p className="text-[11px] text-foreground-muted">
                    Canal: {p.payment_method_preferred === "bank" ? "Virement Bancaire" : "Mobile Money"} ({p.account_identifier})
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-foreground-muted">MAJ: {p.last_updated}</span>
                  <button
                    onClick={() => handleOpenEditPartner(p)}
                    className="px-3 py-1.5 rounded-lg bg-navy-light text-navy font-semibold text-xs hover:bg-navy hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-gold" />
                    Modifier Taux
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Demandes de Versement en Attente & Règlements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Demandes de Versement & Relevés de Redevances ({royalties.length})
          </h2>
          <span className="text-xs text-foreground-muted font-medium">
            {pendingPayouts.length} en attente de validation
          </span>
        </div>

        <DataTable
          data={royalties}
          columns={royaltyColumns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucune ligne de redevance enregistrée."
        />
      </div>

      {/* Modale d'Édition du Taux Partenaire */}
      {editingPartner && (
        <Modal
          open={!!editingPartner}
          onClose={() => setEditingPartner(null)}
          title={`Modifier le taux pour ${editingPartner.partner_name}`}
        >
          <form onSubmit={handleSavePartnerRate} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-background-secondary border border-border text-xs text-foreground-muted space-y-1">
              <p><strong className="text-foreground">Référence Mandat :</strong> {editingPartner.contract_reference}</p>
              <p><strong className="text-foreground">Canal de Règlement :</strong> {editingPartner.account_identifier}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
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
                  className="w-full p-2.5 text-sm font-mono font-bold rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
                  required
                />
                <span className="text-sm font-bold text-foreground-muted">%</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary text-foreground"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingPartner}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-gold" />
                {savingPartner ? "Enregistrement..." : "Confirmer le Nouveau Taux"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale de Traitement de Demande de Versement */}
      {payoutToProcess && (
        <Modal
          open={!!payoutToProcess}
          onClose={() => setPayoutToProcess(null)}
          title={
            payoutAction === "approve"
              ? `Valider le versement de ${payoutToProcess.payout_amount.toLocaleString("fr-FR")} XOF`
              : `Rejeter la demande de ${payoutToProcess.beneficiary_name}`
          }
        >
          <form onSubmit={handleSubmitProcessPayout} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1 text-xs">
              <p><strong className="text-foreground">Bénéficiaire :</strong> {payoutToProcess.beneficiary_name}</p>
              <p><strong className="text-foreground">Coordonnées :</strong> {payoutToProcess.account_details || "N/A"}</p>
              <p><strong className="text-foreground">Montant Net :</strong> {payoutToProcess.payout_amount.toLocaleString("fr-FR")} XOF</p>
            </div>

            {payoutAction === "approve" ? (
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Référence de Transaction Bancaire / Mobile Money
                </label>
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  placeholder="Ex: VIR-BOA-2026-9912 ou TX-MOMO-7781"
                  className="w-full mt-1.5 p-2.5 text-xs font-mono rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="text-xs font-semibold text-foreground">
                Note Administrative & Motif
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setPayoutToProcess(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary text-foreground"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={processingPayout}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                  payoutAction === "approve" ? "bg-navy hover:bg-navy-hover" : "bg-error hover:bg-error-hover"
                }`}
              >
                {payoutAction === "approve" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    {processingPayout ? "Validation..." : "Valider le Virement"}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    {processingPayout ? "Rejet..." : "Confirmer le Rejet"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
