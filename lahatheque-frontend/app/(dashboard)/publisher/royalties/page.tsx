"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Send,
  Calendar,
  RotateCcw,
  Search,
  Info,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getPublisherRoyaltyPayments,
  getPublisherKpis,
  requestRoyaltyPayout,
} from "@/lib/services/publisher";
import type { PublisherRoyaltyPayment, PublisherKpis } from "@/lib/types/publisher";
import { generateOfficialPdf } from "@/lib/services/export-service";

type QuarterFilter = "all" | 1 | 2 | 3 | 4;

export default function PublisherRoyaltiesPage() {
  const [payments, setPayments] = useState<PublisherRoyaltyPayment[]>([]);
  const [kpis, setKpis] = useState<PublisherKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Filtres périodiques
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilter>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pData, kData] = await Promise.all([
          getPublisherRoyaltyPayments(),
          getPublisherKpis(),
        ]);
        setPayments(pData);
        setKpis(kData);
      } catch {
        toast.error("Erreur lors du chargement des redevances.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Années disponibles calculées dynamiquement et évolutives (basées sur la date actuelle et les données réelles)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>([currentYear, currentYear - 1]);
    payments.forEach((p) => {
      if (p.year) yearsSet.add(p.year);
      if (p.payment_date) {
        const y = new Date(p.payment_date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
      if (p.start_date) {
        const y = new Date(p.start_date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [payments]);

  // Filtrage périodique dynamique sur n'importe quel intervalle sélectionné
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // 1. Recherche textuelle
      const matchesSearch =
        searchQuery === "" ||
        p.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Filtre par Trimestre (T1, T2, T3, T4)
      const matchesQuarter =
        selectedQuarter === "all" || p.quarter === selectedQuarter;

      // 3. Filtre par Année (évolutif et dynamique)
      const matchesYear =
        selectedYear === "all" ||
        (p.year !== undefined && String(p.year) === selectedYear) ||
        (p.payment_date && String(new Date(p.payment_date).getFullYear()) === selectedYear) ||
        (p.start_date && String(new Date(p.start_date).getFullYear()) === selectedYear);

      // 4. Filtre par intervalle de dates personnalisé libre
      let matchesCustomRange = true;
      if (startDate && p.end_date) {
        matchesCustomRange = matchesCustomRange && p.end_date >= startDate;
      }
      if (endDate && p.start_date) {
        matchesCustomRange = matchesCustomRange && p.start_date <= endDate;
      }

      return matchesSearch && matchesQuarter && matchesYear && matchesCustomRange;
    });
  }, [payments, searchQuery, selectedQuarter, selectedYear, startDate, endDate]);

  // Totaux recalculés dynamiquement sur la période filtrée
  const periodTotals = useMemo(() => {
    const totalPaid = filteredPayments
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + (p.net_royalty_amount || p.amount), 0);

    const totalProcessing = filteredPayments
      .filter((p) => p.status === "processing" || p.status === "pending")
      .reduce((acc, p) => acc + (p.net_royalty_amount || p.amount), 0);

    const totalSales = filteredPayments.reduce(
      (acc, p) => acc + (p.total_sales_amount || (p.net_royalty_amount || p.amount) * 4.5),
      0
    );

    const totalNetRoyalties = filteredPayments.reduce(
      (acc, p) => acc + (p.net_royalty_amount || p.amount),
      0
    );

    return { totalPaid, totalProcessing, totalSales, totalNetRoyalties };
  }, [filteredPayments]);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedQuarter !== "all" ||
    selectedYear !== "all" ||
    startDate !== "" ||
    endDate !== "";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedQuarter("all");
    setSelectedYear("all");
    setStartDate("");
    setEndDate("");
  };

  const handleRequestPayout = async () => {
    const amount = kpis?.pendingRoyalties || 0;
    if (amount < 50000) {
      toast.info("Le montant minimum pour une demande de virement est de 50 000 XOF.");
      return;
    }

    setRequestingPayout(true);
    try {
      await requestRoyaltyPayout(amount);
      toast.success(`Demande de virement de ${amount.toLocaleString("fr-FR")} XOF transmise à la comptabilité.`);
      const updatedPayments = await getPublisherRoyaltyPayments();
      setPayments(updatedPayments);
    } catch {
      toast.error("Échec de la demande de virement.");
    } finally {
      setRequestingPayout(false);
    }
  };

  // Export PDF d'un bordereau trimestriel spécifique
  const handleExportStatementPdf = async (row: PublisherRoyaltyPayment) => {
    try {
      const amount = row.net_royalty_amount || row.amount;
      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `REL-EDIT-${row.reference || row.id.slice(0, 8).toUpperCase()}`,
        date: row.payment_date || row.paid_at || new Date().toLocaleDateString("fr-FR"),
        period: row.period,
        recipient: {
          name: "Maison d'Édition Tiers Partenaire",
          roleOrTitle: "Éditeur Distributeur Agréé LAHAThèque",
          addressOrCampus: "Siège Social Éditeur",
          emailOrPhone: "editeur@lahatheque.bj",
        },
        summaryCards: [
          { label: "Période Décomptée", value: row.period },
          { label: "Volume Ventes", value: `${(row.total_sales_amount || amount * 4.5).toLocaleString("fr-FR")} ${row.currency}` },
          { label: "Quote-part Éditeur", value: `${row.royalty_rate || kpis?.contractualRoyaltyRate || 22} % (Contrat)` },
          { label: "Statut Règlement", value: row.status === "paid" ? "Règlement Effectué" : "En Traitement" },
        ],
        tableHeaders: ["Période", "Volume Catalogue (HT)", "Taux de Reversement", "Montant Net Dû", "Statut"],
        tableRows: [
          [
            row.period,
            `${(row.total_sales_amount || amount * 4.5).toLocaleString("fr-FR")} ${row.currency}`,
            `${row.royalty_rate || kpis?.contractualRoyaltyRate || 22}%`,
            `${amount.toLocaleString("fr-FR")} ${row.currency}`,
            row.status === "paid" ? "Versé" : "En traitement",
          ],
        ],
        totalAmount: `${amount.toLocaleString("fr-FR")} ${row.currency}`,
        totalNotes:
          "Bordereau officiel certifié par LAHAThèque Éditions & Numérique S.A. Règlement exécuté conformément aux conditions contractuelles éditeur.",
        filename: `bordereau_redevances_editeur_${row.period.replace(/\s+/g, "_")}.pdf`,
      });
      toast.success("Bordereau de redevances PDF officiel téléchargé !");
    } catch {
      toast.error("Erreur lors de la génération du bordereau.");
    }
  };

  // Export PDF récapitulatif pour la période personnalisée sélectionnée
  const handleExportFilteredRangePdf = async () => {
    try {
      const rangeLabel =
        startDate && endDate
          ? `Du ${startDate} au ${endDate}`
          : selectedQuarter !== "all"
          ? `Trimestre T${selectedQuarter} - Année ${selectedYear === "all" ? "Globale" : selectedYear}`
          : selectedYear !== "all"
          ? `Exercice Annuel ${selectedYear}`
          : "Période Globale";

      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `RECAP-PERIODE-EDIT-${new Date().getFullYear()}`,
        date: new Date().toLocaleDateString("fr-FR"),
        period: rangeLabel,
        recipient: {
          name: "Maison d'Édition Tiers Partenaire",
          roleOrTitle: "Éditeur Distributeur Agréé LAHAThèque",
          addressOrCampus: "Siège Social Éditeur",
          emailOrPhone: "editeur@lahatheque.bj",
        },
        summaryCards: [
          { label: "Intervalle Filtré", value: rangeLabel },
          { label: "Bordereaux Inclus", value: `${filteredPayments.length} règlement(s)` },
          { label: "Chiffre d'Affaires Période", value: `${periodTotals.totalSales.toLocaleString("fr-FR")} XOF` },
          { label: "Total Redevances Nettes", value: `${periodTotals.totalNetRoyalties.toLocaleString("fr-FR")} XOF` },
        ],
        tableHeaders: [
          "Réf / Période",
          "Date Règlement",
          "Mode de Paiement",
          "Montant Net Dû",
          "Statut",
        ],
        tableRows: filteredPayments.map((p) => [
          p.period,
          p.payment_date || p.paid_at ? new Date(p.payment_date || p.paid_at!).toLocaleDateString("fr-FR") : "En attente",
          p.payment_method || "Virement Bancaire",
          `${(p.net_royalty_amount || p.amount).toLocaleString("fr-FR")} ${p.currency}`,
          p.status === "paid" ? "Versé" : "En cours",
        ]),
        totalAmount: `${periodTotals.totalNetRoyalties.toLocaleString("fr-FR")} XOF`,
        totalNotes:
          "Relevé récapitulatif périodique consolidé certifié par LAHAThèque Éditions & Numérique S.A. Document comptable justificatif délivré sur requête de l'éditeur partenaire.",
        filename: `releve_periodique_redevances_editeur_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      toast.success("Relevé périodique consolidé téléchargé avec succès !");
    } catch {
      toast.error("Erreur lors de la génération du relevé récapitulatif.");
    }
  };

  const columns: DataTableColumn<PublisherRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Période & Intitulé",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <p className="text-[10px] text-foreground-muted font-mono">
            Réf : {row.reference || row.id}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Net",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {(row.net_royalty_amount || row.amount).toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "payment_date",
      header: "Date de Règlement",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.payment_date || row.paid_at
            ? new Date(row.payment_date || row.paid_at!).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "En attente"}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Mode de Règlement",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs font-semibold text-navy">
          {row.payment_method || "Virement Bancaire (IBAN)"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
            row.status === "paid"
              ? "bg-success/10 text-success border border-success/30"
              : "bg-warning/10 text-warning border border-warning/30"
          }`}
        >
          {row.status === "paid" ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Règlement Effectué
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" /> En Traitement
            </>
          )}
        </span>
      ),
    },
    {
      key: "actions" as keyof PublisherRoyaltyPayment,
      header: "Bordereau",
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleExportStatementPdf(row)}
          className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer min-h-[36px]"
          title="Télécharger le bordereau certifié PDF"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Redevances &amp; Règlements</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/publisher"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Revenus &amp; Redevances (Section 5 &amp; 10.3)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances Dues &amp; Règlements
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Suivi automatique du chiffre d&apos;affaires généré, liquidation par trimestre et filtrage d&apos;historique par période.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestPayout}
          disabled={requestingPayout || (kpis?.pendingRoyalties ?? 0) < 50000}
          className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-xs min-h-[44px] shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {requestingPayout ? (
            <>
              <InlineLoader size={16} />
              <span>Demande en cours...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Demander un Virement</span>
            </>
          )}
        </button>
      </div>

      {/* Carte Contrat de Partenariat & Taux Convenu */}
      <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Convention de Mandat Partenaire Officiel
          </div>
          <h3 className="font-serif font-bold text-lg text-white">
            Éditeur Partenaire Certifié • Réf: {kpis?.contractReference || "CTR-PUB-2025-08"}
          </h3>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Le calcul des redevances s&apos;effectue en temps réel sur les ventes unitaires et les quotes-parts d&apos;abonnements.
          </p>
        </div>

        <div className="bg-navy-dark p-4 rounded-2xl border border-gold/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-white/60 font-bold uppercase block">Taux Contractuel Convenu</span>
            <span className="font-bold text-gold text-2xl font-mono">{kpis?.contractualRoyaltyRate ?? 22}%</span>
            <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-gold" /> (Lecture seule — Stipulé au contrat)
            </span>
          </div>
        </div>
      </div>

      {/* Pédagogie : Régime de Liquidation Trimestrielle des Éditeurs */}
      <div className="p-4 sm:p-5 rounded-3xl bg-navy-light border border-navy-hover/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <Info className="w-4 h-4 text-gold" />
            <span>Calendrier Officiel de Liquidation des Trimestres Calendaires</span>
          </div>
          <span className="text-[11px] text-foreground-muted">
            Règlement programmé le 10 du mois suivant chaque trimestre
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T1</span>
              <span className="text-[10px] font-mono text-gold font-bold">Janv • Févr • Mars</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/01 au 31/03 • Virement le 10 Avril</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T2</span>
              <span className="text-[10px] font-mono text-gold font-bold">Avr • Mai • Juin</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/04 au 30/06 • Virement le 10 Juillet</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T3</span>
              <span className="text-[10px] font-mono text-gold font-bold">Juil • Août • Sept</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/07 au 30/09 • Virement le 10 Octobre</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T4</span>
              <span className="text-[10px] font-mono text-gold font-bold">Oct • Nov • Déc</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/10 au 31/12 • Virement le 10 Janvier</p>
          </div>
        </div>
      </div>

      {/* Cartes de Synthèse Financière Dynamique (recalculées sur les filtres) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Chiffre d&apos;Affaires {hasActiveFilters ? "(Période)" : "Généré"}
            </span>
            <div className="p-2 rounded-xl bg-info/10 text-info">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">
            {hasActiveFilters
              ? `${periodTotals.totalSales.toLocaleString("fr-FR")} XOF`
              : `${(kpis?.totalRevenue ?? 0).toLocaleString("fr-FR")} XOF`}
          </p>
          <p className="text-[11px] text-foreground-muted">
            {hasActiveFilters
              ? `Ventes cumulées sur ${filteredPayments.length} bordereau(x)`
              : "Cumul des ventes de votre catalogue sur la plateforme"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Solde en Traitement
            </span>
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">
            {hasActiveFilters
              ? `${periodTotals.totalProcessing.toLocaleString("fr-FR")} XOF`
              : `${(kpis?.pendingRoyalties ?? 0).toLocaleString("fr-FR")} XOF`}
          </p>
          <p className="text-[11px] text-foreground-muted">
            {hasActiveFilters
              ? `En cours de validation sur la sélection`
              : "Montant éligible au virement (Seuil minimum : 50 000 XOF)"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Total Règlements Versés
            </span>
            <div className="p-2 rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-gold font-mono">
            {periodTotals.totalPaid.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            {hasActiveFilters
              ? `Versements exécutés sur la période filtrée`
              : "Versements exécutés avec succès sur votre compte"}
          </p>
        </div>
      </div>

      {/* ─── HISTORIQUE PAR PÉRIODE & FILTRAGE AVANCÉ ──── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-navy text-lg">
              Historique des Règlements par Période ({filteredPayments.length})
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Filtrez vos bordereaux par trimestre ou sélectionnez librement n&apos;importe quel intervalle de temps.
            </p>
          </div>

          {filteredPayments.length > 0 && (
            <button
              type="button"
              onClick={handleExportFilteredRangePdf}
              className="px-4 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs min-h-[40px] shrink-0"
              title="Télécharger le relevé consolidé de la période filtrée"
            >
              <Download className="w-4 h-4 text-gold" />
              <span>Exporter la Période (PDF)</span>
            </button>
          )}
        </div>

        {/* Barre d'Outils de Filtrage Périodique Avancé */}
        <div className="p-4 sm:p-5 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Recherche textuelle */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par période, référence, intitulé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            {/* Sélecteur d'année */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground-muted font-semibold whitespace-nowrap">Année :</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 text-xs bg-background border border-border rounded-xl text-navy font-bold focus:outline-none focus:border-gold cursor-pointer min-h-[40px]"
              >
                <option value="all">Toutes les années</option>
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year} {year === new Date().getFullYear() ? "(En cours)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 2 : Filtre par Trimestre (T1, T2, T3, T4) & Intervalle Personnalisé Libre */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-border">
            {/* Boutons Rapides par Trimestre */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-foreground-muted font-semibold mr-1">Trimestre :</span>
              {[
                { key: "all" as QuarterFilter, label: "Tous" },
                { key: 1 as QuarterFilter, label: "T1 (Janv - Mars)" },
                { key: 2 as QuarterFilter, label: "T2 (Avr - Juin)" },
                { key: 3 as QuarterFilter, label: "T3 (Juil - Sept)" },
                { key: 4 as QuarterFilter, label: "T4 (Oct - Déc)" },
              ].map((item) => (
                <button
                  key={String(item.key)}
                  type="button"
                  onClick={() => setSelectedQuarter(item.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[36px] ${
                    selectedQuarter === item.key
                      ? "bg-navy text-white shadow-xs"
                      : "bg-background border border-border text-foreground-muted hover:text-navy"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Intervalle de Dates Personnalisé Libre */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1 min-h-[40px]">
                <Calendar className="w-3.5 h-3.5 text-gold" />
                <span className="text-[11px] text-foreground-muted">Du</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs bg-transparent text-navy font-mono font-bold focus:outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-2.5 py-1 min-h-[40px]">
                <span className="text-[11px] text-foreground-muted">Au</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs bg-transparent text-navy font-mono font-bold focus:outline-none cursor-pointer"
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 rounded-xl bg-background border border-border text-foreground-muted hover:text-navy transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Bandeau d'état récapitulatif de la sélection filtrée */}
          {hasActiveFilters && (
            <div className="p-3 rounded-2xl bg-navy-light border border-navy-hover/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-navy font-medium">
                Intervalle actif :{" "}
                <strong className="text-navy">
                  {startDate ? `du ${startDate}` : "début"} {endDate ? `au ${endDate}` : ""}
                  {selectedQuarter !== "all" && ` • Trimestre T${selectedQuarter}`}
                  {selectedYear !== "all" && ` • Année ${selectedYear}`}
                </strong>{" "}
                • <span className="font-bold">{filteredPayments.length}</span> bordereau(x) décompté(s) •{" "}
                Total net dû :{" "}
                <strong className="text-gold font-mono">
                  {periodTotals.totalNetRoyalties.toLocaleString("fr-FR")} XOF
                </strong>
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] text-navy font-bold hover:underline self-start sm:self-auto cursor-pointer"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </div>

        {/* Tableau des règlements */}
        <DataTable
          data={filteredPayments}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun règlement ou bordereau trouvé pour cette période."
        />
      </div>
    </div>
  );
}
