"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  Clock,
  History,
  Search,
  Filter,
  Calendar,
  RotateCcw,
  BookOpen,
  Laptop,
  DollarSign,
  Info,
  ChevronRight,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthorPayoutModal } from "@/components/features/author/author-payout-modal";
import {
  getAuthorRoyaltyPayments,
  getPayoutRequests,
  type PayoutRequestItem,
} from "@/lib/services/author";
import type { AuthorRoyaltyPayment } from "@/lib/types/author";
import { toast } from "sonner";
import { generateOfficialPdf } from "@/lib/services/export-service";

type QuarterFilter = "all" | 1 | 2 | 3 | 4;

export default function AuthorRoyaltiesPage() {
  const [activeTab, setActiveTab] = useState<"statements" | "requests">("statements");
  const [allPayments, setAllPayments] = useState<AuthorRoyaltyPayment[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  // Filtres périodiques
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterFilter>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    const [stmts, reqs] = await Promise.all([
      getAuthorRoyaltyPayments(),
      getPayoutRequests(),
    ]);
    setAllPayments(stmts);
    setPayoutRequests(reqs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Années disponibles calculées dynamiquement et évolutives (basées sur la date actuelle et les relevés réels)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearsSet = new Set<number>([currentYear, currentYear - 1]);
    allPayments.forEach((p) => {
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
  }, [allPayments]);

  // Filtrage périodique dynamique (quel que soit l'intervalle sélectionné)
  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      // 1. Recherche texte
      const matchesSearch =
        searchQuery === "" ||
        p.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Filtre par Trimestre (T1, T2, T3, T4)
      const matchesQuarter =
        selectedQuarter === "all" || p.quarter === selectedQuarter;

      // 3. Filtre par Année (dynamique et évolutif)
      const matchesYear =
        selectedYear === "all" ||
        String(p.year) === selectedYear ||
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
  }, [allPayments, searchQuery, selectedQuarter, selectedYear, startDate, endDate]);

  // Totaux recalculés sur la sélection filtrée
  const periodTotals = useMemo(() => {
    const totalPaid = filteredPayments
      .filter((p) => p.status === "paid")
      .reduce((acc, p) => acc + p.author_earned_amount, 0);

    const totalPending = filteredPayments
      .filter((p) => p.status === "pending")
      .reduce((acc, p) => acc + p.author_earned_amount, 0);

    const totalSales = filteredPayments.reduce((acc, p) => acc + p.total_sales_count, 0);
    const totalGross = filteredPayments.reduce((acc, p) => acc + p.gross_revenue, 0);
    const totalEarned = filteredPayments.reduce((acc, p) => acc + p.author_earned_amount, 0);

    return { totalPaid, totalPending, totalSales, totalGross, totalEarned };
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

  // Export PDF d'un bordereau trimestriel spécifique
  const handleExportStatementPdf = async (row: AuthorRoyaltyPayment) => {
    try {
      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `REL-AUTEUR-${row.id.slice(0, 8).toUpperCase()}`,
        date: row.payment_date || new Date().toLocaleDateString("fr-FR"),
        period: row.period,
        recipient: {
          name: "Auteur / Créateur d'Ouvrage",
          roleOrTitle: "Titulaire de Droits d'Auteur LAHAThèque",
          addressOrCampus: "Compte Auteur Agréé",
          emailOrPhone: "auteur@lahatheque.bj",
        },
        summaryCards: [
          { label: "Trimestre / Période", value: row.period },
          { label: "Ventes Trimestrielles", value: `${row.total_sales_count.toLocaleString("fr-FR")} exemplaires` },
          { label: "Taux de Rétribution", value: `${row.author_percentage_rate} % (Droits)` },
          { label: "Statut Règlement", value: row.status === "paid" ? "Payé" : "En cours" },
        ],
        tableHeaders: [
          "Période Trimestrielle",
          "Volume Ventes",
          "Revenus Bruts (HT)",
          "Quote-part Auteur (15%)",
          "Statut",
        ],
        tableRows: [
          [
            row.period,
            `${row.total_sales_count.toLocaleString("fr-FR")} ex.`,
            `${row.gross_revenue.toLocaleString("fr-FR")} XOF`,
            `${row.author_earned_amount.toLocaleString("fr-FR")} XOF`,
            row.status === "paid" ? "Versé" : "En attente",
          ],
        ],
        totalAmount: `${row.author_earned_amount.toLocaleString("fr-FR")} XOF`,
        totalNotes:
          "Relevé trimestriel officiel de redevances certifié par LAHAThèque Éditions & Numérique S.A. Les droits sont liquidés au terme de chaque trimestre calendaire (T1: Janv-Mars, T2: Avr-Juin, T3: Juil-Sept, T4: Oct-Déc).",
        filename: `bordereau_redevances_auteur_${row.period.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      });
      toast.success("Bordereau trimestriel officiel téléchargé en PDF !");
    } catch {
      toast.error("Erreur lors de la génération du relevé PDF.");
    }
  };

  // Export PDF récapitulatif pour la période personnalisée sélectionnée
  const handleExportFilteredRangePdf = async () => {
    try {
      const rangeLabel =
        startDate && endDate
          ? `Du ${startDate} au ${endDate}`
          : selectedQuarter !== "all"
            ? `Trimestre ${selectedQuarter} ${selectedYear !== "all" ? selectedYear : ""}`
            : "Relevé Périodique Consolidé";

      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `REL-PERIODE-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString("fr-FR"),
        period: rangeLabel,
        recipient: {
          name: "Auteur / Créateur d'Ouvrage",
          roleOrTitle: "Bilan Périodique des Droits d'Auteur",
          addressOrCampus: "Compte Auteur Agréé",
          emailOrPhone: "auteur@lahatheque.bj",
        },
        summaryCards: [
          { label: "Période Décomptée", value: rangeLabel },
          { label: "Ventes Cumulées", value: `${periodTotals.totalSales.toLocaleString("fr-FR")} exemplaires` },
          { label: "Chiffre d'Affaires Brut", value: `${periodTotals.totalGross.toLocaleString("fr-FR")} XOF` },
          { label: "Redevance Nette Auteur", value: `${periodTotals.totalEarned.toLocaleString("fr-FR")} XOF` },
        ],
        tableHeaders: [
          "Période Trimestrielle",
          "Date Intervalle",
          "Ventes",
          "CA Brut (HT)",
          "Taux",
          "Part Auteur Nette",
          "Statut",
        ],
        tableRows: filteredPayments.map((p) => [
          p.period,
          p.start_date && p.end_date ? `${p.start_date} au ${p.end_date}` : "-",
          `${p.total_sales_count.toLocaleString("fr-FR")} ex.`,
          `${p.gross_revenue.toLocaleString("fr-FR")} XOF`,
          `${p.author_percentage_rate}%`,
          `${p.author_earned_amount.toLocaleString("fr-FR")} XOF`,
          p.status === "paid" ? "Payé" : "En cours",
        ]),
        totalAmount: `${periodTotals.totalEarned.toLocaleString("fr-FR")} XOF`,
        totalNotes:
          "Relevé de droits d'auteur généré sur l'intervalle sélectionné par l'auteur. Certifié par LAHAThèque Éditions & Numérique S.A.",
        filename: `releve_droits_periode_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      toast.success("Relevé de période personnalisé téléchargé en PDF !");
    } catch {
      toast.error("Erreur lors de l'exportation du relevé PDF.");
    }
  };

  const statementColumns: DataTableColumn<AuthorRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Trimestre & Période Légale",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <span className="text-[10px] text-foreground-muted font-mono block mt-0.5">
            {row.start_date && row.end_date
              ? `Du ${row.start_date} au ${row.end_date}`
              : `Règlement : ${row.payment_date}`}
          </span>
        </div>
      ),
    },
    {
      key: "total_sales_count",
      header: "Ventes Période",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-navy">
            {row.total_sales_count.toLocaleString("fr-FR")} ventes
          </span>
          {row.paper_sales_count !== undefined && row.digital_sales_count !== undefined && (
            <p className="text-[10px] text-foreground-muted">
              {row.paper_sales_count} papier &bull; {row.digital_sales_count} num.
            </p>
          )}
        </div>
      ),
    },
    {
      key: "gross_revenue",
      header: "CA Brut Généré",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted font-semibold">
          {row.gross_revenue.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "author_earned_amount",
      header: "Redevance Nette Auteur",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-gold text-xs block">
            {row.author_earned_amount.toLocaleString("fr-FR")} XOF
          </span>
          <span className="text-[10px] text-foreground-muted font-mono">
            Taux : {row.author_percentage_rate}%
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Règlement",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          {row.payment_date && (
            <span className="text-[10px] text-foreground-muted font-mono block">
              {row.status === "paid" ? `Versé le ${row.payment_date}` : `Prévu le ${row.payment_date}`}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "receipt_url",
      header: "Bordereau",
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleExportStatementPdf(row)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          Relevé Trimestriel
        </button>
      ),
    },
  ];

  const requestColumns: DataTableColumn<PayoutRequestItem>[] = [
    {
      key: "created_at",
      header: "Date de la Demande",
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-navy font-bold">{row.created_at.slice(0, 10)}</p>
          <span className="text-[10px] text-foreground-muted font-mono">Réf: {row.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Demandé",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Mode de Règlement",
      cell: (row) => (
        <div>
          <span className="font-bold text-xs text-navy uppercase">{row.payment_method}</span>
          <p className="text-[10px] text-foreground-muted font-mono truncate max-w-[150px]">
            {row.account_details}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Traitement",
      cell: (row) => {
        const mapping: Record<string, { label: string; cls: string }> = {
          pending: { label: "En attente", cls: "bg-warning/10 text-warning border-warning/30" },
          processed: { label: "Traité / Viré", cls: "bg-success/10 text-success border-success/30" },
          approved: { label: "Approuvé", cls: "bg-success/10 text-success border-success/30" },
          rejected: { label: "Rejeté", cls: "bg-error/10 text-error border-error/30" },
        };
        const current = mapping[row.status] || { label: row.status, cls: "bg-navy/10 text-navy" };
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${current.cls}`}>
            {current.label}
          </span>
        );
      },
    },
    {
      key: "transaction_reference",
      header: "Référence Transaction / Note",
      cell: (row) => (
        <div className="space-y-0.5">
          {row.transaction_reference && (
            <p className="font-mono text-[10px] text-navy font-bold">{row.transaction_reference}</p>
          )}
          {row.admin_notes && (
            <p className="text-[10px] text-foreground-muted italic">{row.admin_notes}</p>
          )}
          {!row.transaction_reference && !row.admin_notes && (
            <span className="text-[10px] text-foreground-muted font-mono">-</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Droits &amp; Paiements</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Régime Trimestriel des Droits d&apos;Auteur
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Relevés de Redevances &amp; Droits d&apos;Auteur
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Décompte trimestriel des ventes (T1: Janv-Mars, T2: Avr-Juin, T3: Juil-Sept, T4: Oct-Déc) et filtrage sur n&apos;importe quel intervalle de temps.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPayoutModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px] cursor-pointer shrink-0"
        >
          <CreditCard className="w-4 h-4" />
          Demander un Versement
        </button>
      </div>

      {/* Pédagogie : Calendrier Trimestriel Officiel */}
      <div className="p-4 sm:p-5 rounded-3xl bg-navy-light border border-navy-hover/20 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <Info className="w-4 h-4 text-gold" />
            <span>Calendrier de Liquidation des Trimestres Calendaires</span>
          </div>
          <span className="text-[11px] text-foreground-muted">
            Règlement programmé le 5 du mois suivant chaque trimestre
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T1</span>
              <span className="text-[10px] font-mono text-gold font-bold">Janv &bull; Févr &bull; Mars</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/01 au 31/03 &bull; Virement le 05 Avril</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T2</span>
              <span className="text-[10px] font-mono text-gold font-bold">Avr &bull; Mai &bull; Juin</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/04 au 30/06 &bull; Virement le 05 Juillet</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T3</span>
              <span className="text-[10px] font-mono text-gold font-bold">Juil &bull; Août &bull; Sept</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/07 au 30/09 &bull; Virement le 05 Octobre</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T4</span>
              <span className="text-[10px] font-mono text-gold font-bold">Oct &bull; Nov &bull; Déc</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/10 au 31/12 &bull; Virement le 05 Janvier</p>
          </div>
        </div>
      </div>

      {/* 2 Cartes de Synthèse Financière Dynamiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
              Solde en Attente de Versement {hasActiveFilters ? "(Sélection)" : ""}
            </span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-navy">
            {periodTotals.totalPending.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            {hasActiveFilters
              ? `Total en attente calculé sur ${filteredPayments.length} période(s)`
              : "Prochain règlement automatique programmé le 05 du mois"}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
              Total Rétribué à ce Jour {hasActiveFilters ? "(Sélection)" : ""}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-emerald-600">
            {periodTotals.totalPaid.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            {hasActiveFilters
              ? `Droits déjà versés sur la sélection (${periodTotals.totalSales} ventes)`
              : "Relevés certifiés et justifiés par les ventes de la plateforme"}
          </p>
        </div>
      </div>

      {/* Onglets Relevés Trimestriels vs Demandes de Retrait */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("statements")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "statements"
              ? "border-gold text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <FileText className="w-4 h-4 text-gold" />
          <span>Relevés Trimestriels ({filteredPayments.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "requests"
              ? "border-gold text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <History className="w-4 h-4 text-gold" />
          <span>Demandes de Retrait &amp; Virement ({payoutRequests.length})</span>
        </button>
      </div>

      {/* ─── ONGLET 1 : RELEVÉS TRIMESTRIELS & FILTRAGE PÉRIODIQUE COMPLET ──── */}
      {activeTab === "statements" && (
        <div className="space-y-4">
          {/* Barre d'Outils de Filtrage Périodique Avancé */}
          <div className="p-4 sm:p-5 rounded-3xl bg-background-secondary border border-border space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Recherche textuelle */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par mot-clé, trimestre, référence..."
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
                  </strong>{" "}
                  &bull; <span className="font-bold">{filteredPayments.length}</span> trimestre(s) décompté(s) &bull;{" "}
                  <span className="font-bold">{periodTotals.totalSales}</span> vente(s) cumulée(s)
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-foreground-muted">
                    Total droits : <strong className="text-navy font-mono">{periodTotals.totalEarned.toLocaleString("fr-FR")} XOF</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleExportFilteredRangePdf}
                    className="px-3 py-1.5 rounded-xl bg-background border border-border hover:border-gold text-navy text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" />
                    <span>Exporter la Sélection PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tableau des Relevés Trimestriels */}
          <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
            <DataTable
              rowKey="id"
              columns={statementColumns}
              data={filteredPayments}
              loading={loading}
              emptyState={
                <div className="p-12 text-center space-y-2">
                  <FileText className="w-8 h-8 text-foreground-muted mx-auto" />
                  <p className="text-sm font-bold text-navy">Aucun relevé pour cet intervalle</p>
                  <p className="text-xs text-foreground-muted">
                    Modifiez vos filtres de dates ou réinitialisez la sélection pour afficher les autres trimestres.
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-3 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les filtres</span>
                    </button>
                  )}
                </div>
              }
            />
          </div>
        </div>
      )}

      {/* ─── ONGLET 2 : DEMANDES DE RETRAIT & VIREMENT ───────────────────────── */}
      {activeTab === "requests" && (
        <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
          <DataTable
            rowKey="id"
            columns={requestColumns}
            data={payoutRequests}
            loading={loading}
            emptyState={
              <div className="p-12 text-center space-y-2">
                <History className="w-8 h-8 text-foreground-muted mx-auto" />
                <p className="text-sm font-bold text-navy">Aucune demande de retrait émise</p>
                <p className="text-xs text-foreground-muted">
                  Cliquez sur &ldquo;Demander un Versement&rdquo; pour initier un retrait vers votre compte MoMo ou Banque.
                </p>
              </div>
            }
          />
        </div>
      )}

      {/* Composant Modal de Demande de Versement */}
      <AuthorPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        maxAmount={periodTotals.totalPending}
        onSuccess={loadData}
      />
    </div>
  );
}
