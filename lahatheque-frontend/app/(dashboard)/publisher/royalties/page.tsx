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
  Calendar,
  RotateCcw,
  Search,
  Info,
  Clock,
  History,
  BookOpen,
  Laptop,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getPublisherRoyaltyPayments,
  getPublisherPayoutRequests,
  getPublisherKpis,
  type PublisherPayoutRequestItem,
} from "@/lib/services/publisher";
import type { PublisherRoyaltyPayment, PublisherKpis } from "@/lib/types/publisher";
import { generateOfficialPdf } from "@/lib/services/export-service";
import { useAuth } from "@/hooks/use-auth";
import { PublisherPayoutModal } from "@/components/features/publisher/publisher-payout-modal";

type QuarterFilter = "all" | 1 | 2 | 3 | 4;

export default function PublisherRoyaltiesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"statements" | "requests">("statements");
  const [payments, setPayments] = useState<PublisherRoyaltyPayment[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PublisherPayoutRequestItem[]>([]);
  const [kpis, setKpis] = useState<PublisherKpis | null>(null);
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
    try {
      const [pData, rData, kData] = await Promise.all([
        getPublisherRoyaltyPayments(),
        getPublisherPayoutRequests(),
        getPublisherKpis(),
      ]);
      setPayments(pData);
      setPayoutRequests(rData);
      setKpis(kData);
    } catch {
      toast.error("Erreur lors du chargement des redevances éditeur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Années disponibles calculées dynamiquement et évolutives (basées sur les règlements effectifs)
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
      .reduce((acc, p) => acc + (p.net_royalty_amount || p.amount || 0), 0);

    const totalProcessing = filteredPayments
      .filter((p) => p.status === "processing" || p.status === "pending")
      .reduce((acc, p) => acc + (p.net_royalty_amount || p.amount || 0), 0);

    const totalSales = filteredPayments.reduce(
      (acc, p) => acc + (p.total_sales_amount || p.gross_revenue || (p.net_royalty_amount || p.amount || 0) * 4.5),
      0
    );

    const totalNetRoyalties = filteredPayments.reduce(
      (acc, p) => acc + (p.net_royalty_amount || p.amount || 0),
      0
    );

    const totalUnitsSold = filteredPayments.reduce(
      (acc, p) => acc + (p.total_sales_count || 0),
      0
    );

    return { totalPaid, totalProcessing, totalSales, totalNetRoyalties, totalUnitsSold };
  }, [filteredPayments]);

  // Déduction rigoureuse des demandes de versement (retraits)
  const totalCommitted = useMemo(() => {
    return payoutRequests
      .filter((r) => ["pending", "approved", "processed", "paid"].includes(r.status))
      .reduce((acc, r) => acc + r.amount, 0);
  }, [payoutRequests]);

  const pendingRequestsTotal = useMemo(() => {
    return payoutRequests
      .filter((r) => ["pending", "approved"].includes(r.status))
      .reduce((acc, r) => acc + r.amount, 0);
  }, [payoutRequests]);

  const availableRetirableBalance = useMemo(() => {
    if (kpis && typeof kpis.pendingRoyalties === "number") {
      return kpis.pendingRoyalties;
    }
    const totalEarnedAll = payments.reduce(
      (acc, p) => acc + (p.net_royalty_amount || p.amount || 0),
      0
    );
    return Math.max(0, totalEarnedAll - totalCommitted);
  }, [kpis, payments, totalCommitted]);

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

  // Export PDF d'un bordereau trimestriel spécifique avec décompte par livre
  const handleExportStatementPdf = async (row: PublisherRoyaltyPayment) => {
    try {
      const amount = row.net_royalty_amount || row.amount || 0;
      const hasDetailedBooks = Boolean(row.books && row.books.length > 0);

      const tableHeaders = hasDetailedBooks
        ? [
            "Titre de l'Ouvrage",
            "Format(s)",
            "Quantité",
            "CA Brut (HT)",
            "Taux Éditeur",
            "Redevance Nette",
          ]
        : [
            "Période Décomptée",
            "Volume Catalogue (HT)",
            "Taux de Reversement",
            "Montant Net Dû",
            "Statut",
          ];

      const tableRows = hasDetailedBooks
        ? row.books!.map((b) => {
            const formats: string[] = [];
            if (b.format_breakdown.digital > 0) formats.push(`${b.format_breakdown.digital} num.`);
            if (b.format_breakdown.paper > 0) formats.push(`${b.format_breakdown.paper} pap.`);
            if (b.format_breakdown.audio > 0) formats.push(`${b.format_breakdown.audio} aud.`);
            const formatStr = formats.length > 0 ? formats.join(" / ") : "Numérique";

            const formattedSales = Math.round(b.sales_count).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const formattedGross = Math.round(b.gross_revenue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
            const formattedNet = Math.round(b.net_royalty).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

            return [
              b.title,
              formatStr,
              `${formattedSales} ex.`,
              `${formattedGross} XOF`,
              `${b.royalty_rate} %`,
              `${formattedNet} XOF`,
            ];
          })
        : [
            [
              row.period,
              `${Math.round(row.total_sales_amount || amount * 4.5).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`,
              `${row.royalty_rate || kpis?.contractualRoyaltyRate || 22} %`,
              `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`,
              row.status === "paid" ? "Versé" : "En cours",
            ],
          ];

      const columnStyles = hasDetailedBooks
        ? {
            0: { cellWidth: 64, overflow: "linebreak" },
            1: { cellWidth: 22, overflow: "linebreak" },
            2: { halign: "right", cellWidth: 16 },
            3: { halign: "right", cellWidth: 28 },
            4: { halign: "center", cellWidth: 18 },
            5: { halign: "right", cellWidth: 34, fontStyle: "bold" },
          }
        : undefined;

      const quarterShortLabel = row.quarter
        ? `T${row.quarter} ${row.year || 2026}`
        : "Trimestre d'Exercice";

      const publisherName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(" ") || "Maison d'Édition Partenaire"
        : "Maison d'Édition Partenaire";
      const publisherEmail = user?.email || "editeur@lahatheque.bj";
      const publisherPhone = user?.phone ? ` | ${user.phone}` : "";

      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `REL-EDIT-${row.year || 2026}-T${row.quarter || 3}`,
        date: row.payment_date || row.paid_at || new Date().toLocaleDateString("fr-FR"),
        period: row.period,
        recipient: {
          name: publisherName,
          roleOrTitle: "Éditeur Distributeur Agréé LAHAThèque",
          addressOrCampus: `Compte Éditeur Agréé • ID: ${user?.id ? user.id.slice(0, 8).toUpperCase() : "EDIT-CERT"}`,
          emailOrPhone: `${publisherEmail}${publisherPhone}`,
        },
        summaryCards: [
          { label: "Période Décomptée", value: quarterShortLabel },
          {
            label: "Volume Ventes",
            value: `${Math.round(row.total_sales_amount || amount * 4.5).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`,
          },
          {
            label: "Quote-part Éditeur",
            value: `${row.royalty_rate || kpis?.contractualRoyaltyRate || 22} % (Contrat)`,
          },
          {
            label: "Statut Règlement",
            value: row.status === "paid" ? "Règlement Effectué" : "En Traitement",
          },
        ],
        tableHeaders,
        tableRows,
        columnStyles,
        totalAmount: `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`,
        totalNotes:
          "Bordereau officiel certifié par LAHAThèque Éditions & Numérique S.A. Règlement exécuté conformément aux conditions contractuelles éditeur (liquidation trimestrielle au 10 du mois échu).",
        filename: `bordereau_redevances_editeur_${row.period.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
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
          : "Période Globale Consolidée";

      const fmtSales = Math.round(periodTotals.totalSales).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      const fmtNet = Math.round(periodTotals.totalNetRoyalties).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

      const publisherName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(" ") || "Maison d'Édition Partenaire"
        : "Maison d'Édition Partenaire";
      const publisherEmail = user?.email || "editeur@lahatheque.bj";
      const publisherPhone = user?.phone ? ` | ${user.phone}` : "";

      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `RECAP-PERIODE-EDIT-${new Date().getFullYear()}`,
        date: new Date().toLocaleDateString("fr-FR"),
        period: rangeLabel,
        recipient: {
          name: publisherName,
          roleOrTitle: "Éditeur Distributeur Agréé LAHAThèque",
          addressOrCampus: `Compte Éditeur Agréé • ID: ${user?.id ? user.id.slice(0, 8).toUpperCase() : "EDIT-CERT"}`,
          emailOrPhone: `${publisherEmail}${publisherPhone}`,
        },
        summaryCards: [
          { label: "Intervalle Filtré", value: rangeLabel },
          { label: "Bordereaux Inclus", value: `${filteredPayments.length} trimestre(s)` },
          { label: "Chiffre d'Affaires Période", value: `${fmtSales} XOF` },
          { label: "Total Redevances Nettes", value: `${fmtNet} XOF` },
        ],
        tableHeaders: [
          "Période / Trimestre",
          "Date Règlement",
          "Volume Ventes (HT)",
          "Taux",
          "Montant Net Dû",
          "Statut",
        ],
        tableRows: filteredPayments.map((p) => {
          const amt = p.net_royalty_amount || p.amount || 0;
          const gross = p.total_sales_amount || p.gross_revenue || amt * 4.5;
          return [
            p.period,
            p.payment_date || p.paid_at
              ? new Date(p.payment_date || p.paid_at!).toLocaleDateString("fr-FR")
              : "Prévu le 10",
            `${Math.round(gross).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`,
            `${p.royalty_rate || kpis?.contractualRoyaltyRate || 22} %`,
            `${Math.round(amt).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XOF`,
            p.status === "paid" ? "Versé" : "En cours",
          ];
        }),
        totalAmount: `${fmtNet} XOF`,
        totalNotes:
          "Relevé récapitulatif périodique consolidé certifié par LAHAThèque Éditions & Numérique S.A. Document comptable justificatif délivré sur requête de l'éditeur partenaire.",
        filename: `releve_periodique_redevances_editeur_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      toast.success("Relevé périodique consolidé téléchargé avec succès !");
    } catch {
      toast.error("Erreur lors de la génération du relevé récapitulatif.");
    }
  };

  const statementColumns: DataTableColumn<PublisherRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Trimestre & Période Légale",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <span className="text-[10px] text-foreground-muted font-mono block mt-0.5">
            {row.start_date && row.end_date
              ? `Du ${row.start_date} au ${row.end_date}`
              : `Règlement : ${row.payment_date || "Prévu le 10"}`}
          </span>
        </div>
      ),
    },
    {
      key: "total_sales_count" as keyof PublisherRoyaltyPayment,
      header: "Ventes Période",
      cell: (row) => {
        const count = row.total_sales_count || (row.books ? row.books.reduce((acc, b) => acc + b.sales_count, 0) : 0);
        return (
          <div>
            <span className="font-mono text-xs font-bold text-navy">
              {count.toLocaleString("fr-FR")} ventes
            </span>
            {row.paper_sales_count !== undefined && row.digital_sales_count !== undefined && (
              <p className="text-[10px] text-foreground-muted">
                {row.paper_sales_count} papier &bull; {row.digital_sales_count} num.
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "total_sales_amount",
      header: "CA Brut Généré",
      hideOnMobile: true,
      cell: (row) => {
        const gross =
          row.total_sales_amount ||
          row.gross_revenue ||
          (row.net_royalty_amount || row.amount || 0) * 4.5;
        return (
          <span className="font-mono text-xs text-foreground-muted font-semibold">
            {Math.round(gross).toLocaleString("fr-FR")} XOF
          </span>
        );
      },
    },
    {
      key: "net_royalty_amount",
      header: "Redevance Nette Éditeur",
      cell: (row) => {
        const amt = row.net_royalty_amount || row.amount || 0;
        return (
          <div>
            <span className="font-mono font-bold text-gold text-xs block">
              {Math.round(amt).toLocaleString("fr-FR")} XOF
            </span>
            <span className="text-[10px] text-foreground-muted font-mono">
              Taux : {row.royalty_rate || kpis?.contractualRoyaltyRate || 22}%
            </span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut Règlement",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status === "paid" ? "paid" : "pending"} />
          {row.payment_date && (
            <span className="text-[10px] text-foreground-muted font-mono block">
              {row.status === "paid"
                ? `Versé le ${row.payment_date}`
                : `Prévu le ${row.payment_date}`}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "id",
      header: "Bordereau",
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleExportStatementPdf(row)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          <span>Relevé Trimestriel</span>
        </button>
      ),
    },
  ];

  const requestColumns: DataTableColumn<PublisherPayoutRequestItem>[] = [
    {
      key: "created_at",
      header: "Date de la Demande",
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-navy font-bold">{row.created_at.slice(0, 10)}</p>
          <span className="text-[10px] text-foreground-muted font-mono">
            Réf : {row.reference || row.id.slice(0, 8)}
          </span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Demandé",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "period",
      header: "Intitulé / Canal",
      cell: (row) => (
        <div>
          <span className="font-bold text-xs text-navy leading-snug">{row.period}</span>
          {row.paid_at && (
            <p className="text-[10px] text-foreground-muted font-mono">
              Payé le {new Date(row.paid_at).toLocaleDateString("fr-FR")}
            </p>
          )}
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
          paid: { label: "Versé", cls: "bg-success/10 text-success border-success/30" },
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
            Revenus &amp; Redevances Éditeur
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances Dues &amp; Règlements
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Décompte trimestriel des ventes du catalogue partenaire (T1: Janv-Mars, T2: Avr-Juin, T3: Juil-Sept, T4: Oct-Déc) et historique certifié.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPayoutModalOpen(true)}
          disabled={availableRetirableBalance < 50000}
          className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-xs min-h-[44px] shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>Demander un Virement</span>
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
            Éditeur Partenaire Certifié &bull; Réf : {kpis?.contractReference || "CTR-PUB-2025-08"}
          </h3>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Le calcul des redevances s&apos;effectue en temps réel sur les ventes unitaires (numériques et imprimées) et les commandes institutionnelles B2B.
          </p>
        </div>

        <div className="bg-navy-dark p-4 rounded-2xl border border-gold/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-white/60 font-bold uppercase block">Taux Contractuel Convenu</span>
            <span className="font-bold text-gold text-2xl font-mono">{kpis?.contractualRoyaltyRate ?? 22}%</span>
            <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-gold" /> Non modifiable &bull; Stipul&eacute; au contrat sign&eacute;
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
              <span className="text-[10px] font-mono text-gold font-bold">Janv &bull; Févr &bull; Mars</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/01 au 31/03 &bull; Virement le 10 Avril</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T2</span>
              <span className="text-[10px] font-mono text-gold font-bold">Avr &bull; Mai &bull; Juin</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/04 au 30/06 &bull; Virement le 10 Juillet</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T3</span>
              <span className="text-[10px] font-mono text-gold font-bold">Juil &bull; Août &bull; Sept</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/07 au 30/09 &bull; Virement le 10 Octobre</p>
          </div>

          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">T4</span>
              <span className="text-[10px] font-mono text-gold font-bold">Oct &bull; Nov &bull; Déc</span>
            </div>
            <p className="text-[10px] text-foreground-muted">Du 01/10 au 31/12 &bull; Virement le 10 Janvier</p>
          </div>
        </div>
      </div>

      {/* Cartes de Synthèse Financière Dynamique */}
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
              Solde Retirable Disponible
            </span>
            <div className="p-2 rounded-xl bg-warning/10 text-warning">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-bold text-2xl text-navy font-mono">
            {availableRetirableBalance.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            {pendingRequestsTotal > 0
              ? `Dont ${pendingRequestsTotal.toLocaleString("fr-FR")} XOF en cours (Seuil min : 50 000 XOF)`
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
              ? "Versements exécutés sur la sélection filtrée"
              : "Versements exécutés avec succès sur votre compte"}
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
          <span>Demandes de Versement ({payoutRequests.length})</span>
        </button>
      </div>

      {/* ─── ONGLET 1 : RELEVÉS TRIMESTRIELS & DÉCOMPTE DÉTAILLÉ ──── */}
      {activeTab === "statements" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-navy text-lg">
                Bordereaux Trimestriels par Période ({filteredPayments.length})
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Cliquez sur une ligne pour inspecter le détail des titres vendus sur chaque trimestre.
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
                  placeholder="Rechercher par période, référence, trimestre..."
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

            {/* Ligne 2 : Filtre par Trimestre & Intervalle Personnalisé Libre */}
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
                  &bull; <span className="font-bold">{filteredPayments.length}</span> trimestre(s) décompté(s) &bull;{" "}
                  Total redevances nettes :{" "}
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

          {/* Tableau des Relevés Trimestriels avec Déroulé des Ouvrages */}
          <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
            <DataTable
              rowKey="id"
              columns={statementColumns}
              data={filteredPayments}
              loading={loading}
              renderExpandedRow={(row) => {
                if (!row.books || row.books.length === 0) {
                  return (
                    <div className="p-4 sm:p-5 text-center rounded-2xl bg-background border border-border text-foreground-muted text-xs space-y-1">
                      <BookOpen className="w-5 h-5 mx-auto text-gold/60" />
                      <p className="font-serif font-bold text-navy text-xs">
                        Aucun ouvrage vendu sur ce trimestre
                      </p>
                      <p className="text-[11px] text-foreground-muted">
                        Les ventes et redevances de ce trimestre apparaîtront dès confirmation des commandes.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-background border border-border shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/70">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gold shrink-0" />
                        <h4 className="font-serif font-bold text-navy text-xs sm:text-sm">
                          Détail des Ouvrages du Catalogue Vendus ({row.books.length})
                        </h4>
                      </div>
                      <span className="text-[10px] text-foreground-muted font-mono">
                        {row.period}
                      </span>
                    </div>

                    {/* Table Desktop & Tablet (sm+) */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-background-secondary/60">
                            <th className="p-2.5 font-bold uppercase tracking-wider text-navy text-[10px]">
                              Ouvrage
                            </th>
                            <th className="p-2.5 font-bold uppercase tracking-wider text-navy text-[10px]">
                              Format(s)
                            </th>
                            <th className="p-2.5 font-bold uppercase tracking-wider text-navy text-[10px] text-right">
                              Quantité
                            </th>
                            <th className="p-2.5 font-bold uppercase tracking-wider text-navy text-[10px] text-right">
                              CA Brut (HT)
                            </th>
                            <th className="p-2.5 font-bold uppercase tracking-wider text-navy text-[10px] text-center">
                              Taux Éditeur
                            </th>
                            <th className="p-2.5 font-bold uppercase tracking-wider text-navy text-[10px] text-right">
                              Redevance Nette
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-mono">
                          {row.books.map((b) => (
                            <tr key={b.book_id} className="hover:bg-background-secondary/30 transition-colors">
                              <td className="p-2.5 font-sans">
                                <div className="flex items-center gap-3">
                                  {b.cover_url ? (
                                    <img
                                      src={b.cover_url}
                                      alt={b.title}
                                      className="w-8 h-11 object-cover rounded-md border border-border shadow-2xs shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-11 rounded-md bg-navy/10 flex items-center justify-center text-navy shrink-0">
                                      <BookOpen className="w-4 h-4 text-gold" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-serif font-bold text-xs text-navy truncate max-w-[220px] md:max-w-[280px]">
                                      {b.title}
                                    </p>
                                    <p className="text-[10px] text-foreground-muted truncate">
                                      {b.discipline} {b.isbn ? `• ISBN: ${b.isbn}` : ""}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2.5 font-sans">
                                <div className="flex flex-wrap gap-1">
                                  {b.format_breakdown.digital > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-navy/10 text-navy font-bold text-[10px] inline-flex items-center gap-1">
                                      <Laptop className="w-3 h-3" />
                                      {b.format_breakdown.digital} num.
                                    </span>
                                  )}
                                  {b.format_breakdown.paper > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-gold/10 text-gold font-bold text-[10px] inline-flex items-center gap-1">
                                      <BookOpen className="w-3 h-3" />
                                      {b.format_breakdown.paper} pap.
                                    </span>
                                  )}
                                  {b.format_breakdown.audio > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-background-secondary text-foreground-muted font-bold text-[10px]">
                                      {b.format_breakdown.audio} aud.
                                    </span>
                                  )}
                                  {b.format_breakdown.digital === 0 &&
                                    b.format_breakdown.paper === 0 &&
                                    b.format_breakdown.audio === 0 && (
                                      <span className="text-[10px] text-foreground-muted">-</span>
                                    )}
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-bold text-navy">
                                {b.sales_count.toLocaleString("fr-FR")} ex.
                              </td>
                              <td className="p-2.5 text-right text-foreground-muted">
                                {b.gross_revenue.toLocaleString("fr-FR")} XOF
                              </td>
                              <td className="p-2.5 text-center text-navy font-semibold">
                                {b.royalty_rate} %
                              </td>
                              <td className="p-2.5 text-right font-bold text-gold">
                                {b.net_royalty.toLocaleString("fr-FR")} XOF
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Cards Mobile pour la sous-table (< sm) */}
                    <div className="sm:hidden divide-y divide-border/40 space-y-2">
                      {row.books.map((b) => (
                        <div key={b.book_id} className="pt-2 space-y-1.5 text-xs">
                          <div className="flex items-start gap-2.5">
                            {b.cover_url ? (
                              <img
                                src={b.cover_url}
                                alt={b.title}
                                className="w-9 h-12 object-cover rounded-md border border-border shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-12 rounded-md bg-navy/10 flex items-center justify-center text-navy shrink-0">
                                <BookOpen className="w-4 h-4 text-gold" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-serif font-bold text-xs text-navy leading-snug">
                                {b.title}
                              </p>
                              <p className="text-[10px] text-foreground-muted">{b.discipline}</p>
                              <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                                <span className="text-foreground-muted">{b.sales_count} ex. vendus</span>
                                <span className="font-bold text-gold">
                                  {b.net_royalty.toLocaleString("fr-FR")} XOF
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
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
                <p className="text-sm font-bold text-navy">Aucune demande de virement émise</p>
                <p className="text-xs text-foreground-muted">
                  Cliquez sur &ldquo;Demander un Virement&rdquo; pour initier un retrait vers votre compte bancaire d&apos;entreprise ou MoMo Pro (dès 50 000 XOF).
                </p>
              </div>
            }
          />
        </div>
      )}

      {/* Composant Modal de Demande de Versement Éditeur */}
      <PublisherPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        maxAmount={availableRetirableBalance}
        onSuccess={loadData}
      />
    </div>
  );
}
